import { useState, useEffect } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import floorPlanService from '../../services/floorPlanService.js';

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

export default function FloorPlanAssetPickerModal({ isOpen, onClose, onSelectAsset }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllAssets = async () => {
      setLoading(true);
      try {
        const res = await floorPlanService.getAll();
        const plans = res.floorPlans || [];
        const facs = res.facilities || [];

        // Distinct buildings
        const bList = facs.map((f) => ({
          id: f.buildingId,
          name: f.name,
        }));
        setBuildings(bList);

        // Collect all assets from all floor plans
        const all = [];
        plans.forEach((plan) => {
          const bInfo = facs.find((f) => f.buildingId === plan.buildingId);
          const bName = bInfo?.name || plan.buildingId || (language === 'th' ? 'อาคารส่วนกลาง' : 'Campus Building');

          (plan.assets || []).forEach((item) => {
            all.push({
              assetId: item.id || `asset-${Math.random()}`,
              assetCode: item.assetCode || item.code || '',
              assetName: item.label || item.name || (language === 'th' ? 'อุปกรณ์' : 'Equipment'),
              assetType: item.type || 'other',
              buildingId: plan.buildingId,
              buildingName: bName,
              floorNumber: plan.floorNumber || 1,
              roomName: item.roomName || (language === 'th' ? 'พื้นที่สำนักงาน' : 'Office Area'),
              floorPlanId: plan._id,
              status: item.status || 'available',
            });
          });
        });

        // Also if any facility has standalone assets
        setAssets(all);
      } catch (err) {
        console.error('Error fetching assets for picker:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAssets();
  }, [isOpen, language]);

  if (!isOpen) return null;

  // Filter assets
  const filteredAssets = assets.filter((item) => {
    if (selectedBuilding !== 'all' && item.buildingId !== selectedBuilding) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.assetName.toLowerCase().includes(q);
      const matchCode = (item.assetCode || '').toLowerCase().includes(q);
      const matchRoom = (item.roomName || '').toLowerCase().includes(q);
      const matchBuilding = item.buildingName.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchRoom && !matchBuilding) return false;
    }
    return true;
  });

  const typeLabels = ASSET_TYPE_NAMES[language] || ASSET_TYPE_NAMES.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700">
              🗺️
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('chooseAssetFromFloorPlan')}</h2>
              <p className="text-xs text-slate-500">
                {t('chooseAssetFromFloorPlanDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Filter controls */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder={t('searchAssetPickerPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">🌐 {t('allBuildingsCount', { count: buildings.length })}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  🏢 {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assets List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <span className="inline-block animate-spin text-2xl">⏳</span>
              <p className="mt-2 text-sm">{t('loadingAssets')}</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl">📦</span>
              <p className="mt-2 text-sm">{t('noAssetsFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAssets.map((item) => (
                <div
                  key={`${item.floorPlanId}-${item.assetId}`}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                      {ASSET_ICONS[item.assetType] || '📦'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.assetCode && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-700">
                            {item.assetCode}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                          ({typeLabels[item.assetType] || item.assetType})
                        </span>
                      </div>
                      <h4 className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                        {item.assetName}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <span>🏢 {item.buildingName}</span>
                        <span>•</span>
                        <span>{t('floorLabel')} {item.floorNumber}</span>
                        <span>•</span>
                        <span>📍 {item.roomName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        item.status === 'maintenance'
                          ? 'text-amber-600'
                          : item.status === 'broken'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {item.status === 'maintenance'
                        ? t('assetStatusInRepair')
                        : item.status === 'broken'
                        ? t('assetStatusBroken')
                        : t('assetStatusAvailable')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAsset(item);
                        onClose();
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95"
                    >
                      {t('selectThisAsset')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3">
          <span className="text-xs text-slate-500">
            {t('totalFoundAssets', { count: filteredAssets.length })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
