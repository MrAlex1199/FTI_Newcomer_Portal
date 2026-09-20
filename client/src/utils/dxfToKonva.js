import DxfParser from 'dxf-parser';

// Standard AutoCAD Color Index (ACI) to Hex mapping
const ACI_COLORS = {
  1: '#ef4444', // Red
  2: '#eab308', // Yellow
  3: '#22c55e', // Green
  4: '#06b6d4', // Cyan
  5: '#3b82f6', // Blue
  6: '#d946ef', // Magenta
  7: '#1e293b', // White/Black (Slate 800)
  8: '#64748b', // Dark Gray
  9: '#94a3b8', // Light Gray
};

export const parseDxfText = (dxfContent) => {
  const parser = new DxfParser();
  try {
    return parser.parseSync(dxfContent);
  } catch (err) {
    console.error('DXF Parse Error:', err);
    throw new Error(`ไม่สามารถอ่านไฟล์ DXF ได้: ${err.message || 'โครงสร้างไฟล์ไม่ถูกต้อง'}`);
  }
};

/**
 * Extract available layers from parsed DXF
 */
export const extractDxfLayers = (dxfData) => {
  if (!dxfData || !dxfData.entities) return [];

  const layerMap = {};

  // Check header / table layers if available
  if (dxfData.tables && dxfData.tables.layer && dxfData.tables.layer.layers) {
    Object.values(dxfData.tables.layer.layers).forEach((l) => {
      layerMap[l.name] = {
        name: l.name,
        color: ACI_COLORS[l.color] || '#475569',
        count: 0,
        visible: l.visible !== false,
      };
    });
  }

  // Count entities per layer
  dxfData.entities.forEach((entity) => {
    const layerName = entity.layer || '0';
    if (!layerMap[layerName]) {
      layerMap[layerName] = {
        name: layerName,
        color: ACI_COLORS[entity.color] || '#475569',
        count: 0,
        visible: true,
      };
    }
    layerMap[layerName].count += 1;
  });

  return Object.values(layerMap).sort((a, b) => b.count - a.count);
};

/**
 * Converts parsed DXF entities into Konva-renderable objects
 * Fits them into canvas dimensions (targetWidth, targetHeight) with Y-axis inversion
 */
