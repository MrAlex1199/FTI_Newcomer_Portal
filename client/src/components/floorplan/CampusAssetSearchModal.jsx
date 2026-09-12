import React, { useState, useMemo } from 'react';
import { useCampusAssets } from '../../hooks/useFloorPlans.js';

export default function CampusAssetSearchModal({ isOpen, onClose, onSelectAssetResult }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'maintenance' | 'cctv' | 'computer'
  const { data: assets = [], isLoading } = useCampusAssets(searchQuery);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (statusFilter === 'maintenance' && a.status !== 'broken' && a.status !== 'maintenance') {
        return false;
      }
      if (statusFilter === 'cctv' && a.type !== 'cctv') return false;
      if (statusFilter === 'computer' && a.type !== 'computer') return false;
      return true;
    });
  }, [assets, statusFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 pt-16 backdrop-blur-sm sm:p-6 sm:pt-24">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ค้นหาทรัพย์สินทั่วทั้งโครงการ 20 ไร่ (Campus Asset Locator)
                </h3>
                <p className="text-xs text-slate-500">
                  ค้นหาชื่อพนักงาน, รหัสทรัพย์สิน, กล้อง CCTV, คอมพิวเตอร์ หรือแผนก ระบบจะสลับไปยังตึกและชั้นที่ถูกต้องทันที
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative mt-3">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อพนักงาน (เช่น กิตติพัศ), รหัสทรัพย์สิน (FTI-PC-001, CCTV-01), แผนก..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cctv')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                statusFilter === 'cctv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📹 กล้อง CCTV
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('computer')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                statusFilter === 'computer'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💻 เวิร์กสเตชัน / พีซี
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('maintenance')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                statusFilter === 'maintenance'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ⚠️ อุปกรณ์แจ้งซ่อม / ปัญหา
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              ⏳ กำลังค้นหาทรัพย์สินใน 10 สิ่งปลูกสร้าง...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {searchQuery ? 'ไม่พบทรัพย์สินที่ตรงกับคำค้นหา' : 'พิมพ์คำค้นหาเพื่อระบุตำแหน่งทรัพย์สิน'}
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isIssue = asset.status === 'broken' || asset.status === 'maintenance';

              return (
                <button
                  key={`${asset.floorPlanId}-${asset.id}`}
                  type="button"
                  onClick={() => {
                    onSelectAssetResult({
                      buildingId: asset.buildingId,
                      floorNumber: asset.floorNumber,
                      floorPlanId: asset.floorPlanId,
                      assetId: asset.id,
                      asset,
                    });
                    onClose();
                  }}
                  className="group flex w-full items-center justify-between p-3 text-left transition hover:bg-primary-50/60 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg group-hover:bg-primary-100 group-hover:text-primary-700">
                      {asset.type === 'cctv'
                        ? '📹'
                        : asset.type === 'computer'
                        ? '💻'
                        : asset.type === 'printer'
                        ? '🖨️'
                        : '📍'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary-900">
                          {asset.name}
                        </span>
                        {asset.code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[11px] font-mono font-semibold text-slate-600">
                            {asset.code}
                          </span>
                        )}
                        {isIssue && (
                          <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                            {asset.status === 'broken' ? 'ชำรุด' : 'ซ่อมบำรุง'}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {asset.assignedTo && (
                          <span>👤 {asset.assignedTo}</span>
                        )}
                        {asset.department && (
                          <span className="text-slate-400">• {asset.department}</span>
                        )}
                        {asset.specs && (
                          <span className="line-clamp-1 text-slate-400 max-w-xs">
                            • {asset.specs}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Building & Floor Location Tag */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 pl-3">
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition">
                      {asset.buildingName || asset.buildingId}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {asset.floorName || `ชั้น ${asset.floorNumber}`} ➔ ชี้เป้า
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-right text-xs text-slate-500 rounded-b-2xl">
          คลิกที่รายการเพื่อกระโดดไปยังตำแหน่งทรัพย์สินบนแปลนอัตโนมัติ
        </div>
      </div>
    </div>
  );
}
