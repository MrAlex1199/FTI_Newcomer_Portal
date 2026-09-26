import { describe, it, expect } from 'vitest';
import { parseDxfText, extractDxfLayers, convertDxfToKonva } from '../dxfToKonva.js';
import { calculatePolygonArea, getPolygonCenter } from '../../components/floorplan/snapUtils.js';
import { exportToDxf } from '../exportFloorPlan.js';

const SAMPLE_DXF = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
3
0
LAYER
2
A-WALL
70
0
62
7
6
CONTINUOUS
0
LAYER
2
A-ROOM
70
0
62
4
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
A-WALL
10
0.0
20
0.0
30
0.0
11
100.0
21
0.0
31
0.0
0
LINE
8
A-WALL
10
100.0
20
0.0
30
0.0
11
100.0
21
50.0
31
0.0
0
TEXT
8
A-ROOM
10
50.0
20
25.0
40
5.0
1
Office 101
0
ENDSEC
0
EOF`;

describe('DXF Parser & Konva Conversion', () => {
  it('should parse DXF string into entities', () => {
    const parsed = parseDxfText(SAMPLE_DXF);
    expect(parsed).toBeDefined();
    expect(parsed.entities).toBeDefined();
    expect(parsed.entities.length).toBe(3);
  });

  it('should extract layers correctly', () => {
    const parsed = parseDxfText(SAMPLE_DXF);
    const layers = extractDxfLayers(parsed);
    expect(layers.length).toBeGreaterThanOrEqual(2);
    const layerNames = layers.map((l) => l.name);
    expect(layerNames).toContain('A-WALL');
    expect(layerNames).toContain('A-ROOM');
  });

  it('should convert DXF entities to Konva shapes and scale properly', () => {
    const parsed = parseDxfText(SAMPLE_DXF);
    const { shapes, bounds } = convertDxfToKonva(parsed, {
      targetWidth: 1000,
      targetHeight: 600,
      padding: 40,
    });

    expect(shapes.length).toBe(3);
    expect(bounds).toBeDefined();
    expect(bounds.width).toBe(100);
    expect(bounds.height).toBe(50);

    const lineShapes = shapes.filter((s) => s.type === 'line');
    expect(lineShapes.length).toBe(2);
    expect(lineShapes[0].points.length).toBe(4);

    const textShapes = shapes.filter((s) => s.type === 'text');
    expect(textShapes.length).toBe(1);
    expect(textShapes[0].text).toBe('Office 101');
  });

  it('should filter by selected layers', () => {
    const parsed = parseDxfText(SAMPLE_DXF);
    const { shapes } = convertDxfToKonva(parsed, {
      selectedLayers: ['A-WALL'],
    });
    expect(shapes.length).toBe(2);
    expect(shapes.every((s) => s.layer === 'A-WALL')).toBe(true);
  });
});

describe('Polygon Calculation Utilities', () => {
  it('should calculate square polygon area correctly (100m²)', () => {
    // 200px by 200px rectangle (where 20px = 1m => 10m x 10m = 100m²)
    const square = [0, 0, 200, 0, 200, 200, 0, 200];
    const area = calculatePolygonArea(square, 20, 1.0);
    expect(area).toBe(100);
  });

  it('should calculate triangle polygon area correctly (50m²)', () => {
    // Right triangle with base=200px (10m) and height=200px (10m) => 50m²
    const triangle = [0, 0, 200, 0, 0, 200];
    const area = calculatePolygonArea(triangle, 20, 1.0);
    expect(area).toBe(50);
  });

  it('should calculate polygon center and bounding box', () => {
    const rect = [100, 100, 300, 100, 300, 200, 100, 200];
    const center = getPolygonCenter(rect);
    expect(center.x).toBe(200);
    expect(center.y).toBe(150);
    expect(center.width).toBe(200);
    expect(center.height).toBe(100);
  });

  it('should calculate floor plan bounds correctly enclosing rooms, walls, and assets', async () => {
    const { calculatePlanBounds } = await import('../../components/floorplan/snapUtils.js');
    const bounds = calculatePlanBounds({
      rooms: [
        { x: 100, y: 100, width: 400, height: 300 },
        { type: 'polygon', points: [500, 100, 800, 100, 800, 400, 500, 400] },
      ],
      walls: [
        { points: [100, 100, 100, 500] },
      ],
      assets: [
        { x: 900, y: 250 },
      ],
    });

    expect(bounds.minX).toBe(100);
    expect(bounds.minY).toBe(100);
    expect(bounds.maxX).toBe(900);
    expect(bounds.maxY).toBe(500);
    expect(bounds.width).toBe(800);
    expect(bounds.height).toBe(400);
  });
});
