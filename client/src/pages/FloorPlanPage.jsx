import { useState, useMemo } from 'react';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { useFloorPlans, useUpdateFloorPlan } from '../hooks/useFloorPlans.js';
import { useFacilities, useAddFacilityFloor } from '../hooks/useFacilities.js';
import { useDepartments } from '../hooks/useDepartments.js';
import { useToast } from '../hooks/ToastContext.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import FloorPlanViewer from '../components/floorplan/FloorPlanViewer.jsx';
import FloorPlanDesigner from '../components/floorplan/FloorPlanDesigner.jsx';
import BuildingSelector from '../components/floorplan/BuildingSelector.jsx';
import CampusAssetSearchModal from '../components/floorplan/CampusAssetSearchModal.jsx';
import FacilityManageModal from '../components/floorplan/FacilityManageModal.jsx';
import CopyLayoutModal from '../components/floorplan/CopyLayoutModal.jsx';

export default function FloorPlanPage() {
  const { hasPermission, hasRole } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isAdmin =
    hasRole('super_admin') ||
    hasRole('admin') ||
    hasPermission('knowledge:manage');

  // Mode: 'view' | 'design'
  const [mode, setMode] = useState('view');

  // Selected building and floor
  const [selectedBuildingId, setSelectedBuildingId] = useState('campus');
  const [currentFloorNumber, setCurrentFloorNumber] = useState(0); // 0 for campus, 1+ for building floors
  const [initialFocusAssetId, setInitialFocusAssetId] = useState(null);
  const [isCampusSearchOpen, setIsCampusSearchOpen] = useState(false);
  const [isFacilityManageOpen, setIsFacilityManageOpen] = useState(false);
  const [isCopyLayoutOpen, setIsCopyLayoutOpen] = useState(false);

  // Facilities & Floor plans query
  const { data: facilitiesData = [] } = useFacilities();
  const { data: plansData, isLoading, isError, error } = useFloorPlans();
  const floorPlans = plansData?.floorPlans || [];
  const facilities = facilitiesData.length > 0 ? facilitiesData : (plansData?.facilities || []);
  const updateFloorPlanMutation = useUpdateFloorPlan();
  const addFloorMutation = useAddFacilityFloor();
  const { data: departments = [] } = useDepartments();

  // Calculate building stats (issue count and asset counts) across all plans
  const buildingStats = useMemo(() => {
    const stats = {};
    for (const plan of floorPlans) {
      const bId = plan.buildingId || 'b1';
      if (!stats[bId]) {
        stats[bId] = { issueCount: 0, totalAssets: 0 };
      }
      for (const asset of plan.assets || []) {
        stats[bId].totalAssets += 1;
        if (asset.status === 'broken' || asset.status === 'maintenance') {
          stats[bId].issueCount += 1;
        }
      }
    }
    return stats;
  }, [floorPlans]);

  // Current building metadata
  const currentFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedBuildingId) || {
      id: selectedBuildingId,
      name: selectedBuildingId === 'campus' ? 'ผังบริเวณโครงการรวม 20 ไร่' : 'อาคาร 1: สำนักงานใหญ่',
      shortName: selectedBuildingId === 'campus' ? 'ผัง 20 ไร่' : 'อาคาร 1 (HQ)',
      type: selectedBuildingId === 'campus' ? 'campus' : selectedBuildingId.startsWith('w') ? 'warehouse' : 'office',
      totalFloors: selectedBuildingId === 'campus' ? 1 : selectedBuildingId === 'b1' ? 4 : selectedBuildingId.startsWith('w') ? 1 : 3,
    };
  }, [facilities, selectedBuildingId]);

  // Plans belonging to the current building
  const floorPlansInBuilding = useMemo(() => {
    return floorPlans.filter((p) => p.buildingId === selectedBuildingId);
  }, [floorPlans, selectedBuildingId]);

  // Current active floor plan
  const currentFloorPlan = useMemo(() => {
    if (floorPlans.length === 0) return null;

    if (selectedBuildingId === 'campus') {
      const campusPlan = floorPlans.find((p) => p.buildingId === 'campus');
      return campusPlan || floorPlans[0];
    }

    const matchFloor = floorPlans.find(
      (p) => p.buildingId === selectedBuildingId && p.floorNumber === currentFloorNumber
    );
    if (matchFloor) return matchFloor;

    // Fallback to first plan of this building, or first plan in db
    return floorPlansInBuilding[0] || floorPlans[0];
  }, [floorPlans, selectedBuildingId, currentFloorNumber, floorPlansInBuilding]);

  // Handlers for building & floor changes
  const handleSelectBuilding = (bId) => {
    setSelectedBuildingId(bId);
    if (bId === 'campus') {
      setCurrentFloorNumber(0);
    } else {
      setCurrentFloorNumber(1);
    }
    setInitialFocusAssetId(null);
  };

  const handleSelectFloor = (fNum) => {
    setCurrentFloorNumber(fNum);
    setInitialFocusAssetId(null);
  };

  const handleReturnToCampus = () => {
    setSelectedBuildingId('campus');
    setCurrentFloorNumber(0);
    setInitialFocusAssetId(null);
  };

  // Quick add floor handler
  const handleQuickAddFloor = async () => {
    if (!currentFacility || currentFacility.id === 'campus') return;
    const nextFloor = (currentFacility.totalFloors || floorPlansInBuilding.length || 1) + 1;
    try {
      await addFloorMutation.mutateAsync({
        id: currentFacility.facilityId || currentFacility.id || currentFacility._id,
        payload: { floorName: `ชั้น ${nextFloor}` },
      });
      showToast(`เพิ่มชั้น ${nextFloor} ให้กับ ${currentFacility.name} เรียบร้อยแล้ว!`, 'success');
      setCurrentFloorNumber(nextFloor);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'ไม่สามารถเพิ่มชั้นได้', 'error');
    }
  };

  // Cross-building asset search selection handler
  const handleSelectAssetResult = ({ buildingId, floorNumber, assetId }) => {
    setSelectedBuildingId(buildingId || 'b1');
    setCurrentFloorNumber(Number(floorNumber) || 1);
    setInitialFocusAssetId(assetId);
    setMode('view');
  };

  const handleSaveFloorPlan = async (updatedPlan) => {
    try {
      await updateFloorPlanMutation.mutateAsync({
        id: updatedPlan._id,
        payload: {
          name: updatedPlan.name,
          buildingId: updatedPlan.buildingId || selectedBuildingId,
          buildingName: updatedPlan.buildingName,
          buildingType: updatedPlan.buildingType,
          totalFloors: updatedPlan.totalFloors,
          floorNumber: updatedPlan.floorNumber,
          floorName: updatedPlan.floorName,
          rooms: updatedPlan.rooms,
          walls: updatedPlan.walls,
          doors: updatedPlan.doors,
          assets: updatedPlan.assets,
          gridSize: updatedPlan.gridSize,
          scaleMetersPerGrid: updatedPlan.scaleMetersPerGrid,
        },
      });
      showToast(t('floorPlanSaved') || 'บันทึกผังอาคารและทรัพย์สินเรียบร้อยแล้ว!', 'success');
      setMode('view');
    } catch (err) {
      showToast(err?.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  return (
    <AppShell>
      {/* Top Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {t('dashboard')} / {t('floorPlan') || 'ผังอาคารและทรัพย์สิน'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            🏢 {t('floorPlanTitle') || 'ระบบผังโครงการ 20 ไร่ และระบุตำแหน่งทรัพย์สิน'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
            {t('floorPlanSubtitle') ||
              'ผังบริเวณรวม 20 ไร่ (~32,000 ตร.ม.), 5 อาคารสำนักงาน, 5 โกดังสินค้า, จำลองมุมกล้อง CCTV Coverage และระบุตำแหน่งทรัพย์สิน'}
          </p>
        </div>

        {/* Global Search & Admin Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 20-Rai Global Search Button */}
          <button
            type="button"
            onClick={() => setIsCampusSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 shadow-xs hover:bg-primary-100 hover:border-primary-400 transition"
          >
            <span>🔍</span>
            <span>ค้นหาทรัพย์สินทั่วทั้ง 20 ไร่</span>
          </button>

          {isAdmin && (
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  mode === 'view'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👁️ {t('userMode') || 'โหมดพนักงาน'}
              </button>
              <button
                type="button"
                onClick={() => setMode('design')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  mode === 'design'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✏️ {t('adminMode') || 'โหมดแอดมิน / ออกแบบ'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Building & Facilities Selector (Tabs for structures + Campus Master) */}
      <div className="mb-4">
        <BuildingSelector
          facilities={facilities}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={handleSelectBuilding}
          buildingStats={buildingStats}
          onOpenFacilityManage={isAdmin ? () => setIsFacilityManageOpen(true) : undefined}
        />
      </div>

      {/* Loading or Error */}
      {isLoading && (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
          ⏳ กำลังโหลดข้อมูลผังอาคารและทรัพย์สิน...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error?.message || 'ไม่สามารถโหลดข้อมูลผังอาคารได้'}
        </div>
      )}

      {/* Main Mode Rendering */}
      {!isLoading && !isError && currentFloorPlan && (
        <div className="w-full">
          {mode === 'view' ? (
            <FloorPlanViewer
              floorPlan={currentFloorPlan}
              canEdit={isAdmin}
              onEditPlan={() => setMode('design')}
              initialFocusAssetId={initialFocusAssetId}
              onSelectBuilding={handleSelectBuilding}
              onOpenCampusSearch={() => setIsCampusSearchOpen(true)}
              currentBuilding={currentFacility}
              currentFloorNumber={currentFloorNumber}
              onSelectFloor={handleSelectFloor}
              onReturnToCampus={handleReturnToCampus}
              floorPlansInBuilding={floorPlansInBuilding}
              onOpenCopyLayoutModal={() => setIsCopyLayoutOpen(true)}
              onAddFloor={handleQuickAddFloor}
            />
          ) : (
            <div className="h-[760px] w-full">
              <FloorPlanDesigner
                floorPlan={currentFloorPlan}
                allFloorPlans={floorPlans}
                departments={departments}
                onSave={handleSaveFloorPlan}
                isSaving={updateFloorPlanMutation.isPending}
                onClose={() => setMode('view')}
              />
            </div>
          )}
        </div>
      )}

      {/* Campus Asset Search Modal */}
      <CampusAssetSearchModal
        isOpen={isCampusSearchOpen}
        onClose={() => setIsCampusSearchOpen(false)}
        onSelectAssetResult={handleSelectAssetResult}
      />

      {/* Facility Management Modal (CRUD Buildings & Warehouses) */}
      <FacilityManageModal
        isOpen={isFacilityManageOpen}
        onClose={() => setIsFacilityManageOpen(false)}
        facilities={facilities}
        onSelectFacility={(f) => handleSelectBuilding(f.facilityId || f.id)}
      />

      {/* Copy Layout Modal */}
      <CopyLayoutModal
        isOpen={isCopyLayoutOpen}
        onClose={() => setIsCopyLayoutOpen(false)}
        targetPlan={currentFloorPlan}
        allFloorPlans={floorPlans}
        onSuccess={() => {
          showToast('คัดลอกโครงสร้างแปลนและผนังเรียบร้อยแล้ว!', 'success');
        }}
      />
    </AppShell>
  );
}
