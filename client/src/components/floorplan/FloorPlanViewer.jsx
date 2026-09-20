import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Group,
  Arc,
  Circle,
  Wedge,
} from 'react-konva';
import {
  calculateAreaMeters,
  calculateLengthMeters,
  calculatePolygonArea,
  getPolygonCenter,
  getWallCoords,
} from './snapUtils.js';
import useLanguage from '../../hooks/useLanguage.js';
import FloorElevatorControl from './FloorElevatorControl.jsx';
import VehicleShape from './VehicleShape.jsx';
import FloorPlanImageOverlay from './FloorPlanImageOverlay.jsx';
import { exportToPng, exportToPdf } from '../../utils/exportFloorPlan.js';

export default function FloorPlanViewer({
  floorPlan,
  canEdit = false,
  onEditPlan,
  initialFocusAssetId = null,
  onSelectBuilding,
  onOpenCampusSearch,
  onOpenAssetInventory,
  onRequestMaintenance,
  currentBuilding,
  currentFloorNumber,
  onSelectFloor,
  onReturnToCampus,
  floorPlansInBuilding = [],
  onOpenCopyLayoutModal,
  onAddFloor,
  onDeleteFloor,
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [highlightedAssetId, setHighlightedAssetId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Canvas Viewport & Zoom/Pan
  const [stageScale, setStageScale] = useState(1.0);
  const [stagePos, setStagePos] = useState({ x: 30, y: 30 });
  const stageRef = useRef(null);

  // Layer Visibility Controls
  const [layers, setLayers] = useState({
    cctv: true,
    cctvFov: true,
    computer: true,
    printer: true,
    vehicle: true,
    maintenanceOnly: false,
    rooms: true,
  });

  const rooms = floorPlan?.rooms || [];
  const walls = floorPlan?.walls || [];
  const doors = floorPlan?.doors || [];
  const assets = floorPlan?.assets || [];
  const gridSize = floorPlan?.gridSize || 20;
  const scaleMetersPerGrid = floorPlan?.scaleMetersPerGrid || 1.0;

  // Filter assets based on layer visibility
  const visibleAssets = useMemo(() => {
    return assets.filter((asset) => {
      // If maintenanceOnly filter is active, only show broken/maintenance assets
      if (layers.maintenanceOnly && asset.status !== 'broken' && asset.status !== 'maintenance') {
        return false;
      }

      if (asset.type === 'cctv') return layers.cctv;
      if (asset.type === 'computer' || asset.type === 'desk') return layers.computer;
      if (asset.type === 'printer') return layers.printer;
      if (asset.type?.startsWith('vehicle_') || asset.type === 'parking_bay' || asset.type === 'ev_charger') {
        return layers.vehicle;
      }
      return true;
    });
  }, [assets, layers]);

  // Search matches for Asset Locator
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return assets.filter(
      (a) =>
        a.code?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.assignedTo?.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q) ||
        a.specs?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q) ||
        a.licensePlate?.toLowerCase().includes(q) ||
        a.driverName?.toLowerCase().includes(q) ||
        a.parkingSlot?.toLowerCase().includes(q) ||
        a.vehicleModel?.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  // Smooth Pan & Zoom to Asset (Asset Locator)
  const focusOnAsset = (asset) => {
    if (!asset || !stageRef.current) return;
    const stage = stageRef.current;
    const targetScale = 1.35;
    const stageWidth = stage.width();
    const stageHeight = stage.height();

    const targetX = stageWidth / 2 - asset.x * targetScale;
    const targetY = stageHeight / 2 - asset.y * targetScale;

    stage.to({
      x: targetX,
      y: targetY,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 0.45,
    });

    setStagePos({ x: targetX, y: targetY });
    setStageScale(targetScale);
    setSelectedAsset(asset);
    setSelectedRoom(null);
    setHighlightedAssetId(asset.id);

    // Stop pulsing after 8 seconds
    setTimeout(() => {
      setHighlightedAssetId((curr) => (curr === asset.id ? null : curr));
    }, 8000);
  };

  useEffect(() => {
    if (initialFocusAssetId) {
      const target = assets.find((a) => a.id === initialFocusAssetId);
      if (target) focusOnAsset(target);
    }
  }, [initialFocusAssetId]);

  const handleZoom = (direction) => {
    setStageScale((prev) => {
      const next = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(next, 0.4), 2.2);
    });
  };

  const handleResetView = () => {
    setStageScale(1.0);
    setStagePos({ x: 30, y: 30 });
    setSelectedAsset(null);
    setSelectedRoom(null);
    setHighlightedAssetId(null);
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Asset Locator Search Bar & Global 20-Rai Search Button */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative min-w-[220px] flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                t('assetLocatorPlaceholder') ||
                'ค้นหาทรัพย์สินในชั้นนี้: รหัส, คน, กล้อง...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}

            {/* Quick Search Autocomplete Dropdown */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  พบ {searchResults.length} อุปกรณ์ (คลิกเพื่อชี้เป้าบนแผนที่)
                </div>
                {searchResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      focusOnAsset(item);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-primary-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {item.type === 'cctv'
                          ? '📹'
                          : item.type === 'printer'
                          ? '🖨️'
                          : '💻'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">
                          {item.code} - {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.assignedTo ? `👤 ${item.assignedTo}` : item.department}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'broken'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onOpenCampusSearch && (
            <button
              type="button"
              onClick={onOpenCampusSearch}
              className="flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 shadow-xs hover:bg-primary-100 hover:border-primary-400 transition whitespace-nowrap"
              title="ค้นหาทรัพย์สินทุกอาคารและทุกชั้นทั่วทั้งโครงการ 20 ไร่"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">ค้นหาทั้ง 20 ไร่</span>
            </button>
          )}

          {onOpenAssetInventory && (
            <button
              type="button"
              onClick={onOpenAssetInventory}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-300 transition whitespace-nowrap"
              title="เปิดตารางรายการทรัพย์สินทั้งหมด พร้อมค้นหาและชี้เป้า"
            >
              <span>📋</span>
              <span className="hidden sm:inline">ตารางทรัพย์สิน</span>
            </button>
          )}
        </div>

        {/* Right: Layer Filtering Switches & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-white p-1 border border-slate-200 shadow-sm text-xs">
            <button
              type="button"
              onClick={() =>
                setLayers((prev) => ({ ...prev, cctv: !prev.cctv }))
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                layers.cctv
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="เปิด/ปิด การแสดงกล้องวงจรปิด"
            >
              📹 CCTV
            </button>

            {layers.cctv && (
              <button
                type="button"
                onClick={() =>
                  setLayers((prev) => ({ ...prev, cctvFov: !prev.cctvFov }))
                }
                className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                  layers.cctvFov
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="เปิด/ปิด แถบแสงจำลองมุมกล้อง (FOV Beam)"
              >
                🔦 แสงมุมมอง (FOV)
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setLayers((prev) => ({ ...prev, computer: !prev.computer }))
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                layers.computer
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="เปิด/ปิด เครื่องคอมพิวเตอร์และโต๊ะทำงาน"
            >
              💻 IT & โต๊ะ
            </button>

            <button
              type="button"
              onClick={() =>
                setLayers((prev) => ({ ...prev, printer: !prev.printer }))
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                layers.printer
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="เปิด/ปิด เครื่องพิมพ์"
            >
              🖨️ เครื่องพิมพ์
            </button>

            <button
              type="button"
              onClick={() =>
                setLayers((prev) => ({ ...prev, vehicle: !prev.vehicle }))
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                layers.vehicle
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="เปิด/ปิด ยานพาหนะและจุดจอดรถ"
            >
              🚗 ยานพาหนะ/ที่จอด
            </button>

            <button
              type="button"
              onClick={() =>
                setLayers((prev) => ({
                  ...prev,
                  maintenanceOnly: !prev.maintenanceOnly,
                }))
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition ${
                layers.maintenanceOnly
                  ? 'bg-red-100 text-red-800 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="กรองดูเฉพาะอุปกรณ์ที่แจ้งเสียหรือซ่อมบำรุง"
            >
              ⚠️ เฉพาะแจ้งเสีย
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => handleZoom('out')}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              title="ย่อ"
            >
              ➖
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="px-2 py-1 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
              title="รีเซ็ตมุมมอง"
            >
              {Math.round(stageScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom('in')}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              title="ขยาย"
            >
              ➕
            </button>
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="ส่งออกผังอาคาร (PNG, PDF)"
            >
              📤 ส่งออก ▾
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToPng(stageRef.current, {
                      fileName: `${floorPlan?.buildingName || 'FTI'}-${floorPlan?.floorName || 'Plan'}.png`.replace(/\s+/g, '_'),
                    });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <span className="text-base">📸</span>
                  <div className="text-left">
                    <div className="font-bold">บันทึกเป็นรูปภาพ (PNG)</div>
                    <div className="text-[10px] text-slate-400">ภาพคมชัดสูง Retina</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToPdf(stageRef.current, floorPlan || {});
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <span className="text-base">📄</span>
                  <div className="text-left">
                    <div className="font-bold">พิมพ์เอกสาร PDF (A4)</div>
                    <div className="text-[10px] text-slate-400">พร้อมข้อมูลโครงการและสเกล</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Edit Plan Button for Admin */}
          {canEdit && onEditPlan && (
            <button
              type="button"
              onClick={onEditPlan}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition"
            >
              ✏️ {t('editFloorPlan') || 'โหมดแก้ไขแปลน'}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative h-[620px] w-full bg-slate-50 overflow-hidden cursor-grab active:cursor-grabbing">
        <Stage
          ref={stageRef}
          width={window.innerWidth > 1200 ? 1200 : window.innerWidth - 60}
          height={620}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          {/* Base Floor Canvas Background & Blueprint Overlay */}
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={2400}
              height={1600}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth={1.5}
            />
            {floorPlan?.backgroundImage?.url && floorPlan?.backgroundImage?.visible !== false && (
              <FloorPlanImageOverlay
                config={floorPlan.backgroundImage}
                isSelected={false}
              />
            )}
          </Layer>

          {/* CAD DXF Layer */}
          {floorPlan?.dxfLayer?.visible !== false && floorPlan?.dxfLayer?.entities?.length > 0 && (
            <Layer opacity={floorPlan.dxfLayer.opacity ?? 0.65} listening={false}>
              {floorPlan.dxfLayer.entities.map((shape) => {
                if (shape.type === 'line') {
                  return (
                    <Line
                      key={shape.id}
                      points={shape.points}
                      closed={shape.closed}
                      stroke={shape.stroke || '#334155'}
                      strokeWidth={shape.strokeWidth || 1.5}
                    />
                  );
                }
                if (shape.type === 'circle') {
                  return (
                    <Circle
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      stroke={shape.stroke || '#334155'}
                      strokeWidth={shape.strokeWidth || 1.5}
                    />
                  );
                }
                if (shape.type === 'arc') {
                  return (
                    <Arc
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      innerRadius={shape.innerRadius}
                      outerRadius={shape.outerRadius}
                      angle={shape.angle}
                      rotation={shape.rotation}
                      stroke={shape.stroke || '#334155'}
                      strokeWidth={shape.strokeWidth || 1.5}
                    />
                  );
                }
                if (shape.type === 'text') {
                  return (
                    <Text
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      text={shape.text}
                      fontSize={shape.fontSize || 12}
                      fill={shape.fill || '#334155'}
                    />
                  );
                }
                return null;
              })}
            </Layer>
          )}

          {/* Architectural Layer: Rooms, Walls, Doors */}
          {layers.rooms && (
            <Layer>
              {/* Rooms */}
              {rooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                const isPolygon = room.shapeType === 'polygon' && Array.isArray(room.points) && room.points.length >= 6;
                const area = isPolygon
                  ? calculatePolygonArea(room.points, gridSize, scaleMetersPerGrid)
                  : calculateAreaMeters(
                      room.width,
                      room.height,
                      gridSize,
                      scaleMetersPerGrid
                    );
                const polyCenter = isPolygon ? getPolygonCenter(room.points) : null;

                if (isPolygon) {
                  return (
                    <Group
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room);
                        setSelectedAsset(null);
                      }}
                      onTouchEnd={() => {
                        setSelectedRoom(room);
                        setSelectedAsset(null);
                      }}
                    >
                      <Line
                        points={room.points}
                        closed={true}
                        fill={room.color || '#dbeafe'}
                        stroke={isSelected ? '#2563eb' : '#64748b'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        opacity={0.88}
                        shadowColor="rgba(0,0,0,0.04)"
                        shadowBlur={isSelected ? 12 : 3}
                      />
                      <Text
                        text={room.name || 'ห้องรูปหลายเหลี่ยม'}
                        x={polyCenter.x - 45}
                        y={polyCenter.y - 12}
                        fontSize={13}
                        fontFamily="Inter, Noto Sans Thai, sans-serif"
                        fontStyle="bold"
                        fill="#1e293b"
                        listening={false}
                      />
                      <Text
                        text={`${room.department ? room.department + ' • ' : ''}${area}m²`}
                        x={polyCenter.x - 45}
                        y={polyCenter.y + 6}
                        fontSize={10}
                        fontFamily="Inter, Noto Sans Thai, sans-serif"
                        fill="#475569"
                        listening={false}
                      />
                    </Group>
                  );
                }

                return (
                  <Group
                    key={room.id}
                    x={room.x}
                    y={room.y}
                    onClick={() => {
                      setSelectedRoom(room);
                      setSelectedAsset(null);
                    }}
                    onTouchEnd={() => {
                      setSelectedRoom(room);
                      setSelectedAsset(null);
                    }}
                  >
                    {/* Room Box */}
                    <Rect
                      width={room.width}
                      height={room.height}
                      fill={room.color || '#dbeafe'}
                      stroke={isSelected ? '#2563eb' : '#64748b'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      cornerRadius={4}
                      opacity={0.88}
                      shadowColor="rgba(0,0,0,0.04)"
                      shadowBlur={isSelected ? 12 : 3}
                    />

                    {/* Room Name */}
                    <Text
                      text={room.name || 'ห้อง'}
                      x={8}
                      y={8}
                      fontSize={13}
                      fontFamily="Inter, Noto Sans Thai, sans-serif"
                      fontStyle="bold"
                      fill="#1e293b"
                      width={Math.max(room.width - 16, 50)}
                      ellipsis={true}
                      wrap="none"
                      listening={false}
                    />

                    {/* Department & Area */}
                    {room.height >= 40 && (
                      <Text
                        text={`${room.department ? room.department + ' • ' : ''}${area} m²`}
                        x={8}
                        y={26}
                        fontSize={10}
                        fontFamily="Inter, Noto Sans Thai, sans-serif"
                        fill="#475569"
                        width={Math.max(room.width - 16, 50)}
                        ellipsis={true}
                        wrap="none"
                        listening={false}
                      />
                    )}

                    {/* Extension */}
                    {room.height >= 60 && room.extension && (
                      <Text
                        text={`📞 Ext: ${room.extension}`}
                        x={8}
                        y={42}
                        fontSize={9.5}
                        fontFamily="Inter, Noto Sans Thai, sans-serif"
                        fill="#64748b"
                        listening={false}
                      />
                    )}
                  </Group>
                );
              })}

              {/* Walls */}
              {walls.map((wall) => {
                const { x1, y1, x2, y2 } = getWallCoords(wall);
                const len = calculateLengthMeters(
                  x1,
                  y1,
                  x2,
                  y2,
                  gridSize,
                  scaleMetersPerGrid
                );
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <Group key={wall.id} listening={false}>
                    <Line
                      points={[x1, y1, x2, y2]}
                      stroke="#1e293b"
                      strokeWidth={wall.strokeWidth || wall.thickness || 8}
                      lineCap="round"
                      lineJoin="round"
                    />
                    <Text
                      text={`${len}m`}
                      x={midX - 14}
                      y={midY - 14}
                      fontSize={10}
                      fontStyle="bold"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fillAfterStrokeEnabled={true}
                    />
                  </Group>
                );
              })}

              {/* Doors */}
              {doors.map((door) => {
                const isWindow = door.type === 'window';
                return (
                  <Group
                    key={door.id}
                    x={door.x}
                    y={door.y}
                    rotation={door.rotation || 0}
                    listening={false}
                  >
                    {isWindow ? (
                      <>
                        <Line
                          points={[0, -18, 0, 18]}
                          stroke="#0284c7"
                          strokeWidth={5}
                          lineCap="round"
                        />
                        <Line
                          points={[-4, -16, -4, 16]}
                          stroke="#7dd3fc"
                          strokeWidth={2}
                        />
                        <Line
                          points={[4, -16, 4, 16]}
                          stroke="#7dd3fc"
                          strokeWidth={2}
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          points={[0, 0, 0, 32]}
                          stroke="#854d0e"
                          strokeWidth={3}
                          lineCap="round"
                        />
                        <Arc
                          x={0}
                          y={0}
                          innerRadius={0}
                          outerRadius={32}
                          angle={90}
                          rotation={0}
                          stroke="#a16207"
                          strokeWidth={1.5}
                          dash={[3, 3]}
                        />
                      </>
                    )}
                  </Group>
                );
              })}
            </Layer>
          )}

          {/* CCTV Vision / Coverage Cones Layer (Fan-shaped FOV beam) */}
          {layers.cctv && layers.cctvFov && (
            <Layer listening={false}>
              {visibleAssets
                .filter((a) => a.type === 'cctv')
                .map((cam) => {
                  const fov = cam.fovAngle || 75;
                  const radiusPx = (cam.rangeMeters || 10) * 20; // 20px = 1m
                  const isMaintenance = cam.status === 'maintenance';
                  const isBroken = cam.status === 'broken';

                  const coneColor = isBroken
                    ? 'rgba(239, 68, 68, 0.22)'
                    : isMaintenance
                    ? 'rgba(245, 158, 11, 0.22)'
                    : 'rgba(59, 130, 246, 0.20)';

                  const strokeColor = isBroken
                    ? 'rgba(239, 68, 68, 0.55)'
                    : isMaintenance
                    ? 'rgba(245, 158, 11, 0.55)'
                    : 'rgba(59, 130, 246, 0.50)';

                  return (
                    <Group key={`fov-${cam.id}`} x={cam.x} y={cam.y}>
                      {/* Fan-shaped FOV beam projection */}
                      <Wedge
                        x={0}
                        y={0}
                        radius={radiusPx}
                        angle={fov}
                        rotation={(cam.rotation || 0) - fov / 2}
                        fill={coneColor}
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        dash={[6, 4]}
                      />
                      {/* Range dimension label at edge */}
                      <Text
                        text={`${cam.rangeMeters || 10}m (${fov}°)`}
                        x={Math.cos(((cam.rotation || 0) * Math.PI) / 180) * (radiusPx * 0.8) - 16}
                        y={Math.sin(((cam.rotation || 0) * Math.PI) / 180) * (radiusPx * 0.8)}
                        fontSize={9}
                        fontStyle="bold"
                        fill={isBroken ? '#dc2626' : '#2563eb'}
                      />
                    </Group>
                  );
                })}
            </Layer>
          )}

          {/* Assets & Equipment Layer (CCTV, PC, Printer, etc.) */}
          <Layer>
            {visibleAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;
              const isTargeted = highlightedAssetId === asset.id;

              return (
                <Group
                  key={asset.id}
                  x={asset.x}
                  y={asset.y}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setSelectedRoom(null);
                  }}
                  onTouchEnd={() => {
                    setSelectedAsset(asset);
                    setSelectedRoom(null);
                  }}
                >
                  {/* Blinking Pulsing Highlight Ring when target of Asset Locator */}
                  {isTargeted && (
                    <Circle
                      radius={26}
                      stroke="#f59e0b"
                      strokeWidth={3.5}
                      shadowColor="#f59e0b"
                      shadowBlur={15}
                    />
                  )}

                  {/* Render based on asset type */}
                  {asset.type === 'cctv' && (
                    <Group rotation={asset.rotation || 0}>
                      {/* CCTV Body */}
                      <Circle
                        radius={10}
                        fill={isSelected ? '#2563eb' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth={2}
                        shadowColor="rgba(0,0,0,0.25)"
                        shadowBlur={6}
                      />
                      {/* Lens pointer showing direction */}
                      <Line
                        points={[0, 0, 16, 0]}
                        stroke="#3b82f6"
                        strokeWidth={3.5}
                        lineCap="round"
                      />
                      {/* Status indicator dot */}
                      <Circle
                        radius={3.5}
                        fill={
                          asset.status === 'active'
                            ? '#10b981'
                            : asset.status === 'broken'
                            ? '#ef4444'
                            : '#f59e0b'
                        }
                      />
                    </Group>
                  )}

                  {asset.type === 'computer' && (
                    <Group x={-18} y={-14}>
                      {/* Desk surface */}
                      <Rect
                        width={36}
                        height={28}
                        cornerRadius={4}
                        fill={isSelected ? '#eff6ff' : '#f8fafc'}
                        stroke={
                          isSelected
                            ? '#2563eb'
                            : asset.status === 'broken'
                            ? '#ef4444'
                            : '#94a3b8'
                        }
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        shadowColor="rgba(0,0,0,0.08)"
                        shadowBlur={4}
                      />
                      {/* Monitor screen */}
                      <Rect
                        x={7}
                        y={5}
                        width={22}
                        height={5}
                        cornerRadius={1}
                        fill="#1e293b"
                      />
                      {/* Keyboard */}
                      <Rect
                        x={11}
                        y={14}
                        width={14}
                        height={6}
                        cornerRadius={1}
                        fill="#cbd5e1"
                      />
                      {/* Status dot */}
                      <Circle
                        x={31}
                        y={5}
                        radius={3}
                        fill={
                          asset.status === 'active'
                            ? '#10b981'
                            : asset.status === 'broken'
                            ? '#ef4444'
                            : '#f59e0b'
                        }
                      />
                    </Group>
                  )}

                  {asset.type === 'printer' && (
                    <Group x={-16} y={-14}>
                      <Rect
                        width={32}
                        height={28}
                        cornerRadius={4}
                        fill={isSelected ? '#f5f3ff' : '#f8fafc'}
                        stroke={isSelected ? '#7c3aed' : '#64748b'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        shadowColor="rgba(0,0,0,0.08)"
                        shadowBlur={4}
                      />
                      {/* Paper tray */}
                      <Rect
                        x={6}
                        y={4}
                        width={20}
                        height={5}
                        fill="#cbd5e1"
                        cornerRadius={1}
                      />
                      {/* Print slot */}
                      <Line
                        points={[8, 16, 24, 16]}
                        stroke="#94a3b8"
                        strokeWidth={2}
                      />
                      {/* Status dot */}
                      <Circle
                        x={27}
                        y={5}
                        radius={3}
                        fill={
                          asset.status === 'active'
                            ? '#10b981'
                            : asset.status === 'broken'
                            ? '#ef4444'
                            : '#f59e0b'
                        }
                      />
                    </Group>
                  )}

                  {/* Vehicle & Parking vector rendering */}
                  {(asset.type?.startsWith('vehicle_') ||
                    asset.type === 'parking_bay' ||
                    asset.type === 'ev_charger') && (
                    <VehicleShape
                      asset={asset}
                      isSelected={isSelected}
                      isTargeted={isTargeted}
                    />
                  )}

                  {/* Asset Label (Code & Owner & License plate) */}
                  <Text
                    text={
                      asset.licensePlate ||
                      asset.parkingSlot ||
                      asset.code ||
                      asset.name
                    }
                    x={-40}
                    y={
                      asset.type === 'vehicle_truck'
                        ? 22
                        : asset.type === 'vehicle_car'
                        ? 16
                        : 16
                    }
                    width={80}
                    align="center"
                    fontSize={9.5}
                    fontFamily="Inter, Noto Sans Thai, sans-serif"
                    fontStyle="bold"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    fillAfterStrokeEnabled={true}
                    listening={false}
                  />
                  {(asset.assignedTo || asset.driverName) && (
                    <Text
                      text={asset.driverName ? `🚗 ${asset.driverName}` : asset.assignedTo}
                      x={-45}
                      y={asset.type === 'vehicle_truck' ? 34 : 28}
                      width={90}
                      align="center"
                      fontSize={8.5}
                      fontFamily="Inter, Noto Sans Thai, sans-serif"
                      fill="#475569"
                      ellipsis={true}
                      wrap="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fillAfterStrokeEnabled={true}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* Selected Asset Slide-over Detail Drawer */}
        {selectedAsset && (
          <div
            className={`absolute top-4 z-30 w-84 max-w-sm rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto ${
              currentBuilding && currentBuilding.id !== 'campus'
                ? 'right-20 sm:right-24'
                : 'right-4 sm:right-6'
            }`}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">
                    {selectedAsset.type === 'cctv'
                      ? '📹'
                      : selectedAsset.type === 'printer'
                      ? '🖨️'
                      : selectedAsset.type === 'vehicle_car'
                      ? '🚗'
                      : selectedAsset.type === 'vehicle_truck'
                      ? '🚚'
                      : selectedAsset.type === 'vehicle_motorcycle'
                      ? '🛵'
                      : selectedAsset.type === 'vehicle_forklift'
                      ? '🚜'
                      : selectedAsset.type === 'parking_bay'
                      ? '🅿️'
                      : selectedAsset.type === 'ev_charger'
                      ? '⚡'
                      : '💻'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedAsset.code}
                  </span>
                  {selectedAsset.licensePlate && (
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono font-bold text-[10px]">
                      {selectedAsset.licensePlate}
                    </span>
                  )}
                </div>
                <div className="font-medium text-slate-600 mt-0.5">
                  {selectedAsset.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Status & Department */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  selectedAsset.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : selectedAsset.status === 'broken'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {selectedAsset.status === 'active'
                  ? '🟢 ปกติ (Active)'
                  : selectedAsset.status === 'broken'
                  ? '🔴 เสีย / ส่งซ่อม (Broken)'
                  : '🟡 ซ่อมบำรุง (Maintenance)'}
              </span>

              {selectedAsset.parkingSlot && (
                <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[11px] font-mono font-bold">
                  🅿️ ช่อง {selectedAsset.parkingSlot}
                </span>
              )}

              {selectedAsset.department && !selectedAsset.parkingSlot && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  🏢 {selectedAsset.department}
                </span>
              )}
            </div>

            {/* Vehicle Details Card */}
            {(selectedAsset.licensePlate || selectedAsset.driverName || selectedAsset.vehicleModel) && (
              <div className="rounded-xl bg-amber-50/80 p-2.5 border border-amber-200 space-y-1">
                <div className="text-[10px] text-amber-800 uppercase tracking-wider font-semibold">
                  🚗 ข้อมูลยานพาหนะ & พนักงานขับ
                </div>
                {selectedAsset.vehicleModel && (
                  <div className="font-semibold text-slate-800 text-xs">
                    รุ่น: {selectedAsset.vehicleModel}
                  </div>
                )}
                {selectedAsset.driverName && (
                  <div className="text-slate-700 text-xs">
                    พนักงานขับ: <strong>{selectedAsset.driverName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Assigned Owner */}
            {selectedAsset.assignedTo && !selectedAsset.driverName && (
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  ผู้ถือครอง / ผู้ใช้งาน
                </div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">
                  👤 {selectedAsset.assignedTo}
                </div>
              </div>
            )}

            {/* Hardware Specs */}
            {selectedAsset.specs && (
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  สเปกเครื่อง / รายละเอียด
                </div>
                <div className="mt-1 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px] text-slate-700 leading-relaxed font-mono">
                  {selectedAsset.specs}
                </div>
              </div>
            )}

            {/* CCTV Specific FOV Details */}
            {selectedAsset.type === 'cctv' && (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-blue-50 p-2 border border-blue-100">
                  <span className="text-blue-500">มุมมอง (FOV):</span>{' '}
                  <strong>{selectedAsset.fovAngle || 75}°</strong>
                </div>
                <div className="rounded-xl bg-blue-50 p-2 border border-blue-100">
                  <span className="text-blue-500">ระยะส่อง:</span>{' '}
                  <strong>{selectedAsset.rangeMeters || 10} เมตร</strong>
                </div>
              </div>
            )}

            {/* Warranty & IP Address */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              {selectedAsset.warrantyExpiry && (
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">วันหมดประกัน</div>
                  <div className="font-bold text-slate-800">
                    {selectedAsset.warrantyExpiry}
                  </div>
                </div>
              )}
              {selectedAsset.ipAddress && (
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">IP Address</div>
                  <div className="font-mono font-bold text-slate-800">
                    {selectedAsset.ipAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Notes or Issue */}
            {selectedAsset.notes && (
              <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>บันทึก:</strong> {selectedAsset.notes}
              </div>
            )}

            {/* Quick Action: Report Issue */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (onRequestMaintenance) {
                    onRequestMaintenance({
                      ...selectedAsset,
                      buildingId: currentBuilding?.id || floorPlan?.buildingId || 'b1',
                      buildingName: currentBuilding?.name || floorPlan?.buildingName || 'อาคาร',
                      floorNumber: currentFloorNumber || floorPlan?.floorNumber || 1,
                      floorPlanId: floorPlan?._id,
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                🔧 แจ้งซ่อมอุปกรณ์นี้ (Report Issue)
              </button>
            </div>
          </div>
        )}

        {/* Floating Elevator Floor Switcher */}
        <FloorElevatorControl
          currentBuilding={currentBuilding}
          currentFloorNumber={currentFloorNumber}
          onSelectFloor={onSelectFloor}
          onReturnToCampus={onReturnToCampus}
          floorPlansInBuilding={floorPlansInBuilding}
          onAddFloor={canEdit ? onAddFloor : undefined}
          onDeleteFloor={canEdit ? onDeleteFloor : undefined}
        />

        {/* Selected Room Popup */}
        {selectedRoom && (
          <div
            className={`absolute top-4 z-30 w-80 max-w-sm rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto ${
              currentBuilding && currentBuilding.id !== 'campus'
                ? 'right-20 sm:right-24'
                : 'right-4 sm:right-6'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-slate-300"
                  style={{ backgroundColor: selectedRoom.color || '#dbeafe' }}
                />
                <h3 className="font-bold text-slate-900">{selectedRoom.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {selectedRoom.department && (
              <div className="mt-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                🏢 {selectedRoom.department}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <div className="text-[11px] text-slate-400">ขนาดพื้นที่</div>
                <div className="font-semibold text-slate-800">
                  {calculateAreaMeters(selectedRoom.width, selectedRoom.height)} ตร.ม.
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <div className="text-[11px] text-slate-400">ความจุที่นั่ง</div>
                <div className="font-semibold text-slate-800">
                  {selectedRoom.capacity ? `👥 ${selectedRoom.capacity} คน` : '—'}
                </div>
              </div>
            </div>

            {selectedRoom.extension && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-100">
                <span>📞 เบอร์ต่อภายใน (Ext.):</span>
                <span className="font-bold text-primary-600">
                  {selectedRoom.extension}
                </span>
              </div>
            )}

            {selectedRoom.targetBuildingId && onSelectBuilding && (
              <button
                type="button"
                onClick={() => {
                  onSelectBuilding(selectedRoom.targetBuildingId);
                  setSelectedRoom(null);
                }}
                className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>🏢 คลิกเข้าดูผังภายในอาคารนี้</span>
                <span>➔</span>
              </button>
            )}
          </div>
        )}

        {/* Empty Floor Notice & Copy Layout Helper */}
        {floorPlan &&
          floorPlan.buildingId !== 'campus' &&
          rooms.length === 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-2.5 shadow-lg backdrop-blur-sm text-xs text-amber-900 animate-in fade-in">
              <span className="text-lg">📐</span>
              <div>
                <strong className="block text-amber-950 font-bold">
                  ชั้นนี้ยังไม่มีการแบ่งห้อง
                </strong>
                <span className="text-amber-800 text-[11px]">
                  คุณสามารถคัดลอกโครงร่างผนัง/ห้องจากชั้นอื่น หรือเข้าสู่โหมดแอดมินเพื่อวาดห้อง
                </span>
              </div>
              {canEdit && onOpenCopyLayoutModal && (
                <button
                  type="button"
                  onClick={onOpenCopyLayoutModal}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-700 transition flex items-center gap-1.5 whitespace-nowrap text-xs"
                >
                  <span>📋</span>
                  <span>คัดลอกจากชั้นอื่น</span>
                </button>
              )}
            </div>
          )}

        {/* Quick Helper Hint Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[11px] text-slate-500 shadow-sm border border-slate-200 pointer-events-none">
          <span>💡 <strong>คำแนะนำ:</strong> พิมพ์ค้นหารหัสทรัพย์สิน/ชื่อพนักงาน/ทะเบียนรถเพื่อชี้เป้า หรือคลิกที่อุปกรณ์เพื่อดูสเปก</span>
        </div>
      </div>
    </div>
  );
}
