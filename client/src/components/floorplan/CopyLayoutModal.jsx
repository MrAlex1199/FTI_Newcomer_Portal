import React, { useState } from 'react';
import { useDuplicateLayout } from '../../hooks/useFloorPlans.js';

export default function CopyLayoutModal({
  isOpen,
  onClose,
  targetPlan,
  allFloorPlans = [],
  onSuccess,
}) {
  const duplicateMutation = useDuplicateLayout();
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !targetPlan) return null;

  // Filter out the current target plan and campus master plan from sources
  const candidatePlans = allFloorPlans.filter(
    (p) => p._id !== targetPlan._id && p.buildingId !== 'campus'
  );

  // Default to Floor 1 of the same building if available
  const defaultFloor1 = candidatePlans.find(
    (p) => p.buildingId === targetPlan.buildingId && p.floorNumber === 1
  );

  const activeSourceId = selectedSourceId || (defaultFloor1 ? defaultFloor1._id : candidatePlans[0]?._id);

  const handleCopy = async () => {
    if (!activeSourceId) {
      setErrorMsg('กรุณาเลือกแปลนต้นทางที่ต้องการคัดลอก');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await duplicateMutation.mutateAsync({
        id: targetPlan._id,
        sourcePlanId: activeSourceId,
      });
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการคัดลอกแปลน');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                คัดลอกโครงร่างแปลนและผนัง (Duplicate Layout)
              </h2>
              <p className="text-xs text-slate-500">
                ปลายทาง: {targetPlan.name || `ชั้น ${targetPlan.floorNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <p className="font-semibold">💡 ประโยชน์ของการคัดลอกแปลน:</p>
            <p>
              ระบบจะคัดลอกผนังรอบนอก (Outer Walls), ผนังกั้นห้อง, ประตู, และสเกลกริดจากแปลนต้นทางมายังชั้นนี้ทันที ทำให้ไม่ต้องวาดโครงสร้างผนังซ้ำใหม่จากศูนย์!
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              เลือกแปลนต้นทางที่ต้องการคัดลอก (Source Floor Plan):
            </label>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {candidatePlans.map((plan) => {
                const isSelected = activeSourceId === plan._id;
                const isSameBuilding = plan.buildingId === targetPlan.buildingId;
                const roomCount = (plan.rooms || []).length;
                const wallCount = (plan.walls || []).length;

                return (
                  <div
                    key={plan._id}
                    onClick={() => setSelectedSourceId(plan._id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">
                        {plan.buildingType === 'warehouse' ? '🏭' : '🏢'}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{plan.name || `${plan.buildingName} ชั้น ${plan.floorNumber}`}</span>
                          {isSameBuilding && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] rounded font-medium">
                              อาคารเดียวกัน
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {roomCount} ห้อง • {wallCount} ผนัง • {plan.buildingId.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="sourcePlan"
                      checked={isSelected}
                      onChange={() => setSelectedSourceId(plan._id)}
                      className="accent-blue-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={isSubmitting || !activeSourceId}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-xs">⏳</span>
                <span>กำลังคัดลอก...</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>ยืนยันคัดลอกโครงร่าง</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
