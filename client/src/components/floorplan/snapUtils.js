/**
 * Floor plan grid snapping and dimension calculation utilities
 */

export const DEFAULT_GRID_SIZE = 20; // 20px per grid cell
export const DEFAULT_METERS_PER_GRID = 1.0; // 20px corresponds to 1.0 meter

export function snapToGrid(value, gridSize = DEFAULT_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(x, y, gridSize = DEFAULT_GRID_SIZE) {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

export function calculateLengthMeters(
  x1,
  y1,
  x2,
  y2,
  gridSize = DEFAULT_GRID_SIZE,
  metersPerGrid = DEFAULT_METERS_PER_GRID
) {
  const pixelDistance = Math.hypot(x2 - x1, y2 - y1);
  const meters = (pixelDistance / gridSize) * metersPerGrid;
  return Number(meters.toFixed(1));
}

export function calculateAreaMeters(
  width,
  height,
  gridSize = DEFAULT_GRID_SIZE,
  metersPerGrid = DEFAULT_METERS_PER_GRID
) {
  const widthM = (Math.abs(width) / gridSize) * metersPerGrid;
  const heightM = (Math.abs(height) / gridSize) * metersPerGrid;
  return Number((widthM * heightM).toFixed(1));
}

export function generateId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export const ROOM_PALETTE = [
  { name: 'Sky Blue', hex: '#dbeafe', border: '#3b82f6' },
  { name: 'Mint Emerald', hex: '#d1fae5', border: '#10b981' },
  { name: 'Soft Amber', hex: '#fef3c7', border: '#f59e0b' },
  { name: 'Lavender Indigo', hex: '#e0e7ff', border: '#6366f1' },
  { name: 'Rose Pink', hex: '#ffe4e6', border: '#f43f5e' },
  { name: 'Warm Orange', hex: '#ffedd5', border: '#f97316' },
  { name: 'Cool Slate', hex: '#f1f5f9', border: '#64748b' },
  { name: 'Teal Cyan', hex: '#ccfbf1', border: '#14b8a6' },
];

export function getWallCoords(wall) {
  if (Array.isArray(wall?.points) && wall.points.length >= 4) {
    return {
      x1: wall.points[0],
      y1: wall.points[1],
      x2: wall.points[2],
      y2: wall.points[3],
    };
  }
  return {
    x1: wall?.start?.x ?? 0,
    y1: wall?.start?.y ?? 0,
    x2: wall?.end?.x ?? 0,
    y2: wall?.end?.y ?? 0,
  };
}

/**
 * Calculates area of polygon (in square meters) from flat points [x1, y1, x2, y2, ...]
 * using the Shoelace formula
 */
export function calculatePolygonArea(
  flatPoints = [],
  gridSize = DEFAULT_GRID_SIZE,
  metersPerGrid = DEFAULT_METERS_PER_GRID
) {
  if (!flatPoints || flatPoints.length < 6) return 0;
  let area = 0;
  const numPoints = flatPoints.length / 2;
  for (let i = 0; i < numPoints; i++) {
    const x1 = flatPoints[i * 2];
    const y1 = flatPoints[i * 2 + 1];
    const nextIdx = (i + 1) % numPoints;
    const x2 = flatPoints[nextIdx * 2];
    const y2 = flatPoints[nextIdx * 2 + 1];
    area += x1 * y2 - x2 * y1;
  }
  const pixelArea = Math.abs(area) / 2;
  const squareMeters = pixelArea * Math.pow(metersPerGrid / gridSize, 2);
  return Number(squareMeters.toFixed(1));
}

/**
 * Calculates center coordinate and bounding dimensions of polygon for labels
 */
export function getPolygonCenter(flatPoints = []) {
  if (!flatPoints || flatPoints.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < flatPoints.length; i += 2) {
    const x = flatPoints[i];
    const y = flatPoints[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    x: Math.round((minX + maxX) / 2),
    y: Math.round((minY + maxY) / 2),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}


