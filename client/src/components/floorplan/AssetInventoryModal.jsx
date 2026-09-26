import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useLanguage from '../../hooks/useLanguage.js';
import { useMoveAsset } from '../../hooks/useFloorPlans.js';
import AssetEditModal from './AssetEditModal.jsx';
import { useToast } from '../../hooks/ToastContext.jsx';
export default function AssetInventoryModal({
  isOpen,
  onClose,
  currentFloorPlan,
  allFloorPlans = [],
  departments = [],
  onTargetAsset,
  onRequestMaintenance,
}) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const moveAssetMutation = useMoveAsset();
  const [scope, setScope] = useState('floor'); // 'floor' | 'campus'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'cctv' | 'computer' | 'printer' | 'vehicle'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'maintenance' | 'broken'

  // Sorting state
  const [sortField, setSortField] = useState('code'); // 'code' | 'name' | 'location' | 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Pagination state
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Asset Edit state
  const [editingAsset, setEditingAsset] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Extract all assets with campus/building metadata
  const allCampusAssets = useMemo(() => {
    const list = [];
    allFloorPlans.forEach((plan) => {
      if (!plan.assets || !Array.isArray(plan.assets)) return;
      plan.assets.forEach((asset) => {
        let roomName = t('commonArea');
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
          buildingName: plan.buildingName || plan.buildingId,
          floorNumber: plan.floorNumber,
          floorPlanId: plan._id,
          roomName,
        });
      });
    });
    return list;
  }, [allFloorPlans, t]);

  // Extract current floor assets
  const currentFloorAssets = useMemo(() => {
    if (!currentFloorPlan?.assets) return [];
    return currentFloorPlan.assets.map((asset) => {
      let roomName = t('commonArea');
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
        buildingName: currentFloorPlan.buildingName || currentFloorPlan.buildingId,
        floorNumber: currentFloorPlan.floorNumber,
        floorPlanId: currentFloorPlan._id,
        roomName,
      };
    });
  }, [currentFloorPlan, t]);

  const displayedAssets = scope === 'floor' ? currentFloorAssets : allCampusAssets;

  // Real-time KPI summary counts
  const kpiStats = useMemo(() => {
    const total = displayedAssets.length;
    let active = 0;
    let maintenance = 0;
    let broken = 0;

    displayedAssets.forEach((item) => {
      if (item.status === 'broken') broken += 1;
      else if (item.status === 'maintenance') maintenance += 1;
      else active += 1;
    });

    return { total, active, maintenance, broken };
  }, [displayedAssets]);

  // Filter & Sort Logic
  const filteredList = useMemo(() => {
    const result = displayedAssets.filter((item) => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'vehicle' && !item.type?.startsWith('vehicle_')) return false;
        if (typeFilter !== 'vehicle' && item.type !== typeFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && item.status && item.status !== 'active') return false;
        if (statusFilter !== 'active' && item.status !== statusFilter) return false;
      }

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

    // Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'code') {
        valA = a.code || a.licensePlate || a.id || '';
        valB = b.code || b.licensePlate || b.id || '';
      } else if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'location') {
        valA = `${a.buildingName || ''} ${a.floorNumber || 0} ${a.roomName || ''}`;
        valB = `${b.buildingName || ''} ${b.floorNumber || 0} ${b.roomName || ''}`;
      } else if (sortField === 'status') {
        valA = a.status || 'active';
        valB = b.status || 'active';
      }

      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [displayedAssets, typeFilter, statusFilter, search, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredList.length);
  const paginatedList = useMemo(() => {
    return filteredList.slice(startIndex, endIndex);
  }, [filteredList, startIndex, endIndex]);

  // Handle header sorting click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper reset pagination on filter change
  const handleScopeChange = (newScope) => {
    setScope(newScope);
    setPage(1);
  };

  const handleTypeFilterChange = (newType) => {
    setTypeFilter(newType);
    setPage(1);
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleAddAsset = () => {
    const itSetupRoom = allFloorPlans.find(p => p.buildingId === 'it_setup_room');
    const defaultFloorPlanId = itSetupRoom ? itSetupRoom._id : (currentFloorPlan?._id || allFloorPlans[0]?._id);
    
    setEditingAsset({
      floorPlanId: defaultFloorPlanId,
      type: 'computer',
      status: 'active',
      x: 100,
      y: 100,
    });
    setIsEditModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleSaveAsset = async (updatedAsset) => {
    const isEdit = Boolean(editingAsset?.id || updatedAsset?.id);
    const sourceFloorPlanId = isEdit ? (editingAsset?.floorPlanId || updatedAsset.floorPlanId) : null;

    try {
      await moveAssetMutation.mutateAsync({
        assetId: updatedAsset.id,
        sourceFloorPlanId,
        targetFloorPlanId: updatedAsset.floorPlanId,
        assetData: updatedAsset,
      });
      showToast('success', isEdit ? 'อัปเดตอุปกรณ์สำเร็จ' : 'เพิ่มอุปกรณ์ใหม่สำเร็จ');
      setIsEditModalOpen(false);
      setEditingAsset(null);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดในการบันทึกอุปกรณ์';
      showToast('error', errMsg);
      throw err;
    }
  };

  if (!isOpen) return null;

  const formatBuildingName = (rawName) => {
    if (!rawName) return '';
    const cleaned = rawName
      .replace(/โครงการรวม\s*20\s*ไร่/g, 'พื้นที่ทั้งหมด')
      .replace(/20\s*ไร่/g, 'พื้นที่ทั้งหมด')
      .replace(/20-rai/gi, 'All Areas');
      
    if (cleaned.includes('Master Plan') || cleaned.includes('พื้นที่ทั้งหมด') || cleaned.includes('Campus')) {
      return language === 'th' ? 'พื้นที่ทั้งหมด' : 'All Areas';
    }
    return cleaned;
  };

  const getTypeBadge = (type) => {
    if (type === 'cctv')
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          📹 CCTV
        </span>
      );
    if (type === 'computer')
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
          💻 {t('typeComputer')}
        </span>
      );
    if (type === 'printer')
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
          🖨️ {t('typePrinter')}
        </span>
      );
    if (type?.startsWith('vehicle_'))
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          🚗 {t('typeVehicle')}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
        📦 {t('typeAsset')}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'broken') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" /> {t('statusBroken')}
        </span>
      );
    }
    if (status === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> {t('statusMaintenance')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('statusActive')}
      </span>
    );
  };

  const modalNode = (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 md:p-6 backdrop-blur-xs animate-in fade-in">
      <div className="flex h-[94vh] sm:h-[88vh] w-full max-w-7xl flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Mobile Pull/Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1 sm:hidden flex-shrink-0" />

        {/* 1. Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg sm:text-xl text-white shadow-md shadow-indigo-200">
                📋
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {t('assetInventoryModalTitle')}
                </h2>
                <p className="text-xs text-slate-500 hidden sm:block truncate">
                  {t('assetInventoryModalDesc')}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 shadow-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Desktop Controls: Scope Segmented Pill & Close Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleAddAsset}
              className="hidden sm:flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <span>+</span>
              <span>{t('btnAddNewAsset') || 'เพิ่มอุปกรณ์ใหม่'}</span>
            </button>
            
            <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleScopeChange('floor')}
                className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-center transition ${
                  scope === 'floor'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('scopeFloorOnly', { count: currentFloorAssets.length })}
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange('campus')}
                className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-center transition ${
                  scope === 'campus'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('scopeAllCampus', { count: allCampusAssets.length })}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 transition flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Bar (Clickable quick status filter chips) */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-2.5 flex-shrink-0 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold text-[11px] whitespace-nowrap mr-1 hidden sm:inline">
            KPI:
          </span>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{t('kpiTotal')}:</span>
            <strong className="font-mono">{kpiStats.total}</strong>
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('active')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition border ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{t('kpiActive')}:</span>
            <strong className="font-mono">{kpiStats.active}</strong>
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('maintenance')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition border ${
              statusFilter === 'maintenance'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{t('kpiMaintenance')}:</span>
            <strong className="font-mono">{kpiStats.maintenance}</strong>
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilterChange('broken')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition border ${
              statusFilter === 'broken'
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{t('kpiBroken')}:</span>
            <strong className="font-mono">{kpiStats.broken}</strong>
          </button>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            {/* Search Input Bar */}
            <div className="relative flex-1 sm:max-w-md">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder={t('searchAssetPlaceholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Type Filters Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 text-xs">
              {[
                { id: 'all', label: t('typeAll') },
                { id: 'cctv', label: '📹 CCTV' },
                { id: 'computer', label: '💻 ' + t('typeComputer') },
                { id: 'printer', label: '🖨️ ' + t('typePrinter') },
                { id: 'vehicle', label: '🚗 ' + t('typeVehicle') },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleTypeFilterChange(btn.id)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition ${
                    typeFilter === btn.id
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Sort Options on Mobile / Tablet */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={handleAddAsset}
              className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              <span>+</span>
              <span>{t('add') || 'เพิ่ม'}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:hidden">
              <span className="text-slate-400 text-[11px] font-semibold">{t('sortBy')}:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="code">{t('colAssetCode')}</option>
                <option value="name">{t('colAssetName')}</option>
                <option value="location">{t('colAssetLocation')}</option>
                <option value="status">{t('colAssetStatus')}</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="rounded-lg border border-slate-200 px-2 py-1 font-bold text-slate-600"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/60 p-3 sm:p-6">
          {/* Empty state */}
          {filteredList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-semibold text-slate-700 text-sm">{t('noAssetFoundCriteria')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('tryChangeSearchOrScope')}</p>
              {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className="mt-4 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  {t('clearSearch')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: High-Density Sticky-Header Data Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="min-w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <th
                        onClick={() => handleSort('code')}
                        className="py-3.5 px-3.5 cursor-pointer hover:text-indigo-600 select-none transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('colAssetCode')}</span>
                          {sortField === 'code' && (
                            <span className="text-indigo-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-3.5">{t('colAssetType')}</th>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3.5 px-3.5 cursor-pointer hover:text-indigo-600 select-none transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('colAssetName')}</span>
                          {sortField === 'name' && (
                            <span className="text-indigo-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-3.5">{t('colAssetOwner')}</th>
                      <th
                        onClick={() => handleSort('location')}
                        className="py-3.5 px-3.5 cursor-pointer hover:text-indigo-600 select-none transition"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('colAssetLocation')}</span>
                          {sortField === 'location' && (
                            <span className="text-indigo-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="py-3.5 px-3.5 text-center cursor-pointer hover:text-indigo-600 select-none transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{t('colAssetStatus')}</span>
                          {sortField === 'status' && (
                            <span className="text-indigo-600">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-right pr-4">{t('colAssetActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {paginatedList.map((asset) => (
                      <tr
                        key={`${asset.floorPlanId}-${asset.id}`}
                        className="hover:bg-indigo-50/40 transition group"
                      >
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {asset.code || asset.licensePlate || asset.parkingSlot || '-'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">{getTypeBadge(asset.type)}</td>
                        <td className="py-3 px-3.5 min-w-[200px]">
                          <div className="font-semibold text-slate-800">{asset.name}</div>
                          {asset.specs && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={asset.specs}>
                              {asset.specs}
                            </div>
                          )}
                          {asset.type === 'cctv' && (
                            <div className="inline-flex items-center gap-1 rounded-md bg-blue-50/80 px-2 py-0.5 text-[10px] text-blue-700 mt-1 font-medium border border-blue-100">
                              {t('cctvDetailsSpec', {
                                fov: asset.fovAngle || 75,
                                rot: asset.rotation || 0,
                                range: asset.rangeMeters || 10,
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 min-w-[140px]">
                          <div className="text-slate-800 font-medium text-xs">
                            {asset.assignedTo || asset.driverName || '-'}
                          </div>
                          {asset.department && (
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={asset.department}>
                              {asset.department}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 min-w-[220px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 text-xs line-clamp-1" title={formatBuildingName(asset.buildingName)}>
                              🏢 {formatBuildingName(asset.buildingName)}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              {asset.floorNumber ? <span className="font-medium">{t('floorNumberLabel', { floor: asset.floorNumber })}</span> : null}
                              {asset.floorNumber && asset.roomName ? <span>•</span> : null}
                              {asset.roomName ? <span className="text-indigo-600 truncate" title={asset.roomName}>📍 {asset.roomName}</span> : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {getStatusBadge(asset.status)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditAsset(asset)}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-xs transition"
                              title={t('editAssetDetails') || 'แก้ไขข้อมูลทรัพย์สิน'}
                            >
                              <span>✏️</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onTargetAsset?.(asset);
                                onClose();
                              }}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-xs transition"
                              title={t('targetOnPlanTooltip')}
                            >
                              <span>🎯</span>
                              <span className="hidden lg:inline">{t('targetOnPlan')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onRequestMaintenance?.(asset);
                              }}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 shadow-xs transition"
                              title={t('reportIssueTooltip')}
                            >
                              <span>🔧</span>
                              <span className="hidden lg:inline">{t('btnReportIssue')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW: Responsive Asset Cards List (< 640px) */}
              <div className="sm:hidden space-y-3">
                {paginatedList.map((asset) => (
                  <div
                    key={`${asset.floorPlanId}-${asset.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col gap-2.5"
                  >
                    {/* Card Top Row: Type, Name, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl flex-shrink-0">
                          {asset.type === 'cctv'
                            ? '📹'
                            : asset.type === 'computer'
                            ? '💻'
                            : asset.type === 'printer'
                            ? '🖨️'
                            : asset.type?.startsWith('vehicle_')
                            ? '🚗'
                            : '📦'}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{asset.name}</h4>
                          <span className="inline-block mt-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 border border-slate-200/60">
                            {asset.code || asset.licensePlate || asset.parkingSlot || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(asset.status)}</div>
                    </div>

                    {/* Card Location & Assignee */}
                    <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-2 text-slate-600 border border-slate-100 mt-1 shadow-inner shadow-slate-100/50">
                      <div className="flex flex-col gap-1 font-medium text-slate-800">
                        <div className="flex items-start gap-1.5">
                          <span className="mt-0.5">🏢</span>
                          <span className="font-bold line-clamp-2 leading-tight">{formatBuildingName(asset.buildingName)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                          {asset.floorNumber && (
                            <span className="whitespace-nowrap font-medium text-slate-600">
                              {t('floorNumberLabel', { floor: asset.floorNumber })}
                            </span>
                          )}
                          {asset.floorNumber && asset.roomName && <span className="text-slate-300">•</span>}
                          {asset.roomName && (
                            <span className="text-indigo-600 truncate font-semibold">📍 {asset.roomName}</span>
                          )}
                        </div>
                      </div>
                      
                      {(asset.assignedTo || asset.driverName || asset.department) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span>👤</span>
                          <span className="truncate font-medium">{asset.assignedTo || asset.driverName || '-'}</span>
                          {asset.department && <span className="text-slate-400 shrink-0">• {asset.department}</span>}
                        </div>
                      )}
                      
                      {asset.specs && (
                        <div className="text-[10px] text-slate-500 line-clamp-2 pt-0.5 leading-snug">
                          ⚙️ {asset.specs}
                        </div>
                      )}
                      
                      {asset.type === 'cctv' && (
                        <div className="inline-flex items-center gap-1 rounded-md bg-blue-50/80 px-2.5 py-1 text-[10px] text-blue-700 font-medium border border-blue-100 mt-1">
                          {t('cctvDetailsSpec', {
                            fov: asset.fovAngle || 75,
                            rot: asset.rotation || 0,
                            range: asset.rangeMeters || 10,
                          })}
                        </div>
                      )}
                    </div>

                    {/* Card Action Buttons: Dual Touch-Friendly */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEditAsset(asset)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition shadow-2xs"
                      >
                        ✏️ {t('edit') || 'แก้ไข'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onTargetAsset?.(asset);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-1 rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-98 transition shadow-2xs"
                      >
                        🎯 {t('targetOnPlan')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRequestMaintenance?.(asset);
                        }}
                        className="flex items-center justify-center gap-1 rounded-xl bg-amber-50 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 active:scale-98 transition"
                      >
                        🔧 {t('btnReportIssue')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 5. Pagination & Footer Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-4 sm:px-6 py-3 text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div>
              {t('showingRangeOfTotal', {
                start: filteredList.length > 0 ? startIndex + 1 : 0,
                end: endIndex,
                total: filteredList.length,
              })}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 hidden sm:inline">{t('rowsPerPage')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Prev / Next */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="text-[11px] font-medium text-slate-600 mr-1">
              {t('pageOf', { current: currentPage, total: totalPages })}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                ← {t('prevPage')}
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                {t('nextPage')} →
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <AssetEditModal
          open={isEditModalOpen}
          asset={editingAsset}
          departments={departments}
          allFloorPlans={allFloorPlans}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
          onDelete={null} // Don't allow delete from inventory for now, or you can implement it
        />
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

