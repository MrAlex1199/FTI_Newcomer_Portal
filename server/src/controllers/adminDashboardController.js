import {
  Announcement,
  AuditLog,
  Department,
  Employee,
  FAQ,
  Feedback,
  Intern,
  InternBatch,
  KnowledgeArticle,
  Policy,
} from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';

const bucket = (label, count, id = null) => ({ ...(id && { id: String(id) }), label: label || 'Unassigned', count });

const groupedBy = async (Model, field, filter = {}) => Model.aggregate([
  { $match: filter },
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } },
]);

const liveAnnouncementFilter = (now) => ({
  status: 'published',
  publishAt: { $lte: now },
  $and: [{ $or: [{ expireAt: null }, { expireAt: { $gt: now } }] }],
});

const departmentLabels = async (rows) => {
  const ids = rows.map((row) => row._id).filter(Boolean);
  if (!ids.length) return new Map();
  const departments = await Department.find({ _id: { $in: ids } }).select('name code').lean();
  return new Map(departments.map((department) => [String(department._id), department]));
};

const batchLabels = async (rows) => {
  const ids = rows.map((row) => row._id).filter(Boolean);
  if (!ids.length) return new Map();
  const batches = await InternBatch.find({ _id: { $in: ids } }).select('code title').lean();
  return new Map(batches.map((batchItem) => [String(batchItem._id), batchItem]));
};

const mapDepartmentBuckets = (rows, labels) => rows.map((row) => {
  const labelData = labels.get(String(row._id));
  return bucket(labelData ? `${labelData.name} (${labelData.code})` : 'Unassigned', row.count, row._id);
});

const mapBatchBuckets = (rows, labels) => rows.map((row) => {
  const labelData = labels.get(String(row._id));
  return bucket(labelData?.code || labelData?.title || 'Unassigned', row.count, row._id);
});

export const getAdminDashboardStatistics = asyncHandler(async (req, res) => {
  const now = new Date();
  const activityLimit = Math.min(Math.max(Number.parseInt(req.query.activityLimit, 10) || 8, 1), 20);
  const activeInternFilter = { startDate: { $lte: now }, endDate: { $gte: now } };
  const upcomingInternFilter = { startDate: { $gt: now } };
  const pendingFeedbackFilter = { status: { $in: ['pending', 'in_review'] } };
  const unpublishedAnnouncementFilter = { status: { $ne: 'published' } };
  const unpublishedPolicyFilter = { status: { $ne: 'published' } };
  const unpublishedKnowledgeFilter = { status: { $ne: 'published' } };

  const [
    totalEmployees,
    activeEmployees,
    activeInterns,
    upcomingInterns,
    activeDepartments,
    liveAnnouncements,
    knowledgeArticles,
    pendingFeedback,
    feedbackByCategory,
    feedbackByStatus,
    feedbackRating,
    pendingAnnouncements,
    pendingPolicies,
    pendingFaqs,
    pendingKnowledgeArticles,
    internsByUniversity,
    internsByDepartment,
    employeesByDepartment,
    internsByBatch,
    activity,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Intern.countDocuments(activeInternFilter),
    Intern.countDocuments(upcomingInternFilter),
    Department.countDocuments({ isActive: true }),
    Announcement.countDocuments(liveAnnouncementFilter(now)),
    KnowledgeArticle.countDocuments({ status: 'published' }),
    Feedback.countDocuments(pendingFeedbackFilter),
    groupedBy(Feedback, 'category'),
    groupedBy(Feedback, 'status'),
    Feedback.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, average: { $avg: '$rating' } } },
    ]),
    Announcement.countDocuments(unpublishedAnnouncementFilter),
    Policy.countDocuments(unpublishedPolicyFilter),
    FAQ.countDocuments({ isPublished: false }),
    KnowledgeArticle.countDocuments(unpublishedKnowledgeFilter),
    groupedBy(Intern, 'university'),
    groupedBy(Intern, 'departmentId'),
    groupedBy(Employee, 'departmentId', { isActive: true }),
    groupedBy(Intern, 'batchId'),
    AuditLog.find().select('action entity entityId userId createdAt').populate('userId', 'username').sort({ createdAt: -1 }).limit(activityLimit).lean(),
  ]);

  const [internDepartmentLabels, employeeDepartmentLabels, internBatchLabels] = await Promise.all([
    departmentLabels(internsByDepartment),
    departmentLabels(employeesByDepartment),
    batchLabels(internsByBatch),
  ]);

  const pending = {
    announcements: pendingAnnouncements,
    policies: pendingPolicies,
    faqs: pendingFaqs,
    knowledgeArticles: pendingKnowledgeArticles,
    feedback: pendingFeedback,
    total: pendingAnnouncements + pendingPolicies + pendingFaqs + pendingKnowledgeArticles + pendingFeedback,
  };

  const feedbackTotal = feedbackByStatus.reduce((sum, row) => sum + row.count, 0);
  const feedbackResolved = feedbackByStatus.find((row) => row._id === 'resolved')?.count || 0;
  const feedbackStats = {
    total: feedbackTotal,
    pending: pendingFeedback,
    resolved: feedbackResolved,
    averageRating: feedbackRating[0]?.average ? Number(feedbackRating[0].average.toFixed(2)) : null,
    byCategory: feedbackByCategory.map((row) => bucket(row._id, row.count)),
    byStatus: feedbackByStatus.map((row) => bucket(row._id, row.count)),
  };

  const metrics = {
    totalEmployees,
    activeEmployees,
    activeInterns,
    upcomingInterns,
    departments: activeDepartments,
    liveAnnouncements,
    knowledgeArticles,
    pendingFeedback,
    feedbackTotal,
    feedbackResolved,
    feedbackAverageRating: feedbackStats.averageRating,
    unpublishedContent: pendingAnnouncements + pendingPolicies + pendingFaqs + pendingKnowledgeArticles,
  };

  const recentActivity = activity.map((entry) => ({
    id: String(entry._id),
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ? String(entry.entityId) : null,
    actor: entry.userId?.username || 'System',
    createdAt: entry.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      generatedAt: now.toISOString(),
      metrics,
      charts: {
        internsByUniversity: internsByUniversity.map((row) => bucket(row._id, row.count)),
        internsByDepartment: mapDepartmentBuckets(internsByDepartment, internDepartmentLabels),
        employeesByDepartment: mapDepartmentBuckets(employeesByDepartment, employeeDepartmentLabels),
        internsByBatch: mapBatchBuckets(internsByBatch, internBatchLabels),
      },
      pending,
      feedback: feedbackStats,
      recentActivity,
    },
  });
});
