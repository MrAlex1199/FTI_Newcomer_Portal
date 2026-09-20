import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Group,
  Transformer,
  Circle,
  Arc,
  Wedge,
} from 'react-konva';
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_METERS_PER_GRID,
  snapPoint,
  calculateAreaMeters,
  calculateLengthMeters,
  calculatePolygonArea,
  getPolygonCenter,
  generateId,
  ROOM_PALETTE,
  getWallCoords,
} from './snapUtils.js';
import RoomEditModal from './RoomEditModal.jsx';
import AssetEditModal from './AssetEditModal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import VehicleShape from './VehicleShape.jsx';
import FloorPlanImageOverlay from './FloorPlanImageOverlay.jsx';
import DxfImportModal from './DxfImportModal.jsx';
import { exportToPng, exportToPdf, exportToDxf } from '../../utils/exportFloorPlan.js';
import floorPlanService from '../../services/floorPlanService.js';

export default function FloorPlanDesigner({
  floorPlan,
  allFloorPlans = [],
  departments = [],
  onSave,
  isSaving = false,
  onClose,
}) {
  const { t } = useLanguage();

  const [showCopyModal, setShowCopyModal] = useState(false);
  const otherFloorPlans = allFloorPlans.filter((p) => p._id !== floorPlan?._id);

  // Floor plan data state
  const [rooms, setRooms] = useState(floorPlan?.rooms || []);
  const [walls, setWalls] = useState(floorPlan?.walls || []);
  const [doors, setDoors] = useState(floorPlan?.doors || []);
  const [assets, setAssets] = useState(floorPlan?.assets || []);
  const [gridSize, setGridSize] = useState(floorPlan?.gridSize || DEFAULT_GRID_SIZE);
  const [scaleMetersPerGrid, setScaleMetersPerGrid] = useState(
    floorPlan?.scaleMetersPerGrid || DEFAULT_METERS_PER_GRID
  );

  // Background Image Overlay state
  const [backgroundImage, setBackgroundImage] = useState(
    floorPlan?.backgroundImage || {
      url: '',
      x: 50,
      y: 50,
      width: 0,
      height: 0,
      opacity: 0.45,
      locked: true,
      visible: true,
      rotation: 0,
    }
  );
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgFileInputRef = useRef(null);

  // DXF CAD Layer state
  const [dxfLayer, setDxfLayer] = useState(
    floorPlan?.dxfLayer || {
      entities: [],
      visible: true,
      opacity: 0.65,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      sourceFileName: '',
    }
  );
  const [showDxfModal, setShowDxfModal] = useState(false);

  // Export menu dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Freeform Polygon state
  const [polygonPoints, setPolygonPoints] = useState([]); // [x1, y1, x2, y2, ...]
  const [polygonCursorPos, setPolygonCursorPos] = useState(null); // { x, y }

  // Tools: 'select' | 'room' | 'polygon' | 'wall' | 'door' | 'cctv' | 'computer' | 'printer' | ...
  const [tool, setTool] = useState('room');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showCctvFov, setShowCctvFov] = useState(true);

  // Selection
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'room' | 'wall' | 'door' | 'asset' | 'background'
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);

  // Canvas Viewport / Zoom & Pan
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 40, y: 40 });
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  // History for Undo
  const [history, setHistory] = useState([]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-15),
      {
        rooms: [...rooms],
        walls: [...walls],
        doors: [...doors],
        assets: [...assets],
        backgroundImage: { ...backgroundImage },
        dxfLayer: { ...dxfLayer },
      },
    ]);
  }, [rooms, walls, doors, assets, backgroundImage, dxfLayer]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRooms(previous.rooms || []);
    setWalls(previous.walls || []);
    setDoors(previous.doors || []);
    setAssets(previous.assets || []);
    if (previous.backgroundImage) setBackgroundImage(previous.backgroundImage);
    if (previous.dxfLayer) setDxfLayer(previous.dxfLayer);
    setSelectedId(null);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleBgFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 10MB');
      return;
    }

    try {
      setIsUploadingBg(true);
      if (floorPlan?._id) {
        const result = await floorPlanService.uploadBackgroundImage(floorPlan._id, file);
        setBackgroundImage((prev) => ({
          ...prev,
          url: result.url,
          visible: true,
          locked: true,
        }));
      } else {
        const objectUrl = URL.createObjectURL(file);
        setBackgroundImage((prev) => ({
          ...prev,
          url: objectUrl,
          visible: true,
          locked: true,
        }));
      }
    } catch (err) {
      console.error('Failed to upload background image:', err);
      const objectUrl = URL.createObjectURL(file);
      setBackgroundImage((prev) => ({
        ...prev,
        url: objectUrl,
        visible: true,
        locked: true,
      }));
    } finally {
      setIsUploadingBg(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    }
  };

  const handleDxfImport = ({ fileName, shapes, importMode }) => {
    pushHistory();
    if (importMode === 'convert') {
      const newRooms = [];
      const newWalls = [];

      shapes.forEach((s) => {
        if (s.type === 'line' && s.closed && s.points.length >= 6) {
          const polyCenter = getPolygonCenter(s.points);
          newRooms.push({
            id: generateId('dxf-room'),
            shapeType: 'polygon',
            points: s.points,
            name: `ห้อง CAD ${rooms.length + newRooms.length + 1}`,
            color: '#e0f2fe',
            department: s.layer || '',
            extension: '',
            capacity: 4,
            description: `นำเข้าจาก CAD เลเยอร์ ${s.layer}`,
            x: polyCenter.x,
            y: polyCenter.y,
            width: polyCenter.width,
            height: polyCenter.height,
          });
        } else if (s.type === 'line' && s.points.length >= 4) {
          newWalls.push({
            id: generateId('dxf-wall'),
            points: s.points.slice(0, 4),
            strokeWidth: 6,
            stroke: s.stroke || '#334155',
          });
        }
      });

      if (newRooms.length > 0) setRooms((prev) => [...prev, ...newRooms]);
      if (newWalls.length > 0) setWalls((prev) => [...prev, ...newWalls]);

      setDxfLayer({
        entities: shapes,
        visible: true,
        opacity: 0.5,
        sourceFileName: fileName,
      });
    } else {
      setDxfLayer({
        entities: shapes,
        visible: true,
        opacity: 0.65,
        sourceFileName: fileName,
      });
    }
  };

  const handleCopyLayoutFromPlan = (source) => {
    if (!source) return;
    pushHistory();
    const clonedWalls = (source.walls || []).map((w) => ({
      ...w,
      id: generateId('wall'),
      points: [...w.points],
    }));
    const clonedDoors = (source.doors || []).map((d) => ({
      ...d,
      id: generateId('door'),
    }));
    const clonedRooms = (source.rooms || []).map((r) => ({
      ...r,
      id: generateId('room'),
      name: `${r.name} (สำเนา)`,
    }));

    setWalls(clonedWalls);
    setDoors(clonedDoors);
    if (rooms.length === 0) {
      setRooms(clonedRooms);
    }
    setGridSize(source.gridSize || gridSize);
    setScaleMetersPerGrid(source.scaleMetersPerGrid || scaleMetersPerGrid);
    setShowCopyModal(false);
  };

  // Keep transformer attached to selected room or asset
  useEffect(() => {
    if (tool !== 'select') {
      transformerRef.current?.nodes([]);
      return;
    }

    if ((selectedType === 'room' || selectedType === 'asset') && selectedId && stageRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current?.nodes([selectedNode]);
        transformerRef.current?.getLayer()?.batchDraw();
      } else {
        transformerRef.current?.nodes([]);
      }
    } else {
      transformerRef.current?.nodes([]);
    }
  }, [selectedId, selectedType, tool, rooms, assets]);

  // Keyboard shortcuts (Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (tool === 'polygon' && polygonPoints.length > 0) {
        if (e.key === 'Escape') {
          setPolygonPoints([]);
          setPolygonCursorPos(null);
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          setPolygonPoints((prev) => prev.slice(0, prev.length - 2));
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedType(null);
        setIsDrawing(false);
        setCurrentShape(null);
        setPolygonPoints([]);
        setPolygonCursorPos(null);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const getRelativePointer = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    const rawX = (pointer.x - stage.x()) / stage.scaleX();
    const rawY = (pointer.y - stage.y()) / stage.scaleY();

    if (snapEnabled) {
      return snapPoint(rawX, rawY, gridSize);
    }
    return { x: Math.round(rawX), y: Math.round(rawY) };
  };

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      setSelectedType(null);
    }

    if (tool === 'select') return;

    const pos = getRelativePointer();

    if (tool === 'polygon') {
      if (polygonPoints.length === 0) {
        setPolygonPoints([pos.x, pos.y]);
      } else if (polygonPoints.length >= 4) {
        const startX = polygonPoints[0];
        const startY = polygonPoints[1];
        const dist = Math.hypot(pos.x - startX, pos.y - startY);

        if (dist <= Math.max(gridSize, 25)) {
          pushHistory();
          const finalPoints = [...polygonPoints];
          const polyCenter = getPolygonCenter(finalPoints);
          const newPolygonRoom = {
            id: generateId('poly-room'),
            shapeType: 'polygon',
            points: finalPoints,
            x: polyCenter.x,
            y: polyCenter.y,
            width: polyCenter.width,
            height: polyCenter.height,
            name: `ห้องรูปหลายเหลี่ยม ${rooms.length + 1}`,
            color: ROOM_PALETTE[rooms.length % ROOM_PALETTE.length].hex,
            department: '',
            extension: '',
            capacity: 4,
            description: '',
          };
          setRooms((prev) => [...prev, newPolygonRoom]);
          setPolygonPoints([]);
          setPolygonCursorPos(null);
          setSelectedId(newPolygonRoom.id);
          setSelectedType('room');
          setTool('select');
          setIsDrawing(false);
          return;
        }

        setPolygonPoints((prev) => [...prev, pos.x, pos.y]);
      } else {
        setPolygonPoints((prev) => [...prev, pos.x, pos.y]);
      }
      return;
    }

    setIsDrawing(true);
    setDrawStart(pos);

    if (tool === 'room') {
      setCurrentShape({
        id: generateId('room'),
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        name: `ห้อง ${rooms.length + 1}`,
        color: ROOM_PALETTE[rooms.length % ROOM_PALETTE.length].hex,
        department: '',
        extension: '',
        capacity: 4,
        description: '',
      });
    } else if (tool === 'wall') {
      setCurrentShape({
        id: generateId('wall'),
        start: { x: pos.x, y: pos.y },
        end: { x: pos.x, y: pos.y },
        thickness: 8,
      });
    } else if (tool === 'door') {
      pushHistory();
      const newDoor = {
        id: generateId('door'),
        x: pos.x,
        y: pos.y,
        rotation: 0,
        width: 40,
        type: 'door',
      };
      setDoors((prev) => [...prev, newDoor]);
      setSelectedId(newDoor.id);
      setSelectedType('door');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'cctv') {
      // Place CCTV instantly
      pushHistory();
      const newCctv = {
        id: generateId('cctv'),
        code: `CCTV-0${assets.filter((a) => a.type === 'cctv').length + 1}`,
        name: `กล้องวงจรปิด ${assets.filter((a) => a.type === 'cctv').length + 1}`,
        type: 'cctv',
        x: pos.x,
        y: pos.y,
        rotation: 45,
        fovAngle: 75,
        rangeMeters: 10,
        status: 'active',
        specs: 'Hikvision 4K UltraHD Dome Camera',
        warrantyExpiry: '',
        assignedTo: 'ฝ่ายรักษาความปลอดภัย & IT',
        department: 'เทคโนโลยีสารสนเทศ (IT)',
        ipAddress: `192.168.10.${30 + assets.length}`,
        notes: '',
      };
      setAssets((prev) => [...prev, newCctv]);
      setSelectedId(newCctv.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'computer') {
      // Place Workstation PC instantly
      pushHistory();
      const newPC = {
        id: generateId('pc'),
        code: `FTI-PC-${100 + assets.filter((a) => a.type === 'computer').length + 1}`,
        name: `Workstation #${assets.filter((a) => a.type === 'computer').length + 1}`,
        type: 'computer',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        specs: 'Intel Core i7, 16GB RAM, 512GB SSD',
        warrantyExpiry: '',
        assignedTo: '',
        department: '',
        ipAddress: '',
        notes: '',
      };
      setAssets((prev) => [...prev, newPC]);
      setSelectedId(newPC.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'printer') {
      // Place Printer instantly
      pushHistory();
      const newPrn = {
        id: generateId('prn'),
        code: `PRN-0${assets.filter((a) => a.type === 'printer').length + 1}`,
        name: `Printer #${assets.filter((a) => a.type === 'printer').length + 1}`,
        type: 'printer',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        specs: 'HP LaserJet Network Printer',
        warrantyExpiry: '',
        assignedTo: 'ส่วนกลาง',
        department: 'ส่วนกลาง',
        ipAddress: '',
        notes: '',
      };
      setAssets((prev) => [...prev, newPrn]);
      setSelectedId(newPrn.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'vehicle_car') {
      // Place Car
      pushHistory();
      const count = assets.filter((a) => a.type === 'vehicle_car').length + 1;
      const newCar = {
        id: generateId('car'),
        code: `CAR-0${count}`,
        name: `รถยนต์ส่วนกลาง #${count}`,
        type: 'vehicle_car',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        licensePlate: `1กข-${1000 + count} กทม`,
        driverName: '',
        parkingSlot: `P-${count < 10 ? '0' + count : count}`,
        vehicleModel: 'Toyota Camry / Altis',
        assignedTo: 'กองยานพาหนะส่วนกลาง',
        department: 'ธุรการ & ยานพาหนะ',
        notes: '',
      };
      setAssets((prev) => [...prev, newCar]);
      setSelectedId(newCar.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'vehicle_truck') {
      // Place Logistics Truck
      pushHistory();
      const count = assets.filter((a) => a.type === 'vehicle_truck').length + 1;
      const newTruck = {
        id: generateId('trk'),
        code: `TRK-0${count}`,
        name: `รถบรรทุกขนส่ง #${count}`,
        type: 'vehicle_truck',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        licensePlate: `70-${2000 + count} กทม`,
        driverName: '',
        parkingSlot: `DOCK-${count}`,
        vehicleModel: 'Isuzu Giga 10-Wheel',
        assignedTo: 'ฝ่ายคลังสินค้าและโลจิสติกส์',
        department: 'คลังสินค้าและโลจิสติกส์',
        notes: '',
      };
      setAssets((prev) => [...prev, newTruck]);
      setSelectedId(newTruck.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'vehicle_motorcycle') {
      // Place Motorcycle
      pushHistory();
      const count = assets.filter((a) => a.type === 'vehicle_motorcycle').length + 1;
      const newMoto = {
        id: generateId('mtc'),
        code: `MTC-0${count}`,
        name: `มอเตอร์ไซค์ส่งเอกสาร #${count}`,
        type: 'vehicle_motorcycle',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        licensePlate: `1กค-${3000 + count}`,
        driverName: '',
        parkingSlot: `M-${count}`,
        vehicleModel: 'Honda Wave 125i',
        assignedTo: 'แมสเซนเจอร์',
        department: 'ธุรการส่วนกลาง',
        notes: '',
      };
      setAssets((prev) => [...prev, newMoto]);
      setSelectedId(newMoto.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'vehicle_forklift') {
      // Place Forklift
      pushHistory();
      const count = assets.filter((a) => a.type === 'vehicle_forklift').length + 1;
      const newFL = {
        id: generateId('flk'),
        code: `FLK-0${count}`,
        name: `รถโฟล์คลิฟท์ไฟฟ้า #${count}`,
        type: 'vehicle_forklift',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        parkingSlot: `FL-BAY-${count}`,
        vehicleModel: 'Toyota 8FBE20 Electric Forklift',
        assignedTo: 'คลังสินค้า',
        department: 'ฝ่ายคลังสินค้า',
        notes: '',
      };
      setAssets((prev) => [...prev, newFL]);
      setSelectedId(newFL.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'parking_bay') {
      // Place Parking Bay
      pushHistory();
      const count = assets.filter((a) => a.type === 'parking_bay').length + 1;
      const newBay = {
        id: generateId('bay'),
        code: `P-${count < 10 ? '0' + count : count}`,
        name: `ช่องจอดรถ P-${count}`,
        type: 'parking_bay',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        parkingSlot: `P-${count < 10 ? '0' + count : count}`,
        assignedTo: '',
        department: 'ส่วนกลาง',
        notes: '',
      };
      setAssets((prev) => [...prev, newBay]);
      setSelectedId(newBay.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'ev_charger') {
      // Place EV Charger
      pushHistory();
      const count = assets.filter((a) => a.type === 'ev_charger').length + 1;
      const newEV = {
        id: generateId('evc'),
        code: `EV-${count < 10 ? '0' + count : count}`,
        name: `จุดชาร์จรถยนต์ไฟฟ้า #${count}`,
        type: 'ev_charger',
        x: pos.x,
        y: pos.y,
        rotation: 0,
        status: 'active',
        parkingSlot: `EV-${count < 10 ? '0' + count : count}`,
        specs: '22kW AC Fast Charger',
        assignedTo: 'ส่วนกลาง (EV Hub)',
        department: 'วิศวกรรม & สาธารณูปโภค',
        notes: '',
      };
      setAssets((prev) => [...prev, newEV]);
      setSelectedId(newEV.id);
      setSelectedType('asset');
      setIsDrawing(false);
      setTool('select');
    }
  };

  const handleStageMouseMove = () => {
    if (tool === 'polygon' && polygonPoints.length > 0) {
      const pos = getRelativePointer();
      setPolygonCursorPos(pos);
      return;
    }

    if (!isDrawing || !drawStart) return;
    const pos = getRelativePointer();

    if (tool === 'room') {
      const width = pos.x - drawStart.x;
      const height = pos.y - drawStart.y;
      setCurrentShape((prev) => (prev ? { ...prev, width, height } : null));
    } else if (tool === 'wall') {
      setCurrentShape((prev) =>
        prev ? { ...prev, end: { x: pos.x, y: pos.y } } : null
      );
    }
  };

  const handleStageMouseUp = () => {
    if (tool === 'polygon') return;

    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    if (tool === 'room') {
      let { x, y, width, height } = currentShape;
      if (width < 0) {
        x += width;
        width = Math.abs(width);
      }
      if (height < 0) {
        y += height;
        height = Math.abs(height);
      }

      if (width >= gridSize && height >= gridSize) {
        pushHistory();
        const finalRoom = { ...currentShape, x, y, width, height };
        setRooms((prev) => [...prev, finalRoom]);
        setSelectedId(finalRoom.id);
        setSelectedType('room');
        setTool('select');
      }
    } else if (tool === 'wall') {
      const { start, end } = currentShape;
      const len = Math.hypot(end.x - start.x, end.y - start.y);
      if (len >= gridSize) {
        pushHistory();
        const finalWall = {
          id: currentShape.id,
          points: [start.x, start.y, end.x, end.y],
          strokeWidth: 8,
          stroke: '#1e293b',
        };
        setWalls((prev) => [...prev, finalWall]);
        setSelectedId(finalWall.id);
        setSelectedType('wall');
        setTool('select');
      }
    }

    setCurrentShape(null);
    setDrawStart(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    pushHistory();
    if (selectedType === 'room') {
      setRooms((prev) => prev.filter((r) => r.id !== selectedId));
    } else if (selectedType === 'wall') {
      setWalls((prev) => prev.filter((w) => w.id !== selectedId));
    } else if (selectedType === 'door') {
      setDoors((prev) => prev.filter((d) => d.id !== selectedId));
    } else if (selectedType === 'asset') {
      setAssets((prev) => prev.filter((a) => a.id !== selectedId));
    } else if (selectedType === 'background') {
      setBackgroundImage({ url: '', visible: true, locked: true, opacity: 0.5 });
    }
    setSelectedId(null);
    setSelectedType(null);
  };

  const handleSaveRoomDetails = (updatedRoom) => {
    pushHistory();
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    setEditingRoom(null);
  };

  const handleSaveAssetDetails = (updatedAsset) => {
    pushHistory();
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    setEditingAsset(null);
  };

  const handleSavePlan = () => {
    if (onSave) {
      onSave({
        ...floorPlan,
        rooms,
        walls,
        doors,
        assets,
        backgroundImage,
        dxfLayer,
        gridSize,
        scaleMetersPerGrid,
      });
    }
  };

  const handleZoom = (direction) => {
    setStageScale((prev) => {
      const next = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(next, 0.4), 2.5);
    });
  };

  const handleResetView = () => {
    setStageScale(1);
    setStagePos({ x: 40, y: 40 });
  };

  const renderGridLines = () => {
    if (!showGrid) return null;
    const lines = [];
    const width = 2400;
    const height = 1600;

    for (let x = 0; x <= width; x += gridSize) {
      const isMajor = x % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={isMajor ? '#cbd5e1' : '#f1f5f9'}
          strokeWidth={isMajor ? 1 : 0.6}
          listening={false}
        />
      );
    }

    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={isMajor ? '#cbd5e1' : '#f1f5f9'}
          strokeWidth={isMajor ? 1 : 0.6}
          listening={false}
        />
      );
    }

    return lines;
  };

  const selectedRoomObj = rooms.find((r) => r.id === selectedId);
  const selectedAssetObj = assets.find((a) => a.id === selectedId);

  return (
    <div className="flex h-full flex-col bg-slate-100 select-none overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
      {/* Top Header & Toolbox Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {/* Left: Tool Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool('select')}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'select'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="เลือก / ย้าย / หมุนวัตถุ"
          >
            👆 {t('toolSelect') || 'เลือก / ย้าย'}
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Architectural Tools */}
          <button
            type="button"
            onClick={() => {
              setTool('room');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'room'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกลากสี่เหลี่ยมเพื่อสร้างบล็อกห้อง"
          >
            🏢 {t('toolRoom') || 'สร้างห้อง (Box)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTool('polygon');
              setSelectedId(null);
              setPolygonPoints([]);
              setPolygonCursorPos(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'polygon'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-400/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกวางจุดทีละจุดเพื่อสร้างห้องรูปหลายเหลี่ยม (ตัดมุม / ทรง L / ทรงเฉียง)"
          >
            ⬡ {t('toolPolygon') || 'ห้องหลายเหลี่ยม'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTool('wall');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'wall'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกลากเส้นกำแพงหนา 8px"
          >
            🧱 {t('toolWall') || 'กำแพง'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTool('door');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
              tool === 'door'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกวางประตู"
          >
            🚪 {t('toolDoor') || 'ประตู'}
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Asset & Equipment Placement Tools */}
          <button
            type="button"
            onClick={() => {
              setTool('cctv');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'cctv'
                ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกวางกล้องวงจรปิด CCTV พร้อมจำลองมุมมองแสง FOV"
          >
            📹 {t('toolCctv') || '+ กล้องวงจรปิด (CCTV)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTool('computer');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              tool === 'computer'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกวางคอมพิวเตอร์และโต๊ะทำงาน"
          >
            💻 {t('toolComputer') || '+ โต๊ะ / PC'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTool('printer');
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
              tool === 'printer'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="คลิกวางเครื่องพิมพ์"
          >
            🖨️ {t('toolPrinter') || 'เครื่องพิมพ์'}
          </button>

          {/* Vehicle & Parking Tools */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-0.5">
            <button
              type="button"
              onClick={() => {
                setTool('vehicle_car');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                tool === 'vehicle_car'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางรถยนต์ (Car / Sedan / SUV)"
            >
              🚗 +รถยนต์
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('vehicle_truck');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                tool === 'vehicle_truck'
                  ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางรถบรรทุกขนส่ง (Logistics Truck)"
            >
              🚚 +รถบรรทุก
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('vehicle_motorcycle');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium border transition ${
                tool === 'vehicle_motorcycle'
                  ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางมอเตอร์ไซค์ส่งเอกสาร"
            >
              🛵 +มอไซค์
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('vehicle_forklift');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium border transition ${
                tool === 'vehicle_forklift'
                  ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางโฟล์คลิฟท์คลังสินค้า"
            >
              🚜 +โฟล์คลิฟท์
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('parking_bay');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium border transition ${
                tool === 'parking_bay'
                  ? 'border-yellow-600 bg-yellow-50 text-yellow-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางซองจอดรถ / ตีเส้นช่องจอด (Parking Bay)"
            >
              🅿️ +ช่องจอด
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('ev_charger');
                setSelectedId(null);
              }}
              className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium border transition ${
                tool === 'ev_charger'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="คลิกวางแท่นชาร์จรถไฟฟ้า EV Charger"
            >
              ⚡ +EV Charger
            </button>
          </div>
        </div>

        {/* Right: Snapping, Zoom, Undo, Save */}
        <div className="flex items-center gap-2">
          {/* Snap toggle */}
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${
              snapEnabled
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
            title="ดูดเส้นตาราง (1 ช่อง = 1 เมตร)"
          >
            🧲 {t('snapToGrid') || 'ดูดเส้นกริด (1m)'}
          </button>

          {/* Grid lines toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium border transition ${
              showGrid
                ? 'border-slate-300 bg-slate-50 text-slate-700'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
            title="เปิด/ปิดเส้นตาราง"
          >
            📐
          </button>

          {/* CCTV FOV Cone preview toggle */}
          <button
            type="button"
            onClick={() => setShowCctvFov(!showCctvFov)}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium border transition ${
              showCctvFov
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-400'
            }`}
            title="เปิด/ปิด แสงจำลองมุมมองกล้องวงจรปิด"
          >
            🔦 FOV
          </button>

          {/* Undo */}
          <button
            type="button"
            disabled={history.length === 0}
            onClick={handleUndo}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="ย้อนกลับ (Ctrl+Z)"
          >
            ↩️
          </button>

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => handleZoom('out')}
              className="rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              ➖
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="px-1.5 py-1 text-[11px] font-mono text-slate-600 hover:bg-slate-100"
            >
              {Math.round(stageScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom('in')}
              className="rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              ➕
            </button>
          </div>

          {/* Delete selected */}
          {selectedId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              title="ลบวัตถุที่เลือก (Del)"
            >
              🗑️ {t('delete') || 'ลบ'}
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Background Image Upload & Controls */}
          <input
            ref={bgFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleBgFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => bgFileInputRef.current?.click()}
            disabled={isUploadingBg}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              backgroundImage?.url
                ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="อัปโหลดภาพผังอาคาร (PNG/JPG) เพื่อวางเป็นฉากหลังอ้างอิงในการวาด"
          >
            🖼️ {isUploadingBg ? 'กำลังโหลด...' : backgroundImage?.url ? 'เปลี่ยนภาพผัง' : 'ภาพผังพื้นหลัง'}
          </button>

          {backgroundImage?.url && (
            <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-200 rounded-xl px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setBackgroundImage((prev) => ({
                    ...prev,
                    visible: !prev.visible,
                  }))
                }
                className="text-xs p-0.5 hover:scale-110 transition"
                title={backgroundImage.visible ? 'ซ่อนภาพผังพื้นหลัง' : 'แสดงภาพผังพื้นหลัง'}
              >
                {backgroundImage.visible ? '👁️' : '🙈'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setBackgroundImage((prev) => ({
                    ...prev,
                    locked: !prev.locked,
                  }))
                }
                className="text-xs p-0.5 hover:scale-110 transition"
                title={backgroundImage.locked ? 'ภาพถูกล็อค (คลิกเพื่อปลดล็อคย้าย/ย่อขยาย)' : 'ปลดล็อคแล้ว (คลิกที่ภาพเพื่อลากย้าย/ย่อขยาย)'}
              >
                {backgroundImage.locked ? '🔒' : '🔓'}
              </button>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={backgroundImage.opacity ?? 0.45}
                onChange={(e) =>
                  setBackgroundImage((prev) => ({
                    ...prev,
                    opacity: parseFloat(e.target.value),
                  }))
                }
                className="w-12 h-1 accent-amber-600 cursor-pointer"
                title={`ความโปร่งใสภาพผัง: ${Math.round((backgroundImage.opacity ?? 0.45) * 100)}%`}
              />

              <button
                type="button"
                onClick={() => {
                  setBackgroundImage({ url: '', visible: true, locked: true, opacity: 0.45 });
                }}
                className="text-xs text-rose-500 hover:text-rose-700 p-0.5 font-bold"
                title="ลบภาพผังพื้นหลัง"
              >
                ✕
              </button>
            </div>
          )}

          {/* DXF CAD Import Button & Controls */}
          <button
            type="button"
            onClick={() => setShowDxfModal(true)}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              dxfLayer?.entities?.length > 0
                ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="นำเข้าไฟล์แบบแปลน CAD (.dxf) จาก AutoCAD หรือซอฟต์แวร์เขียนแบบ"
          >
            📐 {dxfLayer?.entities?.length > 0 ? `CAD (${dxfLayer.entities.length})` : 'นำเข้า CAD (.dxf)'}
          </button>

          {dxfLayer?.entities?.length > 0 && (
            <div className="flex items-center gap-1 bg-blue-50/90 border border-blue-200 rounded-xl px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() =>
                  setDxfLayer((prev) => ({
                    ...prev,
                    visible: !prev.visible,
                  }))
                }
                className="text-xs p-0.5 hover:scale-110 transition"
                title={dxfLayer.visible ? 'ซ่อนเลเยอร์ CAD' : 'แสดงเลเยอร์ CAD'}
              >
                {dxfLayer.visible ? '👁️' : '🙈'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDxfLayer({ entities: [], visible: true, opacity: 0.65 });
                }}
                className="text-xs text-rose-500 hover:text-rose-700 p-0.5 font-bold"
                title="ลบเลเยอร์ CAD"
              >
                ✕
              </button>
            </div>
          )}

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              title="ส่งออกผังอาคาร (PNG, PDF, DXF)"
            >
              📤 ส่งออก ▾
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
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
                    <div className="font-bold">ภาพ PNG คมชัดสูง (Retina)</div>
                    <div className="text-[10px] text-slate-400">สำหรับนำเสนอและเอกสาร</div>
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
                    <div className="font-bold">เอกสาร PDF (A4 แนวนอน)</div>
                    <div className="text-[10px] text-slate-400">พร้อมหัวเรื่องแบบสถาปัตย์และสเกล</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToDxf({
                      ...floorPlan,
                      rooms,
                      walls,
                      doors,
                      assets,
                    });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <span className="text-base">📐</span>
                  <div className="text-left">
                    <div className="font-bold">ไฟล์ AutoCAD (.DXF)</div>
                    <div className="text-[10px] text-slate-400">สำหรับ AutoCAD, Visio, SketchUp</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Copy Layout Button */}
          {otherFloorPlans.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-xs"
              title="คัดลอกกำแพง ประตู และบล็อกห้องจากชั้นอื่น"
            >
              📋 คัดลอกโครงร่าง
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isSaving ? '⏳ กำลังบันทึก...' : `💾 ${t('saveFloorPlan') || 'บันทึกแปลน'}`}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100"
              title="ปิด"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden cursor-crosshair">
        <Stage
          ref={stageRef}
          width={window.innerWidth > 1200 ? 1200 : window.innerWidth - 60}
          height={620}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={tool === 'select' && !selectedId}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
        >
          {/* Background Canvas & Image Overlay (Layer 0) */}
          <Layer>
            <Rect
              x={0}
              y={0}
              width={2400}
              height={1600}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={2}
            />
            {backgroundImage?.url && backgroundImage?.visible && (
              <FloorPlanImageOverlay
                config={backgroundImage}
                onChange={(newBg) => setBackgroundImage(newBg)}
                isSelected={selectedType === 'background'}
                onSelect={() => {
                  setSelectedId('bg-image');
                  setSelectedType('background');
                }}
              />
            )}
          </Layer>

          {/* CAD DXF Layer (Layer 1) */}
          {dxfLayer?.visible && dxfLayer?.entities?.length > 0 && (
            <Layer opacity={dxfLayer.opacity ?? 0.65} listening={false}>
              {dxfLayer.entities.map((shape) => {
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

          {/* Background Grid Layer (Layer 2) */}
          <Layer listening={false}>
            {renderGridLines()}
          </Layer>

          {/* Design Layer: Rooms, Walls, Doors, Assets (Layer 3) */}
          <Layer>
            {/* Rooms */}
            {rooms.map((room) => {
              const isSelected = selectedId === room.id;
              const isPolygon = room.shapeType === 'polygon' && Array.isArray(room.points) && room.points.length >= 6;
              const area = isPolygon
                ? calculatePolygonArea(room.points, gridSize, scaleMetersPerGrid)
                : calculateAreaMeters(room.width, room.height, gridSize, scaleMetersPerGrid);
              const polyCenter = isPolygon ? getPolygonCenter(room.points) : null;
              const widthM = isPolygon
                ? ((polyCenter?.width || 100) / gridSize) * scaleMetersPerGrid
                : (Math.abs(room.width) / gridSize) * scaleMetersPerGrid;
              const heightM = isPolygon
                ? ((polyCenter?.height || 100) / gridSize) * scaleMetersPerGrid
                : (Math.abs(room.height) / gridSize) * scaleMetersPerGrid;

              if (isPolygon) {
                return (
                  <Group
                    key={room.id}
                    id={room.id}
                    draggable={tool === 'select'}
                    onClick={() => {
                      setSelectedId(room.id);
                      setSelectedType('room');
                    }}
                    onDblClick={() => setEditingRoom(room)}
                    onDblTap={() => setEditingRoom(room)}
                    onDragEnd={(e) => {
                      pushHistory();
                      const dx = e.target.x();
                      const dy = e.target.y();
                      e.target.position({ x: 0, y: 0 });
                      const shiftedPoints = room.points.map((val, idx) =>
                        idx % 2 === 0 ? Math.round(val + dx) : Math.round(val + dy)
                      );
                      setRooms((prev) =>
                        prev.map((r) =>
                          r.id === room.id ? { ...r, points: shiftedPoints } : r
                        )
                      );
                    }}
                  >
                    <Line
                      points={room.points}
                      closed={true}
                      fill={room.color || '#dbeafe'}
                      stroke={isSelected ? '#2563eb' : '#64748b'}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={0.88}
                      shadowColor="rgba(0,0,0,0.06)"
                      shadowBlur={isSelected ? 10 : 4}
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
                  id={room.id}
                  x={room.x}
                  y={room.y}
                  draggable={tool === 'select'}
                  onClick={() => {
                    setSelectedId(room.id);
                    setSelectedType('room');
                  }}
                  onDblClick={() => setEditingRoom(room)}
                  onDblTap={() => setEditingRoom(room)}
                  onDragEnd={(e) => {
                    pushHistory();
                    let newX = e.target.x();
                    let newY = e.target.y();
                    if (snapEnabled) {
                      newX = snapPoint(newX, newY, gridSize).x;
                      newY = snapPoint(newX, newY, gridSize).y;
                      e.target.position({ x: newX, y: newY });
                    }
                    setRooms((prev) =>
                      prev.map((r) =>
                        r.id === room.id ? { ...r, x: newX, y: newY } : r
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    pushHistory();
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);

                    let newW = Math.round(room.width * scaleX);
                    let newH = Math.round(room.height * scaleY);
                    let newX = node.x();
                    let newY = node.y();

                    if (snapEnabled) {
                      newW = Math.round(newW / gridSize) * gridSize;
                      newH = Math.round(newH / gridSize) * gridSize;
                      const snapped = snapPoint(newX, newY, gridSize);
                      newX = snapped.x;
                      newY = snapped.y;
                    }

                    newW = Math.max(gridSize, newW);
                    newH = Math.max(gridSize, newH);
                    node.position({ x: newX, y: newY });

                    setRooms((prev) =>
                      prev.map((r) =>
                        r.id === room.id
                          ? { ...r, x: newX, y: newY, width: newW, height: newH }
                          : r
                      )
                    );
                  }}
                >
                  <Rect
                    width={room.width}
                    height={room.height}
                    fill={room.color || '#dbeafe'}
                    stroke={isSelected ? '#2563eb' : '#64748b'}
                    strokeWidth={isSelected ? 3 : 2}
                    cornerRadius={4}
                    opacity={0.88}
                    shadowColor="rgba(0,0,0,0.06)"
                    shadowBlur={isSelected ? 10 : 4}
                  />
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
                  {room.height >= 40 && (
                    <Text
                      text={`${room.department ? room.department + ' • ' : ''}${Math.round(widthM)}×${Math.round(heightM)}m (${area}m²)`}
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
                </Group>
              );
            })}

            {/* Walls */}
            {walls.map((wall) => {
              const isSelected = selectedId === wall.id;
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
                <Group key={wall.id}>
                  <Line
                    points={[x1, y1, x2, y2]}
                    stroke={isSelected ? '#3b82f6' : '#1e293b'}
                    strokeWidth={wall.strokeWidth || wall.thickness || 8}
                    lineCap="round"
                    lineJoin="round"
                    onClick={() => {
                      setSelectedId(wall.id);
                      setSelectedType('wall');
                    }}
                  />
                  <Text
                    text={`${len}m`}
                    x={midX - 16}
                    y={midY - 14}
                    fontSize={10}
                    fontStyle="bold"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillAfterStrokeEnabled={true}
                    listening={false}
                  />
                  {isSelected && (
                    <>
                      <Circle
                        x={x1}
                        y={y1}
                        radius={6}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth={2}
                        draggable
                        onDragMove={(e) => {
                          let nx = e.target.x();
                          let ny = e.target.y();
                          if (snapEnabled) {
                            const pt = snapPoint(nx, ny, gridSize);
                            nx = pt.x;
                            ny = pt.y;
                          }
                          setWalls((prev) =>
                            prev.map((w) =>
                              w.id === wall.id ? { ...w, points: [nx, ny, x2, y2] } : w
                            )
                          );
                        }}
                        onDragEnd={pushHistory}
                      />
                      <Circle
                        x={x2}
                        y={y2}
                        radius={6}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth={2}
                        draggable
                        onDragMove={(e) => {
                          let nx = e.target.x();
                          let ny = e.target.y();
                          if (snapEnabled) {
                            const pt = snapPoint(nx, ny, gridSize);
                            nx = pt.x;
                            ny = pt.y;
                          }
                          setWalls((prev) =>
                            prev.map((w) =>
                              w.id === wall.id ? { ...w, points: [x1, y1, nx, ny] } : w
                            )
                          );
                        }}
                        onDragEnd={pushHistory}
                      />
                    </>
                  )}
                </Group>
              );
            })}

            {/* Doors */}
            {doors.map((door) => {
              const isSelected = selectedId === door.id;
              return (
                <Group
                  key={door.id}
                  x={door.x}
                  y={door.y}
                  rotation={door.rotation || 0}
                  draggable={tool === 'select'}
                  onClick={() => {
                    setSelectedId(door.id);
                    setSelectedType('door');
                  }}
                  onDragEnd={(e) => {
                    pushHistory();
                    let nx = e.target.x();
                    let ny = e.target.y();
                    if (snapEnabled) {
                      const pt = snapPoint(nx, ny, gridSize);
                      nx = pt.x;
                      ny = pt.y;
                      e.target.position({ x: nx, y: ny });
                    }
                    setDoors((prev) =>
                      prev.map((d) => (d.id === door.id ? { ...d, x: nx, y: ny } : d))
                    );
                  }}
                >
                  <Line
                    points={[0, 0, 0, 32]}
                    stroke={isSelected ? '#2563eb' : '#854d0e'}
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
                    stroke={isSelected ? '#3b82f6' : '#a16207'}
                    strokeWidth={1.5}
                    dash={[3, 3]}
                  />
                </Group>
              );
            })}

            {/* Assets (CCTV with FOV Cone, Computers, Printers) */}
            {assets.map((asset) => {
              const isSelected = selectedId === asset.id;

              return (
                <Group
                  key={asset.id}
                  id={asset.id}
                  x={asset.x}
                  y={asset.y}
                  rotation={asset.rotation || 0}
                  draggable={tool === 'select'}
                  onClick={() => {
                    setSelectedId(asset.id);
                    setSelectedType('asset');
                  }}
                  onDblClick={() => setEditingAsset(asset)}
                  onDblTap={() => setEditingAsset(asset)}
                  onDragEnd={(e) => {
                    pushHistory();
                    let nx = e.target.x();
                    let ny = e.target.y();
                    if (snapEnabled) {
                      const pt = snapPoint(nx, ny, gridSize);
                      nx = pt.x;
                      ny = pt.y;
                      e.target.position({ x: nx, y: ny });
                    }
                    setAssets((prev) =>
                      prev.map((a) =>
                        a.id === asset.id ? { ...a, x: nx, y: ny } : a
                      )
                    );
                  }}
                  onTransformEnd={(e) => {
                    pushHistory();
                    const node = e.target;
                    const newRotation = Math.round(node.rotation());
                    node.scaleX(1);
                    node.scaleY(1);
                    setAssets((prev) =>
                      prev.map((a) =>
                        a.id === asset.id
                          ? { ...a, rotation: (newRotation % 360 + 360) % 360 }
                          : a
                      )
                    );
                  }}
                >
                  {/* CCTV Fan-shaped FOV cone */}
                  {asset.type === 'cctv' && showCctvFov && (
                    <Wedge
                      x={0}
                      y={0}
                      radius={(asset.rangeMeters || 10) * 20}
                      angle={asset.fovAngle || 75}
                      rotation={-(asset.fovAngle || 75) / 2}
                      fill="rgba(59, 130, 246, 0.22)"
                      stroke="rgba(59, 130, 246, 0.55)"
                      strokeWidth={1.5}
                      dash={[6, 4]}
                      listening={false}
                    />
                  )}

                  {/* CCTV Symbol */}
                  {asset.type === 'cctv' && (
                    <>
                      <Circle
                        radius={10}
                        fill={isSelected ? '#2563eb' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <Line
                        points={[0, 0, 16, 0]}
                        stroke="#3b82f6"
                        strokeWidth={3.5}
                        lineCap="round"
                      />
                      <Circle
                        radius={3.5}
                        fill={asset.status === 'active' ? '#10b981' : '#ef4444'}
                      />
                    </>
                  )}

                  {/* Computer Symbol */}
                  {asset.type === 'computer' && (
                    <Group x={-18} y={-14}>
                      <Rect
                        width={36}
                        height={28}
                        cornerRadius={4}
                        fill={isSelected ? '#eff6ff' : '#f8fafc'}
                        stroke={isSelected ? '#2563eb' : '#94a3b8'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <Rect x={7} y={5} width={22} height={5} fill="#1e293b" />
                      <Rect x={11} y={14} width={14} height={6} fill="#cbd5e1" />
                    </Group>
                  )}

                  {/* Printer Symbol */}
                  {asset.type === 'printer' && (
                    <Group x={-16} y={-14}>
                      <Rect
                        width={32}
                        height={28}
                        cornerRadius={4}
                        fill={isSelected ? '#f5f3ff' : '#f8fafc'}
                        stroke={isSelected ? '#7c3aed' : '#64748b'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <Rect x={6} y={4} width={20} height={5} fill="#cbd5e1" />
                      <Line points={[8, 16, 24, 16]} stroke="#94a3b8" strokeWidth={2} />
                    </Group>
                  )}

                  {/* Vehicle & Parking Symbol */}
                  {(asset.type?.startsWith('vehicle_') ||
                    asset.type === 'parking_bay' ||
                    asset.type === 'ev_charger') && (
                    <VehicleShape
                      asset={asset}
                      isSelected={isSelected}
                      noRotation={true}
                    />
                  )}

                  {/* CCTV Aiming Gizmo (Direct On-Canvas Rotation Handle) */}
                  {asset.type === 'cctv' && isSelected && tool === 'select' && (
                    <Group x={0} y={0}>
                      {/* Aiming stem line extending towards camera direction */}
                      <Line
                        points={[0, 0, 42, 0]}
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dash={[4, 3]}
                        listening={false}
                      />
                      {/* Aiming Handle Pin / Target Ring */}
                      <Group
                        x={42}
                        y={0}
                        draggable
                        onMouseEnter={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'grab';
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'default';
                        }}
                        onDragStart={(e) => {
                          e.cancelBubble = true;
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'grabbing';
                        }}
                        onDragMove={(e) => {
                          e.cancelBubble = true;
                          // Calculate angle between asset center and handle position
                          const handleX = e.target.x();
                          const handleY = e.target.y();
                          const rad = Math.atan2(handleY, handleX);
                          let deg = Math.round((rad * 180) / Math.PI);
                          
                          // Snap to 15 degrees if snap is enabled
                          if (snapEnabled) {
                            deg = Math.round(deg / 15) * 15;
                          }
                          const normalizedDeg = ((asset.rotation || 0) + deg) % 360;
                          const finalAngle = (normalizedDeg + 360) % 360;

                          // Reset handle back to fixed stem distance on line
                          e.target.position({ x: 42, y: 0 });

                          setAssets((prev) =>
                            prev.map((a) =>
                              a.id === asset.id ? { ...a, rotation: finalAngle } : a
                            )
                          );
                        }}
                        onDragEnd={(e) => {
                          e.cancelBubble = true;
                          e.target.position({ x: 42, y: 0 });
                          const container = e.target.getStage()?.container();
                          if (container) container.style.cursor = 'default';
                          pushHistory();
                        }}
                      >
                        <Circle
                          radius={10}
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth={2.5}
                          shadowColor="rgba(37,99,235,0.5)"
                          shadowBlur={8}
                        />
                        <Circle radius={4} fill="#ffffff" listening={false} />
                        {/* Aim crosshair indicators */}
                        <Line points={[-6, 0, 6, 0]} stroke="#ffffff" strokeWidth={1.5} listening={false} />
                        <Line points={[0, -6, 0, 6]} stroke="#ffffff" strokeWidth={1.5} listening={false} />
                      </Group>
                    </Group>
                  )}

                  {/* Asset Code / Plate / Slot label */}
                  <Text
                    text={
                      asset.licensePlate ||
                      asset.parkingSlot ||
                      asset.code ||
                      asset.name
                    }
                    x={-40}
                    y={asset.type === 'vehicle_truck' ? 22 : 16}
                    width={80}
                    align="center"
                    fontSize={9.5}
                    fontStyle="bold"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    fillAfterStrokeEnabled={true}
                    listening={false}
                  />
                </Group>
              );
            })}

            {/* Drawing Previews */}
            {isDrawing && currentShape && (
              <>
                {tool === 'room' && (
                  <Group>
                    <Rect
                      x={currentShape.x}
                      y={currentShape.y}
                      width={currentShape.width}
                      height={currentShape.height}
                      fill="rgba(59, 130, 246, 0.25)"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dash={[6, 4]}
                    />
                    <Text
                      text={`${calculateAreaMeters(currentShape.width, currentShape.height, gridSize, scaleMetersPerGrid)} m²`}
                      x={currentShape.x + 8}
                      y={currentShape.y + 8}
                      fontSize={12}
                      fontStyle="bold"
                      fill="#1d4ed8"
                    />
                  </Group>
                )}

                {tool === 'wall' && (
                  <Group>
                    <Line
                      points={[
                        currentShape.start.x,
                        currentShape.start.y,
                        currentShape.end.x,
                        currentShape.end.y,
                      ]}
                      stroke="#2563eb"
                      strokeWidth={8}
                      lineCap="round"
                      dash={[8, 4]}
                    />
                    <Text
                      text={`${calculateLengthMeters(
                        currentShape.start.x,
                        currentShape.start.y,
                        currentShape.end.x,
                        currentShape.end.y,
                        gridSize,
                        scaleMetersPerGrid
                      )}m`}
                      x={(currentShape.start.x + currentShape.end.x) / 2 - 12}
                      y={(currentShape.start.y + currentShape.end.y) / 2 - 16}
                      fontSize={11}
                      fontStyle="bold"
                      fill="#1d4ed8"
                    />
                  </Group>
                )}
              </>
            )}

            {/* Polygon Drawing Preview */}
            {tool === 'polygon' && polygonPoints.length > 0 && (
              <Group listening={false}>
                <Line
                  points={
                    polygonCursorPos
                      ? [...polygonPoints, polygonCursorPos.x, polygonCursorPos.y]
                      : polygonPoints
                  }
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dash={polygonCursorPos ? [6, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                />
                {Array.from({ length: polygonPoints.length / 2 }).map((_, i) => (
                  <Circle
                    key={`poly-vert-${i}`}
                    x={polygonPoints[i * 2]}
                    y={polygonPoints[i * 2 + 1]}
                    radius={i === 0 ? 7 : 4.5}
                    fill={i === 0 ? '#10b981' : '#6366f1'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
                {polygonPoints.length >= 4 && (
                  <Text
                    text="🎯 คลิกที่จุดแรกสีเขียวเพื่อปิดรูป (หรือกด Esc เพื่อยกเลิก)"
                    x={polygonPoints[0] + 12}
                    y={polygonPoints[1] - 22}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillAfterStrokeEnabled={true}
                  />
                )}
              </Group>
            )}

            {/* Konva Transformer (Supports rotation for Assets, resize for Rooms) */}
            <Transformer
              ref={transformerRef}
              rotateEnabled={selectedType === 'asset'}
              keepRatio={false}
              anchorCornerRadius={3}
              anchorSize={8}
              anchorStroke="#2563eb"
              anchorFill="#ffffff"
              borderStroke="#2563eb"
              borderDash={[4, 4]}
            />
          </Layer>
        </Stage>

        {/* Selected Asset Quick Info Floating Badge with Direct Rotation Shortcuts */}
        {selectedAssetObj && (
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3.5 py-2 shadow-xl border border-slate-200 text-xs animate-in fade-in">
            <div>
              <div className="font-bold text-slate-800">
                {selectedAssetObj.code} - {selectedAssetObj.name}
              </div>
              <div className="text-[11px] text-slate-500">
                หมุน: <span className="font-bold text-blue-600">{selectedAssetObj.rotation || 0}°</span> • {selectedAssetObj.status}
              </div>
            </div>

            {/* Quick Rotation Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                title="หมุนทวนเข็ม 45°"
                onClick={() => {
                  pushHistory();
                  const newRot = (((selectedAssetObj.rotation || 0) - 45) % 360 + 360) % 360;
                  setAssets((prev) =>
                    prev.map((a) => (a.id === selectedAssetObj.id ? { ...a, rotation: newRot } : a))
                  );
                }}
                className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs transition"
              >
                ↺ -45°
              </button>
              <button
                type="button"
                title="หมุนตามเข็ม 45°"
                onClick={() => {
                  pushHistory();
                  const newRot = ((selectedAssetObj.rotation || 0) + 45) % 360;
                  setAssets((prev) =>
                    prev.map((a) => (a.id === selectedAssetObj.id ? { ...a, rotation: newRot } : a))
                  );
                }}
                className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs transition"
              >
                ↻ +45°
              </button>
              <button
                type="button"
                title="กลับทิศ 180°"
                onClick={() => {
                  pushHistory();
                  const newRot = ((selectedAssetObj.rotation || 0) + 180) % 360;
                  setAssets((prev) =>
                    prev.map((a) => (a.id === selectedAssetObj.id ? { ...a, rotation: newRot } : a))
                  );
                }}
                className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs transition"
              >
                180°
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingAsset(selectedAssetObj)}
              className="rounded-lg bg-primary-50 text-primary-700 font-semibold px-2.5 py-1.5 hover:bg-primary-100 transition"
            >
              ✏️ ตั้งค่าละเอียด
            </button>
          </div>
        )}

        {/* Selected Room Quick Info Floating Badge */}
        {selectedRoomObj && (
          <div className="absolute top-3 right-3 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-lg border border-slate-200 text-xs">
            <div>
              <div className="font-bold text-slate-800">{selectedRoomObj.name}</div>
              <div className="text-[11px] text-slate-500">
                {selectedRoomObj.department || 'ไม่ระบุแผนก'} • {calculateAreaMeters(selectedRoomObj.width, selectedRoomObj.height)} ตร.ม.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingRoom(selectedRoomObj)}
              className="rounded-lg bg-primary-50 text-primary-700 font-semibold px-2.5 py-1.5 hover:bg-primary-100 transition"
            >
              ✏️ แก้ไขห้อง
            </button>
          </div>
        )}

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[11px] text-slate-600 shadow-md border border-slate-200 pointer-events-none flex items-center gap-2">
          <span>💡 <strong>คำแนะนำ:</strong></span>
          {tool === 'cctv' && <span>คลิกวางกล้อง CCTV หมุนองศาหรือปรับระยะ FOV ได้อิสระ</span>}
          {tool === 'computer' && <span>คลิกวางโต๊ะคอมพิวเตอร์ ดับเบิลคลิกเพื่อระบุผู้ถือครอง</span>}
          {tool === 'room' && <span>คลิกลากเพื่อสร้างกล่องห้อง (Room Block)</span>}
          {tool === 'wall' && <span>คลิกลากเพื่อสร้างกำแพงตรง (Wall 8px)</span>}
          {tool === 'select' && <span>คลิกเพื่อหมุนหรือย้าย ดับเบิลคลิกเพื่อแก้ไขข้อมูล</span>}
        </div>
      </div>

      {/* Modal: Room Edit */}
      {editingRoom && (
        <RoomEditModal
          open={Boolean(editingRoom)}
          room={editingRoom}
          departments={departments}
          onClose={() => setEditingRoom(null)}
          onSave={handleSaveRoomDetails}
          onDelete={(id) => {
            pushHistory();
            setRooms((prev) => prev.filter((r) => r.id !== id));
            setSelectedId(null);
            setEditingRoom(null);
          }}
        />
      )}

      {/* Modal: Asset Edit */}
      {editingAsset && (
        <AssetEditModal
          open={Boolean(editingAsset)}
          asset={editingAsset}
          departments={departments}
          onClose={() => setEditingAsset(null)}
          onSave={handleSaveAssetDetails}
          onDelete={(id) => {
            pushHistory();
            setAssets((prev) => prev.filter((a) => a.id !== id));
            setSelectedId(null);
            setEditingAsset(null);
          }}
        />
      )}

      {/* Modal: Copy Layout from Another Floor */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="text-base font-bold text-slate-900">
                  คัดลอกโครงร่างแปลนจากชั้นอื่น
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              ระบบจะคัดลอกแนวกำแพง (Walls) ตำแหน่งประตู (Doors) ขนาดตาราง และโครงบล็อกห้องจากชั้นต้นทางมายังชั้นนี้ เพื่อประหยัดเวลาในการวาดอาคารหลายชั้นที่มีโครงสร้างภายนอกคล้ายกัน (สามารถกดเลิกทำ Undo ได้)
            </p>

            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
              {otherFloorPlans.map((plan) => (
                <button
                  key={plan._id}
                  type="button"
                  onClick={() => handleCopyLayoutFromPlan(plan)}
                  className="flex w-full items-center justify-between p-3 text-left hover:bg-blue-50/70 transition group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      {plan.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {plan.buildingName || plan.buildingId} • ชั้น {plan.floorNumber} ({plan.walls?.length || 0} กำแพง, {plan.rooms?.length || 0} ห้อง)
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                    เลือกใช้แปลนนี้ ➔
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DXF CAD Import Modal */}
      <DxfImportModal
        isOpen={showDxfModal}
        onClose={() => setShowDxfModal(false)}
        onImport={handleDxfImport}
      />
    </div>
  );
}
