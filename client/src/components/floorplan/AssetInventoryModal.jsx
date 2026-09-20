import React, { useState, useMemo } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

export default function AssetInventoryModal({
  isOpen,
  onClose,
  currentFloorPlan,
  allFloorPlans = [],
  onTargetAsset,
  onRequestMaintenance,
}) {
  const { t } = useLanguage();
  const [scope, setScope] = useState('floor'); // 'floor' | 'campus'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'cctv' | 'computer' | 'printer' | 'vehicle' | 'other'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'maintenance' | 'broken'

  // Extract all assets with campus/building metadata
  const allCampusAssets = useMemo(() => {
    const list = [];
    allFloorPlans.forEach((plan) => {
      if (!plan.assets || !Array.isArray(plan.assets)) return;
      plan.assets.forEach((asset) => {
        // Find room name if located inside a room
        let roomName = 'พื้นที่ส่วนกลาง';
        if (plan.rooms && Array.isArray(plan.rooms)) {
          const matchedRoom = plan.rooms.find(
            (r) =>
              asset.x >= r.x &&
              asset.x <= r.x + r.width &&
              asset.y >= r.y &&
              asset.y <= r.y + r.height
          );
          if (matchedRoom) roomName = matchedRoom.name;
        }

        list.push({
          ...asset,
          buildingId: plan.buildingId,
          buildingName: plan.buildingName,
          floorNumber: plan.floorNumber,
          floorPlanId: plan._id,
          roomName,
        });
      });
    });
    return list;
  }, [allFloorPlans]);

  // Extract current floor assets
  const currentFloorAssets = useMemo(() => {
    if (!currentFloorPlan?.assets) return [];
    return currentFloorPlan.assets.map((asset) => {
      let roomName = 'พื้นที่ส่วนกลาง';
      if (currentFloorPlan.rooms && Array.isArray(currentFloorPlan.rooms)) {
        const matchedRoom = currentFloorPlan.rooms.find(
          (r) =>
            asset.x >= r.x &&
            asset.x <= r.x + r.width &&
            asset.y >= r.y &&
            asset.y <= r.y + r.height
        );
        if (matchedRoom) roomName = matchedRoom.name;
      }
      return {
        ...asset,
        buildingId: currentFloorPlan.buildingId,
        buildingName: currentFloorPlan.buildingName,
        floorNumber: currentFloorPlan.floorNumber,
        floorPlanId: currentFloorPlan._id,
        roomName,
      };
    });
  }, [currentFloorPlan]);

  const displayedAssets = scope === 'floor' ? currentFloorAssets : allCampusAssets;

  // Filter logic
  const filteredList = useMemo(() => {
    return displayedAssets.filter((item) => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'vehicle' && !item.type?.startsWith('vehicle_')) return false;
        if (typeFilter !== 'vehicle' && item.type !== typeFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (item.code || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const user = (item.assignedTo || item.driverName || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const room = (item.roomName || '').toLowerCase();
        const bld = (item.buildingName || '').toLowerCase();
        const plate = (item.licensePlate || '').toLowerCase();

        return (
          code.includes(q) ||
          name.includes(q) ||
          user.includes(q) ||
          dept.includes(q) ||
          room.includes(q) ||
          bld.includes(q) ||
          plate.includes(q)
        );
      }
      return true;
    });
  }, [displayedAssets, typeFilter, statusFilter, search]);

  if (!isOpen) return null;

  const getTypeBadge = (type) => {
    if (type === 'cctv')
      return <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">📹 กล้อง CCTV</span>;
    if (type === 'computer')
      return <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">💻 คอมพิวเตอร์</span>;
    if (type === 'printer')
      return <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">🖨️ เครื่องพิมพ์</span>;
    if (type?.startsWith('vehicle_'))
      return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">🚗 ยานพาหนะ</span>;
    return <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">📦 ทรัพย์สิน</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'broken') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" /> ชำรุด (Broken)
        </span>
      );
    }
    if (status === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> ส่งซ่อม (Repair)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ปกติ (Active)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-md shadow-indigo-200">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ตารางบริหารจัดการทรัพย์สิน (Campus Asset Inventory)
              </h2>
              <p className="text-xs text-slate-500">
                รายการอุปกรณ์ คอมพิวเตอร์ กล้อง CCTV และทรัพย์สินทั้งหมด พร้อมเชื่อมโยงตำแหน่งบนผังอาคาร
              </p>
            </div>
          </div>

          {/* Scope Toggle & Close */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScope('floor')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  scope === 'floor'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏢 เฉพาะชั้นนี้ ({currentFloorAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('campus')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  scope === 'campus'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌐 ทั้งแคมปัส 20 ไร่ ({allCampusAssets.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="ค้นหารหัสทรัพย์สิน, ชื่อพนักงาน, ทะเบียนรถ, แผนก, ห้อง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'cctv', label: '📹 กล้อง CCTV' },
                { id: 'computer', label: '💻 คอมพิวเตอร์' },
                { id: 'printer', label: '🖨️ เครื่องพิมพ์' },
                { id: 'vehicle', label: '🚗 ยานพาหนะ' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setTypeFilter(btn.id)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition ${
                    typeFilter === btn.id
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">🟢 ใช้งานปกติ</option>
              <option value="maintenance">🟠 กำลังส่งซ่อม</option>
              <option value="broken">🔴 ชำรุด/เสีย</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">รหัสทรัพย์สิน</th>
                  <th className="py-3.5 px-4">ประเภท</th>
                  <th className="py-3.5 px-4">ชื่ออุปกรณ์ / รายละเอียด</th>
                  <th className="py-3.5 px-4">ผู้ครอบครอง / แผนก</th>
                  <th className="py-3.5 px-4">สถานที่ตั้ง (อาคาร • ชั้น • ห้อง)</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="font-semibold text-slate-600">ไม่พบข้อมูลทรัพย์สินที่ตรงกับเงื่อนไข</p>
                      <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือสลับมุมมองดูทั้งแคมปัส</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((asset) => (
                    <tr
                      key={`${asset.floorPlanId}-${asset.id}`}
                      className="hover:bg-indigo-50/40 transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {asset.code || asset.licensePlate || asset.parkingSlot || '-'}
                      </td>
                      <td className="py-3.5 px-4">{getTypeBadge(asset.type)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{asset.name}</div>
                        {asset.specs && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                            {asset.specs}
                          </div>
                        )}
                        {asset.type === 'cctv' && (
                          <div className="text-[11px] text-blue-600">
                            มุมมอง: {asset.fovAngle || 75}° • หัน: {asset.rotation || 0}° • ระยะ: {asset.rangeMeters || 10}m
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {asset.assignedTo || asset.driverName || '-'}
                        </div>
                        {asset.department && (
                          <div className="text-[11px] text-slate-400">{asset.department}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {asset.buildingName} {asset.floorNumber ? `(ชั้น ${asset.floorNumber})` : ''}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium">
                          📍 {asset.roomName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(asset.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onTargetAsset?.(asset);
                              onClose();
                            }}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                            title="สลับไปยังอาคารและชั้นนี้ พร้อมซูมชี้เป้าบนผัง"
                          >
                            🎯 ชี้เป้าบนผัง
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRequestMaintenance?.(asset);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 font-bold text-amber-700 hover:bg-amber-100 transition"
                            title="แจ้งซ่อมอุปกรณ์นี้"
                          >
                            🔧 แจ้งซ่อม
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <div>
            แสดงผล <strong>{filteredList.length}</strong> จากทั้งหมด{' '}
            <strong>{displayedAssets.length}</strong> รายการ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
