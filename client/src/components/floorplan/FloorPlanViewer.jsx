import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  calculatePlanBounds,
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
  const [copiedPcName, setCopiedPcName] = useState(false);

  const handleCopyPcName = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText?.(text).catch(() => {});
    setCopiedPcName(true);
    setTimeout(() => setCopiedPcName(false), 2000);
  };

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Canvas Viewport & Zoom/Pan
  const [stageScale, setStageScale] = useState(1.0);
  const [stagePos, setStagePos] = useState({ x: 30, y: 30 });
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: typeof window !== 'undefined' ? (window.innerWidth > 1200 ? 1200 : window.innerWidth - 60) : 1200,
    height: 720,
  });

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

  // ResizeObserver for dynamic canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };
    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [isFullscreen]);

  // Auto-fit to screen function
  const fitToScreen = useCallback((overrideW, overrideH) => {
    const w = overrideW || containerSize.width;
    const h = overrideH || containerSize.height;
    if (!w || !h) return;

    const bounds = calculatePlanBounds({
      rooms,
      walls,
      doors,
      assets,
      backgroundImage: floorPlan?.backgroundImage,
    });

    const padding = 48;
    const availableW = Math.max(100, w - padding * 2);
    const availableH = Math.max(100, h - padding * 2);

    const scaleX = availableW / bounds.width;
    const scaleY = availableH / bounds.height;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 2.2);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newPosX = Math.round(w / 2 - centerX * newScale);
    const newPosY = Math.round(h / 2 - centerY * newScale);

    if (stageRef.current) {
      stageRef.current.scale({ x: newScale, y: newScale });
      stageRef.current.position({ x: newPosX, y: newPosY });
      stageRef.current.batchDraw();
    }

    setStageScale(Number(newScale.toFixed(2)));
    setStagePos({ x: newPosX, y: newPosY });
  }, [containerSize, rooms, walls, doors, assets, floorPlan?.backgroundImage]);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Auto-fit only on floor plan/floor change or fullscreen toggle (prevents infinite re-render loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        fitToScreen(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [floorPlan?._id, floorPlan?.floorNumber, isFullscreen, fitToScreen]);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsNativeFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsNativeFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Lock body scroll and handle Escape key when in windowed fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            setIsFullscreen(false);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    document.body.style.overflow = '';
  }, [isFullscreen]);

  // Throttled React state synchronization ref
  const syncTimerRef = useRef(null);

  const scheduleSyncState = useCallback((scale, pos) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      setStageScale(Number(scale.toFixed(3)));
      setStagePos(pos);
    }, 80);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  // High-Performance Native Wheel Zoom (Direct GPU Transform, Zero React Re-render)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      if (!oldScale || oldScale <= 0) return;

      // Normalize wheel delta across devices and deltaModes
      let delta = -e.deltaY;
      if (e.deltaMode === 1) delta *= 20; // LINE mode (Firefox Windows)
      if (e.deltaMode === 2) delta *= 500; // PAGE mode

      // Exponential scaling: smooth on Mac Trackpad Pinch, responsive on Mouse Wheel
      const isPinch = e.ctrlKey;
      const zoomFactor = isPinch ? 0.008 : 0.0018;
      const multiplier = Math.min(Math.max(Math.exp(delta * zoomFactor), 0.7), 1.4);

      const newScale = Math.min(Math.max(oldScale * multiplier, 0.15), 4.0);
      if (Math.abs(newScale - oldScale) < 0.0001) return;

      const rect = container.getBoundingClientRect();
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const stagePosNow = stage.position();
      const mousePointTo = {
        x: (pointer.x - stagePosNow.x) / oldScale,
        y: (pointer.y - stagePosNow.y) / oldScale,
      };

      const newPos = {
        x: Math.round(pointer.x - mousePointTo.x * newScale),
        y: Math.round(pointer.y - mousePointTo.y * newScale),
      };

      // 1. Direct hardware-accelerated canvas update (0.1ms, NO React Re-render!)
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();

      // 2. Throttled sync to React state for toolbar percentage indicator
      scheduleSyncState(newScale, newPos);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [scheduleSyncState]);

  // Viewport-centered Zoom for Toolbar +/- Buttons
  const handleZoom = (direction) => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX() || stageScale;
    const factor = direction === 'in' ? 1.25 : 1 / 1.25;
    const newScale = Math.min(Math.max(oldScale * factor, 0.15), 4.0);
    if (Math.abs(newScale - oldScale) < 0.0001) return;

    const centerX = (containerRef.current?.clientWidth || containerSize.width) / 2;
    const centerY = (containerRef.current?.clientHeight || containerSize.height) / 2;

    const stagePosNow = stage.position() || stagePos;
    const centerPointTo = {
      x: (centerX - stagePosNow.x) / oldScale,
      y: (centerY - stagePosNow.y) / oldScale,
    };

    const newPos = {
      x: Math.round(centerX - centerPointTo.x * newScale),
      y: Math.round(centerY - centerPointTo.y * newScale),
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();

    setStageScale(Number(newScale.toFixed(3)));
    setStagePos(newPos);
  };

  const handleResetView = () => {
    fitToScreen();
    setSelectedAsset(null);
    setSelectedRoom(null);
    setHighlightedAssetId(null);
  };

  const viewerNode = (
    <div
      className={`flex flex-col overflow-hidden bg-white transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-0 z-[65] w-screen h-screen m-0 p-0 rounded-none border-none'
          : 'relative rounded-2xl border border-slate-200 shadow-sm'
      }`}
    >
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
              placeholder={t('assetLocatorPlaceholder')}
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
                  {t('foundAssetsCount', { count: searchResults.length })}
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
              title={t('searchAllCampusBtnTitle')}
            >
              <span>🌐</span>
              <span className="hidden sm:inline">{t('searchAllCampusBtn')}</span>
            </button>
          )}

          {onOpenAssetInventory && (
            <button
              type="button"
              onClick={onOpenAssetInventory}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-300 transition whitespace-nowrap"
              title={t('assetInventoryBtnTitle')}
            >
              <span>📋</span>
              <span className="hidden sm:inline">{t('assetInventoryBtn')}</span>
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
              title={t('layerCctvTitle')}
            >
              {t('layerCctv')}
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
                title={t('layerCctvFovTitle')}
              >
                {t('layerCctvFov')}
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
              title={t('layerComputerTitle')}
            >
              {t('layerComputer')}
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
              title={t('layerPrinterTitle')}
            >
              {t('layerPrinter')}
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
              title={t('layerVehicleTitle')}
            >
              {t('layerVehicle')}
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
              title={t('layerMaintenanceOnlyTitle')}
            >
              {t('layerMaintenanceOnly')}
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => handleZoom('out')}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              title={t('zoomOutTitle')}
            >
              ➖
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="px-2 py-1 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
              title={t('resetViewTitle')}
            >
              {Math.round(stageScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom('in')}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              title={t('zoomInTitle')}
            >
              ➕
            </button>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => fitToScreen()}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
              title={t('fitToScreen')}
            >
              <span>🎯</span>
              <span>{t('fitToScreen')}</span>
            </button>
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title={t('exportBtnTitle')}
            >
              {t('exportBtn')}
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
                    <div className="font-bold">{t('exportPng')}</div>
                    <div className="text-[10px] text-slate-400">{t('exportPngDesc')}</div>
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
                    <div className="font-bold">{t('exportPdf')}</div>
                    <div className="text-[10px] text-slate-400">{t('exportPdfDesc')}</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              isFullscreen
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={isFullscreen ? t('fullscreenMinimize') : t('fullscreenMaximize')}
          >
            <span className="text-sm">{isFullscreen ? '🗗' : '⛶'}</span>
            <span>{isFullscreen ? t('fullscreenMinimize') : t('fullscreenMaximize')}</span>
          </button>

          {/* Optional Native Fullscreen F11 Button (Visible in Fullscreen) */}
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleNativeFullscreen}
              className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition shadow-xs ${
                isNativeFullscreen
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title={t('nativeFullscreen')}
            >
              <span>🖥️</span>
              <span className="hidden md:inline">F11</span>
            </button>
          )}

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
      <div
        ref={containerRef}
        className={`relative w-full bg-slate-50 overflow-hidden cursor-grab active:cursor-grabbing ${
          isFullscreen
            ? 'flex-1 h-full'
            : 'h-[calc(100vh-280px)] min-h-[640px] max-h-[860px]'
        }`}
      >
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
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
                  ? t('statusActive')
                  : selectedAsset.status === 'broken'
                  ? t('statusBroken')
                  : t('statusMaintenance')}
              </span>

              {selectedAsset.parkingSlot && (
                <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[11px] font-mono font-bold">
                  {t('parkingSlotBadge', { slot: selectedAsset.parkingSlot })}
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
                  {t('vehicleInfoTitle')}
                </div>
                {selectedAsset.vehicleModel && (
                  <div className="font-semibold text-slate-800 text-xs">
                    {t('vehicleModelLabel')} {selectedAsset.vehicleModel}
                  </div>
                )}
                {selectedAsset.driverName && (
                  <div className="text-slate-700 text-xs">
                    {t('driverNameLabel')} <strong>{selectedAsset.driverName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Assigned Owner */}
            {selectedAsset.assignedTo && !selectedAsset.driverName && (
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {t('assignedOwnerLabel')}
                </div>
                <div className="font-bold text-slate-800 text-xs mt-0.5">
                  👤 {selectedAsset.assignedTo}
                </div>
              </div>
            )}

            {/* Admin-Only IT Computer & System Specifications Card */}
            {canEdit && selectedAsset.type === 'computer' && (
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-slate-50 p-3.5 border border-indigo-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                    <span className="text-base">🖥️</span>
                    <span>{t('itSpecsAdminTitle')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white tracking-wider uppercase">
                    Admin
                  </span>
                </div>

                {/* PC Name / Hostname with Copy Button */}
                {selectedAsset.pcName && (
                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-indigo-100 shadow-2xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('pcNameLabel')}</div>
                      <div className="font-mono font-bold text-indigo-900 text-xs mt-0.5">{selectedAsset.pcName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPcName(selectedAsset.pcName)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 shrink-0"
                      title={t('copyPcNameBtn')}
                    >
                      <span>{copiedPcName ? '✅' : '📋'}</span>
                      <span>{copiedPcName ? t('pcNameCopied') : t('copyPcNameBtn')}</span>
                    </button>
                  </div>
                )}

                {/* Operating System Badge */}
                {selectedAsset.osVersion && (
                  <div className="rounded-xl bg-white p-2.5 border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <span className="text-lg">🪟</span>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('osVersionLabel')}</div>
                      <div className="font-semibold text-slate-800 text-xs mt-0.5">{selectedAsset.osVersion}</div>
                    </div>
                  </div>
                )}

                {/* Hardware Grid: CPU, RAM, Storage */}
                {(selectedAsset.cpu || selectedAsset.ram || selectedAsset.storage) && (
                  <div className="space-y-1.5 text-[11px]">
                    {selectedAsset.cpu && (
                      <div className="rounded-xl bg-white p-2 border border-slate-200 shadow-2xs flex items-center justify-between">
                        <span className="text-slate-500 font-medium">⚡ {t('cpuLabel')}</span>
                        <span className="font-mono font-bold text-slate-800 text-right">{selectedAsset.cpu}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedAsset.ram && (
                        <div className="rounded-xl bg-white p-2 border border-slate-200 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-medium">🧠 {t('ramLabel')}</div>
                          <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedAsset.ram}</div>
                        </div>
                      )}
                      {selectedAsset.storage && (
                        <div className="rounded-xl bg-white p-2 border border-slate-200 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-medium">💾 {t('storageLabel')}</div>
                          <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedAsset.storage}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Peripherals List */}
                {selectedAsset.peripherals && selectedAsset.peripherals.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>🔌</span>
                      <span>{t('peripheralsLabel')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.peripherals.map((item, idx) => (
                        <span
                          key={`periph-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium shadow-2xs"
                        >
                          <span>⌨️</span> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Installed Software List */}
                {selectedAsset.installedSoftware && selectedAsset.installedSoftware.length > 0 && (
                  <div>
                    <div className="text-[10px] text-indigo-900/80 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>📦</span>
                      <span>{t('installedSoftwareLabel')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.installedSoftware.map((sw, idx) => (
                        <span
                          key={`sw-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100/70 border border-indigo-200 text-indigo-800 text-[10px] font-medium"
                        >
                          <span>💿</span> {sw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Hardware Specs (Shown if no dedicated IT card or for non-admin) */}
            {selectedAsset.specs && (!canEdit || selectedAsset.type !== 'computer') && (
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {t('specsLabel')}
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
                  <span className="text-blue-500">{t('fovLabel')}</span>{' '}
                  <strong>{selectedAsset.fovAngle || 75}°</strong>
                </div>
                <div className="rounded-xl bg-blue-50 p-2 border border-blue-100">
                  <span className="text-blue-500">{t('rangeLabel')}</span>{' '}
                  <strong>{selectedAsset.rangeMeters || 10} {t('metersUnit')}</strong>
                </div>
              </div>
            )}

            {/* Warranty & IP Address */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              {selectedAsset.warrantyExpiry && (
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">{t('warrantyExpiryLabel')}</div>
                  <div className="font-bold text-slate-800">
                    {selectedAsset.warrantyExpiry}
                  </div>
                </div>
              )}
              {selectedAsset.ipAddress && (
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400">{t('ipAddressLabel')}</div>
                  <div className="font-mono font-bold text-slate-800">
                    {selectedAsset.ipAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Notes or Issue */}
            {selectedAsset.notes && (
              <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>{t('notesLabel')}</strong> {selectedAsset.notes}
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
                {t('reportThisAssetBtn')}
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
                <div className="text-[11px] text-slate-400">{t('roomAreaLabel')}</div>
                <div className="font-semibold text-slate-800">
                  {calculateAreaMeters(selectedRoom.width, selectedRoom.height)} {t('sqmUnit')}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                <div className="text-[11px] text-slate-400">{t('seatCapacityLabel')}</div>
                <div className="font-semibold text-slate-800">
                  {selectedRoom.capacity ? `👥 ${selectedRoom.capacity} ${t('peopleUnit')}` : '—'}
                </div>
              </div>
            </div>

            {selectedRoom.extension && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-100">
                <span>{t('phoneExtLabel')}</span>
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
                <span>{t('viewInsideBuildingBtn')}</span>
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
                  {t('emptyFloorTitle')}
                </strong>
                <span className="text-amber-800 text-[11px]">
                  {t('emptyFloorDesc')}
                </span>
              </div>
              {canEdit && onOpenCopyLayoutModal && (
                <button
                  type="button"
                  onClick={onOpenCopyLayoutModal}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-amber-700 transition flex items-center gap-1.5 whitespace-nowrap text-xs"
                >
                  <span>📋</span>
                  <span>{t('copyFromOtherFloorBtn')}</span>
                </button>
              )}
            </div>
          )}

        {/* Quick Helper Hint Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[11px] text-slate-500 shadow-sm border border-slate-200 pointer-events-none">
          <span>{t('locatorHintBadge')}</span>
        </div>
      </div>
    </div>
  );

  return isFullscreen && typeof document !== 'undefined'
    ? createPortal(viewerNode, document.body)
    : viewerNode;
}
