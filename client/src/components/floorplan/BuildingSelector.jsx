import React, { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

export default function BuildingSelector({
  facilities = [],
  selectedBuildingId,
  onSelectBuilding,
  buildingStats = {}, // e.g. { b1: { issueCount: 1, totalAssets: 12 } }
  onOpenFacilityManage,
}) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'office' | 'warehouse' | 'campus'

  // Categorize
  const campusFacility = facilities.find((f) => f.type === 'campus') || {
    id: 'campus',
    name: t('defaultCampusName'),
    shortName: t('defaultCampusShortName'),
    type: 'campus',
    icon: '🌐',
  };

  const officeBuildings = facilities.filter((f) => f.type === 'office');
  const warehouseFacilities = facilities.filter((f) => f.type === 'warehouse');
  const otherFacilities = facilities.filter((f) => f.type !== 'office' && f.type !== 'warehouse' && f.type !== 'campus');

  const filteredFacilities =
    activeCategory === 'office'
      ? officeBuildings
      : activeCategory === 'warehouse'
      ? warehouseFacilities
      : activeCategory === 'campus'
      ? [campusFacility]
      : [campusFacility, ...officeBuildings, ...warehouseFacilities, ...otherFacilities];

  const totalStructures = officeBuildings.length + warehouseFacilities.length + otherFacilities.length;

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-sm backdrop-blur-md">
      {/* Category Pills, Management Button & Campus Badge */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            🏢 {t('allStructures', { count: totalStructures })}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('office')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeCategory === 'office'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            🏢 {t('officeBuildings', { count: officeBuildings.length })}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('warehouse')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeCategory === 'warehouse'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            🏭 {t('warehouseFacilities', { count: warehouseFacilities.length })}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('campus');
              onSelectBuilding('campus');
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              selectedBuildingId === 'campus'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            🌐 {t('campusOverviewPill')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFacilityManage && (
            <button
              type="button"
              onClick={onOpenFacilityManage}
              className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs transition"
              title={t('manageFacilitiesTitle')}
            >
              <span>🏗️</span>
              <span>{t('manageFacilitiesBtn')}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              🌱 {t('campusAreaTag')}
            </span>
          </div>
        </div>
      </div>

      {/* Buildings & Warehouses Horizontal Cards Grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
        {filteredFacilities.map((facility) => {
          const isSelected = selectedBuildingId === facility.id;
          const stats = buildingStats[facility.id] || {};
          const hasIssue = stats.issueCount > 0;
          const displayName = facility.id === 'campus' 
            ? t('defaultCampusShortName') 
            : (facility.shortName || facility.name);

          return (
            <button
              key={facility.id}
              type="button"
              onClick={() => onSelectBuilding(facility.id)}
              className={`group relative flex min-w-[170px] max-w-[210px] flex-shrink-0 flex-col rounded-xl border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50/80 shadow-sm ring-2 ring-primary-500/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              {/* Header row: Icon & Tag */}
              <div className="flex items-start justify-between gap-1">
                <span className="text-xl leading-none">{facility.icon || '🏢'}</span>
                <div className="flex items-center gap-1">
                  {facility.totalFloors > 1 && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-white">
                      {t('floorsCount', { count: facility.totalFloors })}
                    </span>
                  )}
                  {hasIssue && (
                    <span
                      title={t('hasIssuesCountBadge', { count: stats.issueCount })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse"
                    >
                      !
                    </span>
                  )}
                </div>
              </div>

              {/* Building Name */}
              <div className="mt-1.5">
                <h4
                  className={`text-xs font-bold leading-snug line-clamp-1 ${
                    isSelected ? 'text-primary-900' : 'text-slate-800'
                  }`}
                >
                  {displayName}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {facility.type === 'campus'
                    ? t('campusDesc')
                    : facility.type === 'warehouse'
                    ? t('warehouseDesc')
                    : t('officeDesc')}
                </p>
              </div>

              {/* Active Indicator bar */}
              {isSelected && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full bg-primary-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
