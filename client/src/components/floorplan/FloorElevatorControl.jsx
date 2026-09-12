import React from 'react';

export default function FloorElevatorControl({
  currentBuilding,
  currentFloorNumber,
  onSelectFloor,
  onReturnToCampus,
  floorPlansInBuilding = [],
  onAddFloor,
}) {
  if (!currentBuilding || currentBuilding.id === 'campus') {
    return null;
  }

  // Calculate highest floor available dynamically
  const maxPlanFloor = floorPlansInBuilding.reduce(
    (max, p) => Math.max(max, p.floorNumber || 1),
    1
  );
  const totalFloors = Math.max(currentBuilding.totalFloors || 1, maxPlanFloor);

  // Build floor list descending: 4, 3, 2, 1
  const floorNumbers = Array.from({ length: totalFloors }, (_, i) => totalFloors - i);

  return (
    <div className="absolute right-4 top-20 z-20 flex flex-col items-center rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md transition-all sm:right-6">
      {/* Elevator Header */}
      <div className="mb-2 flex flex-col items-center border-b border-slate-700/60 pb-1.5 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          ELEVATOR
        </span>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-400">
          <span className="animate-pulse">▲</span>
          <span>{currentFloorNumber}F</span>
          <span className="animate-pulse">▼</span>
        </div>
      </div>

      {/* Add Floor Button (if onAddFloor provided) */}
      {onAddFloor && (
        <div className="mb-1.5 w-full">
          <button
            type="button"
            onClick={onAddFloor}
            className="w-full flex items-center justify-center rounded-lg bg-blue-900/50 hover:bg-blue-800 text-blue-300 hover:text-white py-1 text-[10px] font-bold border border-blue-700/50 transition"
            title="เพิ่มชั้นใหม่ให้อาคารนี้"
          >
            + ชั้น
          </button>
        </div>
      )}

      {/* Vertical Floor Buttons (Descending order: 4F -> 1F) */}
      <div className="flex flex-col gap-1.5">
        {floorNumbers.map((fNum) => {
          const isActive = currentFloorNumber === fNum;
          const planForFloor = floorPlansInBuilding.find((p) => p.floorNumber === fNum);
          
          // Check if this floor has broken / maintenance assets
          const assetsOnFloor = planForFloor?.assets || [];
          const hasIssues = assetsOnFloor.some(
            (a) => a.status === 'broken' || a.status === 'maintenance'
          );

          return (
            <button
              key={fNum}
              type="button"
              onClick={() => onSelectFloor(fNum)}
              className={`group relative flex h-10 w-11 flex-col items-center justify-center rounded-xl font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={`สลับไปดู ${currentBuilding.shortName || currentBuilding.name} ชั้น ${fNum}`}
            >
              <span className="text-xs">{fNum}F</span>
              <span className="text-[8px] opacity-70">FL {fNum}</span>

              {/* Issue Indicator Dot */}
              {hasIssues && (
                <span
                  title="มีอุปกรณ์แจ้งซ่อมในชั้นนี้"
                  className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-slate-900"
                >
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Return to Campus Master Plan 20 ไร่ Button */}
      <div className="mt-2.5 border-t border-slate-700/60 pt-2">
        <button
          type="button"
          onClick={onReturnToCampus}
          className="group flex flex-col items-center justify-center rounded-xl bg-emerald-950/80 px-2 py-1.5 text-center text-emerald-400 transition hover:bg-emerald-900 hover:text-emerald-300"
          title="กลับไปยังผังบริเวณรวม 20 ไร่ (Campus Master Plan)"
        >
          <span className="text-sm leading-none">🌐</span>
          <span className="mt-0.5 text-[9px] font-semibold whitespace-nowrap">ผัง 20 ไร่</span>
        </button>
      </div>
    </div>
  );
}
