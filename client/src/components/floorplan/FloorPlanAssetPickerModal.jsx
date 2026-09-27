import { useState, useEffect, useMemo } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import floorPlanService from '../../services/floorPlanService.js';
import facilityService from '../../services/facilityService.js';

const ASSET_ICONS = {
  cctv: '📹',
  computer: '💻',
  printer: '🖨️',
  desk: '🪑',
  meeting_table: '👥',
  emergency: '🧯',
  vehicle_car: '🚗',
  vehicle_truck: '🚛',
  vehicle_motorcycle: '🛵',
  vehicle_forklift: '🚜',
  parking_bay: '🅿️',
  ev_charger: '⚡',
  other: '📦',
};

const ASSET_TYPE_NAMES = {
  th: {
    cctv: 'กล้อง CCTV',
    computer: 'คอมพิวเตอร์',
    printer: 'เครื่องพิมพ์',
    desk: 'โต๊ะทำงาน',
    meeting_table: 'โต๊ะประชุม',
    emergency: 'ถังดับเพลิง/ฉุกเฉิน',
    vehicle_car: 'รถยนต์ส่วนกลาง',
    vehicle_truck: 'รถบรรทุก',
    vehicle_motorcycle: 'รถจักรยานยนต์',
    vehicle_forklift: 'รถโฟล์คลิฟท์',
    parking_bay: 'ช่องจอดรถ',
    ev_charger: 'จุดชาร์จ EV',
    other: 'อุปกรณ์อื่นๆ',
  },
  en: {
    cctv: 'CCTV Camera',
    computer: 'Computer / Laptop',
    printer: 'Printer / Copier',
    desk: 'Workstation / Desk',
    meeting_table: 'Meeting Table',
    emergency: 'Fire Extinguisher',
    vehicle_car: 'Company Car',
    vehicle_truck: 'Truck',
    vehicle_motorcycle: 'Motorcycle',
    vehicle_forklift: 'Forklift',
    parking_bay: 'Parking Bay',
    ev_charger: 'EV Charger Station',
    other: 'Other Equipment',
  },
};

