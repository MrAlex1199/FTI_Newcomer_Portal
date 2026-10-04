/**
 * MongoDB Performance & Index Benchmark Suite
 * Tests live Atlas query execution plans, IXSCAN utilization, lean() overhead reduction, and In-Memory TTL caching speed.
 *
 * Usage: node src/utils/dbBenchmark.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import cacheService from '../services/cacheService.js';
import {
  FloorPlan,
  MaintenanceTicket,
  Booking,
  BookingResource,
  ChatMessage,
  Department,
  CompanyInfo,
  AuditLog,
} from '../models/index.js';

dotenv.config();

const runBenchmark = async () => {
  console.log('\n======================================================');
  console.log('🚀 FTI Welcome Hub - MongoDB Database Performance Suite');
  console.log('======================================================\n');

  await connectDB();

  console.log('\n🔄 Synchronizing and Building Indexes on MongoDB Atlas...');
  const models = [
    { name: 'FloorPlan', model: FloorPlan },
    { name: 'MaintenanceTicket', model: MaintenanceTicket },
    { name: 'Booking', model: Booking },
    { name: 'BookingResource', model: BookingResource },
    { name: 'ChatMessage', model: ChatMessage },
    { name: 'Department', model: Department },
    { name: 'CompanyInfo', model: CompanyInfo },
    { name: 'AuditLog', model: AuditLog },
  ];

  for (const { name, model } of models) {
    try {
      await model.syncIndexes();
      const indexes = await model.collection.indexes();
      console.log(`  ✓ ${name.padEnd(20)} : ${indexes.length} active indexes in Atlas`);
    } catch (err) {
      console.warn(`  ⚠️ Failed to sync ${name}: ${err.message}`);
    }
  }

  console.log('\n📊 Running Query Execution & Index Analysis...\n');

  const results = [];

  // Helper to test explain executionStats
  const testExplainQuery = async (label, queryPromiseFn) => {
    const start = performance.now();
    const explanation = await queryPromiseFn();
    const duration = (performance.now() - start).toFixed(2);

    const stats = explanation.executionStats || {};
    const winningStage = explanation.queryPlanner?.winningPlan?.inputStage || explanation.queryPlanner?.winningPlan || {};

    let stage = winningStage.stage || stats.executionStages?.stage || 'UNKNOWN';
    let indexName = winningStage.indexName || stats.executionStages?.indexName || 'None';

    if (stage === 'FETCH' && winningStage.inputStage) {
      stage = `${winningStage.stage} -> ${winningStage.inputStage.stage}`;
      indexName = winningStage.inputStage.indexName || indexName;
    }

    const isOptimal = stage.includes('IXSCAN') || indexName !== 'None';

    results.push({
      Benchmark: label,
      Stage: stage,
      IndexUsed: indexName,
      DocsExamined: stats.totalDocsExamined ?? 0,
      DocsReturned: stats.nReturned ?? 0,
      Latency: `${duration} ms`,
      Optimal: isOptimal ? '✅ IXSCAN' : '⚠️ COLLSCAN',
    });
  };

  // 1. FloorPlan: Compound index { buildingId: 1, floorNumber: 1 }
  await testExplainQuery('FloorPlan Compound (buildingId + floor)', () =>
    FloorPlan.find({ buildingId: 'b1', floorNumber: 1 }).explain('executionStats')
  );

  // 2. FloorPlan: Multikey index { 'assets.id': 1 }
  await testExplainQuery('FloorPlan Multikey Asset ID (assets.id)', () =>
    FloorPlan.find({ 'assets.id': 'asset-seed-1' }).explain('executionStats')
  );

  // 3. MaintenanceTicket: Compound { buildingId: 1, floorNumber: 1 }
  await testExplainQuery('MaintenanceTicket Location Index', () =>
    MaintenanceTicket.find({ buildingId: 'b1', floorNumber: 1 }).explain('executionStats')
  );

  // 4. MaintenanceTicket: Compound { status: 1, urgency: 1, createdAt: -1 }
  await testExplainQuery('MaintenanceTicket Status + Urgency + Date', () =>
    MaintenanceTicket.find({ status: 'pending', urgency: 'high' }).sort({ createdAt: -1 }).explain('executionStats')
  );

  // 5. Booking: Overlap index { resourceId: 1, status: 1, startTime: 1, endTime: 1 }
  const dummyId = new mongoose.Types.ObjectId();
  await testExplainQuery('Booking Resource Conflict Overlap', () =>
    Booking.find({
      resourceId: dummyId,
      status: 'confirmed',
      startTime: { $lt: new Date() },
      endTime: { $gt: new Date() },
    }).explain('executionStats')
  );

  // 6. Booking: User history { bookedBy: 1, createdAt: -1 }
  await testExplainQuery('Booking User History Pagination', () =>
    Booking.find({ bookedBy: dummyId }).sort({ createdAt: -1 }).explain('executionStats')
  );

  // 7. ChatMessage: Compound { conversationId: 1, createdAt: -1 }
  await testExplainQuery('ChatMessage Conversation Reverse Timeline', () =>
    ChatMessage.find({ conversationId: dummyId }).sort({ createdAt: -1 }).explain('executionStats')
  );

  // 8. AuditLog: Compound { action: 1, createdAt: -1 }
  await testExplainQuery('AuditLog Action Filter & Date Sort', () =>
    AuditLog.find({ action: 'create' }).sort({ createdAt: -1 }).explain('executionStats')
  );

  console.table(results);

  // --------------------------------------------------------------------------
  // Lean vs Mongoose Hydration Benchmark
  // --------------------------------------------------------------------------
  console.log('\n🔬 Profiling .lean() vs Full Mongoose Document Hydration...');
  const iterations = 5;

  let totalMongooseTime = 0;
  for (let i = 0; i < iterations; i++) {
    const s = performance.now();
    await FloorPlan.find();
    totalMongooseTime += performance.now() - s;
  }
  const avgMongooseTime = (totalMongooseTime / iterations).toFixed(2);

  let totalLeanTime = 0;
  for (let i = 0; i < iterations; i++) {
    const s = performance.now();
    await FloorPlan.find().lean();
    totalLeanTime += performance.now() - s;
  }
  const avgLeanTime = (totalLeanTime / iterations).toFixed(2);

  const speedup = (avgMongooseTime / avgLeanTime).toFixed(2);

  console.log(`  • Full Document Hydration Average : ${avgMongooseTime} ms`);
  console.log(`  • Plain JavaScript Object (.lean()): ${avgLeanTime} ms`);
  console.log(`  ⚡ Speedup: ~${speedup}x faster with .lean()\n`);

  // --------------------------------------------------------------------------
  // In-Memory TTL Cache Latency Test
  // --------------------------------------------------------------------------
  console.log('⚡ Profiling In-Memory TTL Cache vs Live Atlas Query...');

  // Miss (Database Fetch)
  const missStart = performance.now();
  await cacheService.remember('benchmark:company_info', 60, async () => {
    return await CompanyInfo.findOne({ key: 'default' }).lean();
  });
  const dbLatency = (performance.now() - missStart).toFixed(2);

  // Hit (In-Memory Fetch)
  const hitStart = performance.now();
  await cacheService.remember('benchmark:company_info', 60, async () => {
    return await CompanyInfo.findOne({ key: 'default' }).lean();
  });
  const cacheLatency = (performance.now() - hitStart).toFixed(4);

  const cacheSpeedup = (Number(dbLatency) / Number(cacheLatency || 0.001)).toFixed(0);

  console.log(`  • Cold / DB Hit Latency   : ${dbLatency} ms (Network I/O to Atlas)`);
  console.log(`  • Warm / Cache Hit Latency : ${cacheLatency} ms (In-Memory 0ms roundtrip)`);
  console.log(`  🚀 In-Memory Cache is ~${cacheSpeedup}x faster\n`);

  console.log('Cache Stats:', cacheService.getStats());

  console.log('\n======================================================');
  console.log('✅ Benchmark Completed Successfully!');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

runBenchmark().catch((err) => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});
