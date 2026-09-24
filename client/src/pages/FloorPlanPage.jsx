import { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { useFloorPlans, useUpdateFloorPlan } from '../hooks/useFloorPlans.js';
import { useFacilities, useAddFacilityFloor, useDeleteFacilityFloor } from '../hooks/useFacilities.js';
import { useDepartments } from '../hooks/useDepartments.js';
import { useToast } from '../hooks/ToastContext.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import FloorPlanViewer from '../components/floorplan/FloorPlanViewer.jsx';
import FloorPlanDesigner from '../components/floorplan/FloorPlanDesigner.jsx';
import BuildingSelector from '../components/floorplan/BuildingSelector.jsx';
import CampusAssetSearchModal from '../components/floorplan/CampusAssetSearchModal.jsx';
import FacilityManageModal from '../components/floorplan/FacilityManageModal.jsx';
import CopyLayoutModal from '../components/floorplan/CopyLayoutModal.jsx';
import AssetInventoryModal from '../components/floorplan/AssetInventoryModal.jsx';
import MaintenanceReportModal from '../components/floorplan/MaintenanceReportModal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';

export default function FloorPlanPage() {
  const { hasPermission, hasRole } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const isAdmin =
    hasRole('super_admin') ||
    hasRole('admin') ||
    hasPermission('knowledge:manage');

  // Mode: 'view' | 'design'
  const [mode, setMode] = useState('view');

  // Selected building and floor
  const [selectedBuildingId, setSelectedBuildingId] = useState(() => queryParams.get('buildingId') || 'campus');
  const [currentFloorNumber, setCurrentFloorNumber] = useState(() => Number(queryParams.get('floor')) || 0); // 0 for campus, 1+ for building floors
  const [initialFocusAssetId, setInitialFocusAssetId] = useState(() => queryParams.get('highlight') || null);
  const [isCampusSearchOpen, setIsCampusSearchOpen] = useState(false);
  const [isFacilityManageOpen, setIsFacilityManageOpen] = useState(false);
  const [isCopyLayoutOpen, setIsCopyLayoutOpen] = useState(false);
  const [isAssetInventoryOpen, setIsAssetInventoryOpen] = useState(false);
  const [reportingAsset, setReportingAsset] = useState(null);
  const [floorToDelete, setFloorToDelete] = useState(null);

  // Sync when query params change (e.g. redirected from Maintenance Page)
  useEffect(() => {
    const bId = queryParams.get('buildingId');
    const fNum = queryParams.get('floor');
    const hl = queryParams.get('highlight');
    if (bId) setSelectedBuildingId(bId);
    if (fNum !== null && fNum !== undefined) setCurrentFloorNumber(Number(fNum));
    if (hl) setInitialFocusAssetId(hl);
  }, [queryParams]);

  // Facilities & Floor plans query
  const { data: facilitiesData = [] } = useFacilities();
  const { data: plansData, isLoading, isError, error } = useFloorPlans();
  const floorPlans = plansData?.floorPlans || [];
  const facilities = facilitiesData.length > 0 ? facilitiesData : (plansData?.facilities || []);
  const updateFloorPlanMutation = useUpdateFloorPlan();
  const addFloorMutation = useAddFacilityFloor();
  const deleteFloorMutation = useDeleteFacilityFloor();
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
      name: selectedBuildingId === 'campus' ? t('defaultCampusName') : t('defaultBuildingName'),
      shortName: selectedBuildingId === 'campus' ? t('defaultCampusShortName') : t('defaultBuildingShortName'),
      type: selectedBuildingId === 'campus' ? 'campus' : selectedBuildingId.startsWith('w') ? 'warehouse' : 'office',
      totalFloors: selectedBuildingId === 'campus' ? 1 : selectedBuildingId === 'b1' ? 4 : selectedBuildingId.startsWith('w') ? 1 : 3,
    };
  }, [facilities, selectedBuildingId, t]);

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
        payload: { floorName: `${t('floorLabel')} ${nextFloor}` },
      });
      showToast(t('floorAddedSuccess', { floor: nextFloor, facility: currentFacility.name }), 'success');
      setCurrentFloorNumber(nextFloor);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || t('errorLoadingFloorPlans'), 'error');
    }
  };

  // Quick delete floor click handler
  const handleQuickDeleteFloor = (floorNum) => {
    if (!currentFacility || currentFacility.id === 'campus') return;
    const fNum = floorNum || currentFloorNumber;
    
    if (floorPlansInBuilding.length <= 1) {
      showToast(t('minFloorsError'), 'error');
      return;
    }

    setFloorToDelete({
      facilityId: currentFacility.facilityId || currentFacility.id || currentFacility._id,
      facilityName: currentFacility.name,
      floorNumber: fNum,
    });
  };

  const handleConfirmDeleteFloor = async () => {
    if (!floorToDelete) return;
    try {
      await deleteFloorMutation.mutateAsync({
        id: floorToDelete.facilityId,
        floorNumber: floorToDelete.floorNumber,
      });
      showToast(t('floorDeletedSuccess', { floor: floorToDelete.floorNumber, facility: floorToDelete.facilityName }), 'success');
      setCurrentFloorNumber(1);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || t('errorLoadingFloorPlans'), 'error');
    } finally {
      setFloorToDelete(null);
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
      showToast(t('floorPlanSaved'), 'success');
      setMode('view');
    } catch (err) {
      showToast(err?.response?.data?.message || t('errorLoadingFloorPlans'), 'error');
    }
  };

  return (
    <AppShell>
      {/* Top Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {t('dashboard')} / {t('floorPlan')}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            🏢 {t('floorPlanTitle')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
            {t('floorPlanSubtitle')}
          </p>
        </div>

        {/* Global Search & Admin Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Global Campus Search Button */}
          <button
            type="button"
            onClick={() => setIsCampusSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 shadow-xs hover:bg-primary-100 hover:border-primary-400 transition"
          >
            <span>🔍</span>
            <span>{t('searchAllCampusAssets')}</span>
          </button>

          {/* Quick Asset Inventory Button */}
          <button
            type="button"
            onClick={() => setIsAssetInventoryOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-300 transition"
          >
            <span>📋</span>
            <span>{t('assetInventoryTable')}</span>
          </button>

          {/* Quick Maintenance & KPI Button */}
          <Link
            to="/maintenance"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 shadow-xs hover:bg-emerald-100 hover:border-emerald-300 transition"
          >
            <span>🔧</span>
            <span>{t('reportIssueAndKpi')}</span>
          </Link>

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
                👁️ {t('userMode')}
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
                ✏️ {t('adminMode')}
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
          ⏳ {t('loadingFloorPlans')}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error?.message || t('errorLoadingFloorPlans')}
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
              onOpenAssetInventory={() => setIsAssetInventoryOpen(true)}
              onRequestMaintenance={(asset) => setReportingAsset(asset)}
              currentBuilding={currentFacility}
              currentFloorNumber={currentFloorNumber}
              onSelectFloor={handleSelectFloor}
              onReturnToCampus={handleReturnToCampus}
              floorPlansInBuilding={floorPlansInBuilding}
              onOpenCopyLayoutModal={() => setIsCopyLayoutOpen(true)}
              onAddFloor={handleQuickAddFloor}
              onDeleteFloor={handleQuickDeleteFloor}
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

      {/* Campus Asset Inventory Modal (Table View) */}
      <AssetInventoryModal
        isOpen={isAssetInventoryOpen}
        onClose={() => setIsAssetInventoryOpen(false)}
        currentFloorPlan={currentFloorPlan}
        allFloorPlans={floorPlans}
        departments={departments}
        onTargetAsset={handleSelectAssetResult}
        onRequestMaintenance={(asset) => setReportingAsset(asset)}
      />

      {/* Maintenance Request Report Modal */}
      <MaintenanceReportModal
        isOpen={!!reportingAsset}
        onClose={() => setReportingAsset(null)}
        asset={reportingAsset}
        onSuccess={() => {
          // Invalidate floor plans query so updated maintenance status is immediately visible
          window.location.reload();
        }}
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
          showToast(t('copyLayoutSuccess'), 'success');
        }}
      />

      {/* Delete Floor In-App Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(floorToDelete)}
        onClose={() => setFloorToDelete(null)}
        onConfirm={handleConfirmDeleteFloor}
        title={t('confirmDeleteFloorTitle')}
        message={
          floorToDelete
            ? t('confirmDeleteFloorMsg', { floor: floorToDelete.floorNumber, facility: floorToDelete.facilityName })
            : ''
        }
        confirmLabel={t('confirmDeleteFloorBtn')}
        danger={true}
        loading={deleteFloorMutation.isPending}
      />
    </AppShell>
  );
}
