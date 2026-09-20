import { jsPDF } from 'jspdf';

/**
 * Downloads a Blob or DataURL to user's computer
 */
function downloadFile(content, fileName, mimeType = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Export Konva Stage to PNG Image
 */
export function exportToPng(stage, options = {}) {
  if (!stage) return;
  const {
    fileName = 'floor-plan.png',
    pixelRatio = 2, // High resolution (retina)
  } = options;

  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Floor Plan to PDF (A4 Landscape with Architectural Title Block)
 */
export async function exportToPdf(stage, plan = {}, options = {}) {
  if (!stage) return;

  const {
    fileName = `${plan.buildingName || 'FTI'}-${plan.floorName || 'Plan'}.pdf`.replace(/\s+/g, '_'),
  } = options;

  // Create High-Res image of canvas
  const dataUrl = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/png',
  });

  // A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  // Header Title Bar
  pdf.setFillColor(15, 23, 42); // Slate 900
  pdf.rect(margin, margin, pageWidth - margin * 2, 14, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text('FTI SMART CAMPUS - ARCHITECTURAL & ASSET FLOOR PLAN', margin + 4, margin + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // Slate 400
  const buildingLabel = `${plan.buildingName || 'Main Campus'} | ${plan.floorName || 'Floor 1'}`;
  pdf.text(buildingLabel, margin + 4, margin + 11);

  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  pdf.text(`Exported: ${dateStr}`, pageWidth - margin - 35, margin + 8);

  // Canvas Image Box
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2 - 20;

  pdf.addImage(
    dataUrl,
    'PNG',
    margin,
    margin + 16,
    contentWidth,
    contentHeight,
    undefined,
    'FAST'
  );

  // Footer bar with scale info
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, pageHeight - margin - 6, pageWidth - margin * 2, 6, 'F');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Scale: 1 Grid = ${plan.scaleMetersPerGrid || 1.0}m | Total Rooms: ${(plan.rooms || []).length} | Total Assets: ${(plan.assets || []).length}`,
    margin + 4,
    pageHeight - margin - 2
  );
  pdf.text('Confidential - FTI Internal Use Only', pageWidth - margin - 45, pageHeight - margin - 2);

  pdf.save(fileName);
}

/**
 * Export Floor Plan to AutoCAD DXF format (ASCII format)
 * Allows opening and continuing design in AutoCAD, SketchUp, Revit, etc.
 */
export function exportToDxf(plan = {}, options = {}) {
  const {
    fileName = `${plan.buildingName || 'floor-plan'}-${plan.floorName || '1'}.dxf`.replace(/\s+/g, '_'),
  } = options;

  const rooms = plan.rooms || [];
  const walls = plan.walls || [];
  const assets = plan.assets || [];

  let dxf = '';

  // HEADER SECTION
  dxf += '0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n';

  // TABLES SECTION (Layers)
  dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n3\n';
  // Layer: ROOMS
  dxf += '0\nLAYER\n2\nA-ROOMS\n70\n0\n62\n4\n6\nCONTINUOUS\n'; // Cyan
  // Layer: WALLS
  dxf += '0\nLAYER\n2\nA-WALLS\n70\n0\n62\n7\n6\nCONTINUOUS\n'; // White
  // Layer: ASSETS
  dxf += '0\nLAYER\n2\nE-ASSETS\n70\n0\n62\n1\n6\nCONTINUOUS\n'; // Red
  dxf += '0\nENDTAB\n0\nENDSEC\n';

  // ENTITIES SECTION
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // Write Rooms as closed Polylines + Text labels
  rooms.forEach((room) => {
    if (room.shapeType === 'polygon' && Array.isArray(room.points) && room.points.length >= 6) {
      dxf += '0\nPOLYLINE\n8\nA-ROOMS\n66\n1\n70\n1\n'; // 70=1 is closed
      for (let i = 0; i < room.points.length; i += 2) {
        dxf += `0\nVERTEX\n8\nA-ROOMS\n10\n${room.points[i]}\n20\n${-room.points[i + 1]}\n30\n0.0\n`;
      }
      dxf += '0\nSEQEND\n';
    } else {
      // Rectangular room
      const x1 = room.x;
      const y1 = -room.y;
      const x2 = room.x + room.width;
      const y2 = -(room.y + room.height);

      dxf += '0\nPOLYLINE\n8\nA-ROOMS\n66\n1\n70\n1\n';
      dxf += `0\nVERTEX\n8\nA-ROOMS\n10\n${x1}\n20\n${y1}\n30\n0.0\n`;
      dxf += `0\nVERTEX\n8\nA-ROOMS\n10\n${x2}\n20\n${y1}\n30\n0.0\n`;
      dxf += `0\nVERTEX\n8\nA-ROOMS\n10\n${x2}\n20\n${y2}\n30\n0.0\n`;
      dxf += `0\nVERTEX\n8\nA-ROOMS\n10\n${x1}\n20\n${y2}\n30\n0.0\n`;
      dxf += '0\nSEQEND\n';
    }

    // Room Label
    const textX = room.shapeType === 'polygon' ? (room.points?.[0] || room.x) : room.x + (room.width || 50) / 2;
    const textY = room.shapeType === 'polygon' ? -(room.points?.[1] || room.y) : -(room.y + (room.height || 50) / 2);
    dxf += `0\nTEXT\n8\nA-ROOMS\n10\n${textX}\n20\n${textY}\n40\n14.0\n1\n${room.name || 'Room'}\n`;
  });

  // Write Walls as lines
  walls.forEach((wall) => {
    if (wall.points && wall.points.length >= 4) {
      dxf += `0\nLINE\n8\nA-WALLS\n10\n${wall.points[0]}\n20\n${-wall.points[1]}\n11\n${wall.points[2]}\n21\n${-wall.points[3]}\n`;
    }
  });

  // Write Assets as circles and labels
  assets.forEach((asset) => {
    const ax = asset.x;
    const ay = -asset.y;
    dxf += `0\nCIRCLE\n8\nE-ASSETS\n10\n${ax}\n20\n${ay}\n40\n10.0\n`;
    dxf += `0\nTEXT\n8\nE-ASSETS\n10\n${ax + 12}\n20\n${ay}\n40\n10.0\n1\n${asset.code || asset.name}\n`;
  });

  dxf += '0\nENDSEC\n0\nEOF\n';

  downloadFile(dxf, fileName, 'application/dxf');
}