const TYPE_FILTER_CATEGORIES = [
  { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All', icon: '✨' },
  { id: 'computer', labelTh: 'คอมพิวเตอร์', labelEn: 'Computers', icon: '💻', matchTypes: ['computer'] },
  { id: 'printer', labelTh: 'เครื่องพิมพ์', labelEn: 'Printers', icon: '🖨️', matchTypes: ['printer'] },
  { id: 'cctv', labelTh: 'กล้อง CCTV', labelEn: 'CCTV', icon: '📹', matchTypes: ['cctv'] },
  {
    id: 'vehicle',
    labelTh: 'ยานพาหนะ',
    labelEn: 'Vehicles',
    icon: '🚗',
    matchTypes: ['vehicle_car', 'vehicle_truck', 'vehicle_motorcycle', 'vehicle_forklift', 'parking_bay', 'ev_charger'],
  },
  {
    id: 'other',
    labelTh: 'อื่นๆ/เฟอร์นิเจอร์',
    labelEn: 'Others',
    icon: '📦',
    matchTypes: ['desk', 'meeting_table', 'emergency', 'other'],
  },
];

// Helper to shorten verbose building names like "อาคาร 1: สำนักงานใหญ่ (HQ Building)" -> "อาคาร 1"
function getShortBuildingName(name) {
  if (!name) return '';
  if (name.includes(':')) {
    return name.split(':')[0].trim();
  }
  if (name.includes('(')) {
    return name.split('(')[0].trim();
  }
  return name;
}

export default function FloorPlanAssetPickerModal({ isOpen, onClose, onSelectAsset }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedTypeCategory, setSelectedTypeCategory] = useState('all');
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllAssets = async () => {
      setLoading(true);
      try {
        const [planRes, facRes] = await Promise.all([
          floorPlanService.getAll().catch(() => ({ floorPlans: [], facilities: [] })),
          facilityService.getAll().catch(() => []),
        ]);

        const plans = planRes.floorPlans || [];
        const rawFacs = [...(planRes.facilities || []), ...(facRes || [])];

        // Map facilities by their valid identifier (facilityId or id or _id)
        const bMap = new Map();
        rawFacs.forEach((f) => {
          const fid = f.facilityId || f.id || f._id;
          if (fid && !bMap.has(fid)) {
            bMap.set(fid, {
              id: fid,
              name: f.name || f.shortName || fid,
            });
          }
        });

        // Also ensure any buildings from plans are in the list
        plans.forEach((p) => {
          if (p.buildingId && !bMap.has(p.buildingId)) {
            bMap.set(p.buildingId, {
              id: p.buildingId,
              name: p.buildingName || p.buildingId,
            });
          }
        });

        setBuildings(Array.from(bMap.values()));

        // Collect all assets from all floor plans with spatial room matching
        const all = [];
        plans.forEach((plan) => {
          const bInfo = bMap.get(plan.buildingId);
          const bName = plan.buildingName || bInfo?.name || plan.buildingId || (language === 'th' ? 'อาคารส่วนกลาง' : 'Campus Building');

          (plan.assets || []).forEach((item) => {
            let roomName = item.roomName;
            if (!roomName && plan.rooms && Array.isArray(plan.rooms)) {
              const matchedRoom = plan.rooms.find(
                (r) =>
                  item.x >= r.x &&
                  item.x <= r.x + r.width &&
                  item.y >= r.y &&
                  item.y <= r.y + r.height
              );
              if (matchedRoom) roomName = matchedRoom.name;
            }
            if (!roomName) {
              roomName = plan.floorName || (language === 'th' ? 'พื้นที่สำนักงาน' : 'Office Area');
            }

            all.push({
              assetId: item.id || `asset-${Math.random()}`,
              assetCode: item.assetCode || item.code || '',
              assetName: item.label || item.name || (language === 'th' ? 'อุปกรณ์' : 'Equipment'),
              assetType: item.type || 'other',
              buildingId: plan.buildingId,
              buildingName: bName,
              floorNumber: plan.floorNumber || 1,
              roomName,
              floorPlanId: plan._id,
              status: item.status || 'available',
              pcName: item.pcName || '',
              osVersion: item.osVersion || '',
              cpu: item.cpu || '',
              ram: item.ram || '',
              storage: item.storage || '',
              specs: item.specs || '',
              peripherals: item.peripherals || [],
              installedSoftware: item.installedSoftware || [],
            });
          });
        });

        setAssets(all);
      } catch (err) {
        console.error('Error fetching assets for picker:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAssets();
  }, [isOpen, language]);

  // Count assets per building for display in the selector
  const buildingAssetCounts = useMemo(() => {
    const counts = {};
    assets.forEach((a) => {
      counts[a.buildingId] = (counts[a.buildingId] || 0) + 1;
    });
    return counts;
  }, [assets]);

  // Count assets per type category for filter pills
  const typeCategoryCounts = useMemo(() => {
    const counts = { all: assets.length };
    TYPE_FILTER_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = assets.filter((a) => {
        if (selectedBuilding !== 'all' && a.buildingId !== selectedBuilding) return false;
        return cat.matchTypes ? cat.matchTypes.includes(a.assetType) : a.assetType === cat.id;
      }).length;
    });
    return counts;
  }, [assets, selectedBuilding]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // Building filter
      if (selectedBuilding !== 'all' && item.buildingId !== selectedBuilding) return false;

      // Category filter
      if (selectedTypeCategory !== 'all') {
        const cat = TYPE_FILTER_CATEGORIES.find((c) => c.id === selectedTypeCategory);
        if (cat?.matchTypes) {
          if (!cat.matchTypes.includes(item.assetType)) return false;
        } else if (item.assetType !== selectedTypeCategory) {
          return false;
        }
      }

      // Search keyword filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (item.assetName || '').toLowerCase().includes(q);
        const matchCode = (item.assetCode || '').toLowerCase().includes(q);
        const matchRoom = (item.roomName || '').toLowerCase().includes(q);
        const matchBuilding = (item.buildingName || '').toLowerCase().includes(q);
        const matchPc = (item.pcName || '').toLowerCase().includes(q);
        const matchOs = (item.osVersion || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRoom && !matchBuilding && !matchPc && !matchOs) return false;
      }

      return true;
    });
  }, [assets, selectedBuilding, selectedTypeCategory, search]);

  if (!isOpen) return null;

  const typeLabels = ASSET_TYPE_NAMES[language] || ASSET_TYPE_NAMES.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 lg:p-6 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex h-[90vh] max-h-[920px] w-full max-w-6xl 2xl:max-w-7xl flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 ring-1 ring-blue-100">
              🗺️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{t('chooseAssetFromFloorPlan')}</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                  {assets.length} {language === 'th' ? 'รายการทั้งหมด' : 'total assets'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t('chooseAssetFromFloorPlanDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 space-y-3">
          {/* Row 1: Search & Building Dropdown */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder={t('searchAssetPickerPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="all">
                🌐 {language === 'th' ? 'ทุกอาคารและสถานที่' : 'All Facilities'} ({assets.length})
              </option>
              {buildings.map((b) => {
                const count = buildingAssetCounts[b.id] || 0;
                const shortName = getShortBuildingName(b.name);
                return (
                  <option key={b.id} value={b.id}>
                    🏢 {shortName} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {TYPE_FILTER_CATEGORIES.map((cat) => {
              const active = selectedTypeCategory === cat.id;
              const count = typeCategoryCounts[cat.id] ?? 0;
              const label = language === 'th' ? cat.labelTh : cat.labelEn;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedTypeCategory(cat.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
                    active
                      ? 'bg-blue-600 font-semibold text-white shadow-xs ring-2 ring-blue-600/30'
                      : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assets Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <span className="inline-block animate-spin text-3xl">⏳</span>
              <p className="mt-3 text-sm font-medium">{t('loadingAssets')}</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <span className="text-4xl">📦</span>
              <p className="mt-3 text-sm font-medium">{t('noAssetsFound')}</p>
              {(search || selectedBuilding !== 'all' || selectedTypeCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedBuilding('all');
                    setSelectedTypeCategory('all');
                  }}
                  className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
              {filteredAssets.map((item) => {
                const shortBuilding = getShortBuildingName(item.buildingName);
                const isSingleBuilding = selectedBuilding !== 'all';

                return (
                  <div
                    key={`${item.floorPlanId}-${item.assetId}`}
                    onClick={() => {
                      onSelectAsset(item);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectAsset(item);
                        onClose();
                      }
                    }}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-150 hover:border-blue-500 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/20 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    <div>
                      {/* Top Row: Icon + Code + Hostname + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base group-hover:bg-blue-100 transition-colors">
                            {ASSET_ICONS[item.assetType] || '📦'}
                          </span>
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            {item.assetCode && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
                                {item.assetCode}
                              </span>
                            )}
                            {item.pcName && (
                              <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 truncate max-w-[140px]">
                                💻 {item.pcName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.status === 'maintenance'
                              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                              : item.status === 'broken'
                              ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === 'maintenance'
                                ? 'bg-amber-500'
                                : item.status === 'broken'
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {item.status === 'maintenance'
                            ? t('assetStatusInRepair')
                            : item.status === 'broken'
                            ? t('assetStatusBroken')
                            : t('assetStatusAvailable')}
                        </span>
                      </div>

                      {/* Middle: Asset Name */}
                      <h4
                        className="mt-2.5 text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate"
                        title={item.assetName}
                      >
                        {item.assetName}
                      </h4>

                      {/* Location: Compact without redundant repetition */}
                      <p
                        className="mt-1 text-xs text-slate-500 truncate"
                        title={
                          isSingleBuilding
                            ? `${t('floorLabel')} ${item.floorNumber} • 📍 ${item.roomName}`
                            : `🏢 ${shortBuilding} • ${t('floorLabel')} ${item.floorNumber} • 📍 ${item.roomName}`
                        }
                      >
                        {!isSingleBuilding && (
                          <>
                            <span className="font-medium text-slate-600">🏢 {shortBuilding}</span>
                            <span className="mx-1 text-slate-300">•</span>
                          </>
                        )}
                        <span>{t('floorLabel')} {item.floorNumber}</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span>📍 {item.roomName}</span>
                      </p>
                    </div>

                    {/* Bottom: Device Type & Action */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <span className="text-[11px] font-medium text-slate-400">
                        {typeLabels[item.assetType] || item.assetType}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all">
                        {language === 'th' ? 'เลือกอุปกรณ์นี้' : 'Select'}{' '}
                        <span className="text-sm">→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {t('totalFoundAssets', { count: filteredAssets.length })}
            </span>
            {(selectedBuilding !== 'all' || selectedTypeCategory !== 'all' || search) && (
              <span className="text-xs text-blue-600">
                ({language === 'th' ? 'มีตัวกรองทำงานอยู่' : 'Filtered'})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