export const convertDxfToKonva = (
  dxfData,
  options = {}
) => {
  const {
    selectedLayers = null, // Set of layer names, or null for all
    targetWidth = 1900,
    targetHeight = 1200,
    padding = 60,
  } = options;

  if (!dxfData || !dxfData.entities || dxfData.entities.length === 0) {
    return { shapes: [], bounds: null, layerStats: [] };
  }

  const entities = dxfData.entities.filter((e) => {
    if (!selectedLayers) return true;
    return selectedLayers.includes(e.layer || '0');
  });

  // 1. Calculate Bounding Box across all entities
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const updateBounds = (x, y) => {
    if (typeof x === 'number' && !isNaN(x)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (typeof y === 'number' && !isNaN(y)) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };

  entities.forEach((e) => {
    if (e.type === 'LINE' && e.vertices) {
      e.vertices.forEach((v) => updateBounds(v.x, v.y));
    } else if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && e.vertices) {
      e.vertices.forEach((v) => updateBounds(v.x, v.y));
    } else if (e.type === 'CIRCLE' && e.center && e.radius) {
      updateBounds(e.center.x - e.radius, e.center.y - e.radius);
      updateBounds(e.center.x + e.radius, e.center.y + e.radius);
    } else if (e.type === 'ARC' && e.center && e.radius) {
      updateBounds(e.center.x - e.radius, e.center.y - e.radius);
      updateBounds(e.center.x + e.radius, e.center.y + e.radius);
    } else if ((e.type === 'TEXT' || e.type === 'MTEXT') && (e.startPoint || e.position)) {
      const pt = e.startPoint || e.position;
      updateBounds(pt.x, pt.y);
    }
  });

  if (minX === Infinity || maxX === -Infinity) {
    return { shapes: [], bounds: null };
  }

  const dxfW = maxX - minX || 1;
  const dxfH = maxY - minY || 1;

  // Scale factor to fit canvas comfortably
  const scale = Math.min((targetWidth - padding * 2) / dxfW, (targetHeight - padding * 2) / dxfH, 100);

  // Helper to transform DXF coordinate to Canvas coordinate (Y flipped for screen)
  const toScreenX = (x) => Math.round(padding + (x - minX) * scale);
  const toScreenY = (y) => Math.round(padding + (maxY - y) * scale);

  const shapes = [];

  entities.forEach((e, idx) => {
    const strokeColor = ACI_COLORS[e.color] || '#334155';
    const id = `dxf-${e.type.toLowerCase()}-${idx}`;

    if (e.type === 'LINE' && e.vertices && e.vertices.length >= 2) {
      const [v1, v2] = e.vertices;
      shapes.push({
        id,
        type: 'line',
        points: [toScreenX(v1.x), toScreenY(v1.y), toScreenX(v2.x), toScreenY(v2.y)],
        stroke: strokeColor,
        strokeWidth: 1.5,
        layer: e.layer,
      });
    } else if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && e.vertices && e.vertices.length >= 2) {
      const flatPoints = [];
      e.vertices.forEach((v) => {
        flatPoints.push(toScreenX(v.x), toScreenY(v.y));
      });
      const isClosed = Boolean(e.shape || (e.vertices[0].x === e.vertices[e.vertices.length - 1].x && e.vertices[0].y === e.vertices[e.vertices.length - 1].y));
      shapes.push({
        id,
        type: 'line',
        points: flatPoints,
        closed: isClosed,
        stroke: strokeColor,
        strokeWidth: isClosed ? 2 : 1.5,
        layer: e.layer,
      });
    } else if (e.type === 'CIRCLE' && e.center && e.radius) {
      shapes.push({
        id,
        type: 'circle',
        x: toScreenX(e.center.x),
        y: toScreenY(e.center.y),
        radius: Math.max(2, Math.round(e.radius * scale)),
        stroke: strokeColor,
        strokeWidth: 1.5,
        layer: e.layer,
      });
    } else if (e.type === 'ARC' && e.center && e.radius) {
      const angleDeg = (e.endAngle - e.startAngle) * (180 / Math.PI);
      const startDeg = -e.endAngle * (180 / Math.PI); // Inverted for screen coordinate
      shapes.push({
        id,
        type: 'arc',
        x: toScreenX(e.center.x),
        y: toScreenY(e.center.y),
        innerRadius: Math.max(1, Math.round(e.radius * scale)),
        outerRadius: Math.max(2, Math.round(e.radius * scale)),
        angle: Math.abs(angleDeg) || 90,
        rotation: startDeg,
        stroke: strokeColor,
        strokeWidth: 1.5,
        layer: e.layer,
      });
    } else if ((e.type === 'TEXT' || e.type === 'MTEXT') && (e.text || e.string)) {
      const pt = e.startPoint || e.position || { x: 0, y: 0 };
      const rawText = (e.text || e.string || '').replace(/\\P/g, '\n').replace(/\{.*?\}/g, '');
      if (rawText.trim()) {
        shapes.push({
          id,
          type: 'text',
          x: toScreenX(pt.x),
          y: toScreenY(pt.y),
          text: rawText.slice(0, 50),
          fontSize: Math.max(10, Math.min(24, Math.round((e.textHeight || 2.5) * scale))),
          fill: strokeColor,
          layer: e.layer,
        });
      }
    }
  });

  return {
    shapes,
    scale,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: dxfW,
      height: dxfH,
      canvasWidth: Math.round(dxfW * scale + padding * 2),
      canvasHeight: Math.round(dxfH * scale + padding * 2),
    },
  };
};
