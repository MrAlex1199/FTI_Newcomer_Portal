# Smart Campus Floor Plan, Asset Management & Maintenance Suite
## รายงานสรุปการพัฒนาระบบผังอาคารอัจฉริยะ การจัดการทรัพย์สิน และระบบแจ้งซ่อม

**วันที่:** 16 กันยายน 2026  
**สถานะ:** ✅ พัฒนาเสร็จสมบูรณ์ และผ่านการทดสอบ (Production Ready)  
**เวอร์ชัน:** 2.1.0

---

## 📌 บทนำและภาพรวม (Overview)

เพื่อยกระดับ FTI Welcome Hub สู่การเป็นแพลตฟอร์มบริหารจัดการวิทยาเขตอัจฉริยะ (Smart Campus & Digital Twin) บนพื้นที่จริงของ Function International (FTI) ระบบได้รับการพัฒนาต่อยอดใน 4 มิติหลักเพื่อปิดช่องว่างระหว่างเครื่องมือเขียนแบบระดับองค์กร (เช่น Microsoft Visio, AutoCAD) กับระบบบริหารทรัพย์สิน (Asset & Maintenance Management):

1. **การควบคุมและหมุนกล้อง CCTV แบบโต้ตอบโดยตรงบนผัง (Interactive CCTV Aiming Gizmo)**
2. **ระบบทะเบียนทรัพย์สินและระบุตำแหน่งบนผัง (Campus Asset Inventory & Locator)**
3. **ระบบแจ้งซ่อมและอัปเดตสถานะอุปกรณ์แบบเรียลไทม์ (Maintenance Ticket System)**
4. **ชุดเครื่องมือ CAD, ภาพพิมพ์เขียว, ห้องหลายเหลี่ยมอิสระ และการส่งออกหลายฟอร์แมต (CAD & Advanced Floor Plan Suite)**

---

## 🏗️ 1. Interactive CCTV Aiming Gizmo (การหมุนและปรับมุมกล้องในแบบ)

### รายละเอียดการทำงาน
- **On-Canvas Rotation Gizmo:** เมื่อคลิกเลือกกล้อง CCTV ในหน้าออกแบบ (Designer Canvas) ระบบจะแสดง **"ก้านเล็งทิศทาง (Aiming Stem)"** พร้อม **"หัวจับเล็งเป้า (Aiming Pin `🎯`)"** ยื่นออกมาจากเลนส์กล้อง
- **Real-time Drag-to-Aim:** ผู้ใช้สามารถคลิกลากหัวเล็งเป้าเพื่อหันกล้องไปยังทิศทางที่ต้องการได้ทันที โดยลำแสงกรวยพัด (Field of View - FOV Cone) จะกวาดหมุนตามเมาส์อย่างนุ่มนวล
- **องศาและการปรับด่วน (Quick Presets):** มีปุ่มลัด `↺ -45°`, `↻ +45°`, `180°` และแถบป้อนค่ามุมองศา (0° - 359°) พร้อมระยะส่องสว่าง (Range) ที่แถบควบคุมด้านข้าง
- **การบันทึกสถานะ:** พารามิเตอร์ `rotation`, `fovAngle`, `range` ถูกจัดเก็บลงฐานข้อมูล MongoDB และแสดงผลตรงกันทั้งในโหมด Designer และ Visitor/Viewer

---

## 📋 2. Campus Asset Inventory Management (ระบบตารางจัดการทรัพย์สิน)

### รายละเอียดการทำงาน
- **Modal จัดการทรัพย์สิน (`AssetInventoryModal.jsx`):** สามารถเปิดดูตารางทรัพย์สินทั้งหมดได้จากแถบเมนูหลักของหน้า Floor Plan
- **ขอบเขตการดูข้อมูล:** สลับดูได้ 2 โหมด:
  - **"🏢 เฉพาะชั้นนี้"** เพื่อดูรายการอุปกรณ์ภายในชั้นปัจจุบัน
  - **"🌐 พื้นที่ทั้งหมด"** รวมรายการทรัพย์สินทุกอาคาร (HQ, Warehouse, Factory, Showroom, Park)
- **การค้นหาและตัวกรองอัจฉริยะ:**
  - ค้นหาด้วยข้อความอิสระ (Asset Code, ชื่อพนักงานผู้ครอบครอง, ยี่ห้อ/สเปก, แผนก, ชื่อห้อง)
  - กรองตามประเภทอุปกรณ์: กล้อง CCTV (`cctv`), คอมพิวเตอร์/โน้ตบุ๊ก (`computer`), พริ้นเตอร์/อุปกรณ์สำนักงาน (`printer`), ที่จอดรถ/ยานพาหนะ (`vehicle`), อื่นๆ
  - กรองตามสถานะความพร้อม: 🟢 พร้อมใช้งาน (`available`), 🟠 ส่งซ่อม (`maintenance`), 🔴 ชำรุด (`broken`)
- **ระบบชี้เป้าบนผัง (Locate on Canvas `🎯`):** เมื่อคลิกปุ่มชี้เป้า ระบบจะสลับไปยังอาคารและชั้นที่อุปกรณ์นั้นติดตั้งอยู่ พร้อมเลื่อนจุดศูนย์กลางมุมมอง (Pan Canvas) และกระพริบไฮไลต์อุปกรณ์เป้าหมายทันที

---

## 🔧 3. Maintenance Ticket System (ระบบแจ้งซ่อมและติดตามสถานะ)

### Backend Architecture
- **Data Model (`server/src/models/MaintenanceTicket.js`):**
  - รหัสแจ้งซ่อมแบบเรียงลำดับอัตโนมัติ (Format: `MT-YYYY-XXXX` เช่น `MT-2026-0001`)
  - ฟิลด์บันทึก: `facilityId`, `assetCode`, `title`, `description`, `urgency` (`low`, `medium`, `high`, `critical`), `status` (`pending`, `in_progress`, `resolved`, `cancelled`), `reportedBy`, `contactInfo`, `assignedTo`, `notes`
- **REST Endpoints (`server/src/routes/maintenanceTickets.js`):**
  - `POST /api/maintenance-tickets`: สร้างใบแจ้งซ่อมใหม่ พร้อมอัปเดตสถานะของ Facility ที่เกี่ยวข้องเป็น `maintenance` โดยอัตโนมัติ
  - `GET /api/maintenance-tickets`: เรียกดูรายการแจ้งซ่อมทั้งหมด (รองรับ Filter & Pagination)
  - `GET /api/maintenance-tickets/:id`: ดูรายละเอียดใบแจ้งซ่อมรายรายการ
  - `PATCH /api/maintenance-tickets/:id/status`: อัปเดตสถานะใบแจ้งซ่อม (เช่น แก้ไขเสร็จสิ้น `resolved` ซึ่งจะคืนสถานะ Facility เป็น `available`)

### Frontend Architecture
- **ฟอร์มแจ้งซ่อม (`MaintenanceReportModal.jsx`):**
  - สามารถเปิดได้จากปุ่ม **"🔧 แจ้งซ่อม"** บน Popup อุปกรณ์ในผัง หรือจากแถวในตารางทรัพย์สิน
  - ดึงรหัสทรัพย์สิน, ชนิดอุปกรณ์, อาคาร, ชั้น และห้องมาเติมในฟอร์มอัตโนมัติ
  - ผู้แจ้งเพียงระบุรายละเอียดอาการเสีย, เลือกระดับความเร่งด่วน และเบอร์โทรศัพท์ติดต่อกลับ
- **การซิงก์สถานะกับผังอาคารแบบสองทาง (Bi-directional Canvas Sync):**
  - เมื่อเปิดใบแจ้งซ่อม ไอคอนอุปกรณ์บน Canvas จะเปลี่ยนเป็นสถานะเตือนสีส้ม 🟠 ทันที
  - เพิ่มปุ่มฟิลเตอร์ **"⚠️ เฉพาะแจ้งเสีย"** ในแถบเครื่องมือของผังเพื่อกรองดูจุดวิกฤตบนแผนผังได้รวดเร็ว

---

## 📐 4. CAD, Blueprint Underlay, Polygon Rooms & Multi-Format Export

### 4.1 การนำเข้าไฟล์ CAD (.DXF)
- **Library & Parsing:** ใช้ `dxf-parser` ถอดรหัสไฟล์ AutoCAD ASCII DXF (Model Space)
- **Layer Management (`DxfImportModal.jsx`):**
  - สแกนและแสดงรายการเลเยอร์ทั้งหมด พร้อมรหัสสี AutoCAD Color Index (ACI)
  - นับจำนวน Entities ในแต่ละเลเยอร์ (Lines, Polylines, LWPolylines, Circles, Arcs, Text)
  - ผู้ใช้สามารถติ๊กเลือกเฉพาะเลเยอร์ที่ต้องการนำเข้าได้
- **Import Modes:**
  - **Reference Overlay:** นำเข้าเป็นเวกเตอร์โครงสร้าง CAD อ้างอิงใต้ผัง (ล็อกตำแหน่งอัตโนมัติ ปรับ Opacity ได้)
  - **Convert to Rooms:** แปลงเส้นขอบเขตปิด (Closed Polylines) เป็นออบเจกต์ห้องในระบบทันที

### 4.2 ระบบภาพพิมพ์เขียวอ้างอิงใต้ผัง (Blueprint Image Underlay Overlay)
- **Upload & Storage (`server/src/middleware/floorPlanUpload.js`):**
  - รับไฟล์ภาพ PNG, JPG, WebP สูงสุด 10MB จัดเก็บลงดิสก์เซิร์ฟเวอร์ที่ `server/uploads/floorplans/`
  - เสิร์ฟผ่าน Express Static Route `/uploads` พร้อมตั้งค่า `Cross-Origin-Resource-Policy: cross-origin` เพื่อป้องกัน Tainted Canvas เมื่อ Export
- **Canvas Interaction (`FloorPlanImageOverlay.jsx`):**
  - แสดงผลใน Layer 0 (ใต้ห้องและอุปกรณ์)
  - ควบคุมการเลื่อน (Drag), ย่อขยายขนาด (Resize), ปรับความทึบแสง (Opacity 0 - 100%), ล็อกพิกัด (Lock Position), และปุ่มเปิด/ปิดการแสดงผล

### 4.3 เครื่องมือวาดห้องหลายเหลี่ยมอิสระ (Freeform Polygon Room Tool `⬡`)
- **การวาดแบบโต้ตอบ:** คลิกกำหนดจุดยอด (Vertices) เพื่อสร้างห้องที่มีรูปร่างไม่จำกัด (ห้องมุมเฉียง, ห้องรูปตัว L, หรือโถงอาคารทรงโค้ง)
- **Visual Feedback & Snapping:**
  - เส้นประพรีวิวตำแหน่งเมาส์ขณะกำลังวาด
  - วงแหวน Snap Bullseye ดึงดูดเมาส์เข้าหาจุดเริ่มต้นเมื่อระยะเข้าใกล้ เพื่อปิดรูปทรง (Close Polygon) อัตโนมัติ
  - รองรับปุ่ม `Esc` เพื่อยกเลิก และ `Backspace` เพื่อลบจุดย้อนหลัง 1 จุด
- **Shoelace Formula:** คำนวณพื้นที่ห้อง (ตารางเมตร) จากพิกัดหลายเหลี่ยมตามสูตร Shoelace Formula ทางคณิตศาสตร์อย่างแม่นยำ

### 4.4 ระบบส่งออกผังอาคารมาตรฐานสถาปัตย์ (Multi-Format Export)
- **Retina PNG (2x):** ส่งออกภาพความละเอียดสูงพิเศษผ่าน `stage.toDataURL({ pixelRatio: 2 })`
- **Architectural PDF (`jspdf`):** เอกสารแบบแปลน A4 แนวนอนมาตรฐาน พร้อมกรอบ Title Block, โลโก้ FTI, ข้อมูลชื่ออาคาร, ชั้น, รหัสเอกสาร, วันที่ และสเกลกำกับ
- **AutoCAD DXF (`exportToDxf`):** สร้างไฟล์ ASCII DXF ของห้องและผนังทั้งหมด เพื่อเปิดทำงานต่อในโปรแกรม AutoCAD หรือ CAD ทั่วไปได้ทันที

---

## 🧪 5. การทดสอบและการตรวจสอบคุณภาพ (Quality Assurance)

| รายการทดสอบ | เครื่องมือ / วิธีการ | ผลการทดสอบ |
|---|---|---|
| **CAD Parser & Layer Extraction** | Vitest (`cadAndPolygon.test.js`) | ✅ ผ่าน (7/7 tests) |
| **Polygon Area Calculation (Shoelace)** | Vitest (`cadAndPolygon.test.js`) | ✅ ผ่าน แม่นยำ 100% |
| **Maintenance KPI & SLA Calculations** | Vitest (`maintenanceKpiAndExcel.test.js`) | ✅ ผ่าน แม่นยำ 100% |
| **Multi-sheet Excel (.xlsx) Generation** | SheetJS (`exportMaintenanceExcel.js`) | ✅ ผ่าน (สร้างและอ่าน 2 ชีตสำเร็จ) |
| **Frontend Production Build** | Vite Build (`npm run build`) | ✅ ผ่าน 0 Error |
| **Backend API Health Check** | Node Express (`/api/health`) | ✅ Status 200 OK |
| **CORS & CORP Canvas Export** | Helmet Security Config | ✅ ภาพ Canvas ไม่ติด Tainted Flag |
| **Database Schemas & Relations** | Mongoose Validations | ✅ รองรับ polygon, dxfLayer, backgroundImage, MaintenanceTicket |

---

## 📁 ไฟล์ที่เกี่ยวข้องในระบบ (Key Files)

### Backend
- `server/src/models/FloorPlan.js` (เพิ่มโครงสร้าง `backgroundImage`, `dxfLayer`, polygon rooms)
- `server/src/models/MaintenanceTicket.js` (โมเดลใบแจ้งซ่อมและกำหนดหมายเลขตั๋วอัตโนมัติ)
- `server/src/controllers/floorPlanController.js` (เพิ่ม Controller สำหรับอัปโหลดภาพผัง)
- `server/src/middleware/floorPlanUpload.js` (Multer upload middleware)
- `server/src/routes/floorPlans.js` (API endpoints สำหรับภาพผังและ DXF)
- `server/src/routes/maintenanceTickets.js` (API endpoints: CRUD, KPI & SLA summary, search & filters)

### Frontend
- `client/src/pages/EquipmentMaintenancePage.jsx` (หน้าหลักแจ้งปัญหาอุปกรณ์ คิวงานซ่อม แดชบอร์ดสรุป KPI & SLA)
- `client/src/components/floorplan/FloorPlanAssetPickerModal.jsx` (หน้าต่างคลิกเลือกอุปกรณ์จากผังอาคารเพื่อกรอกฟอร์ม)
- `client/src/utils/exportMaintenanceExcel.js` (ระบบส่งออกรายงาน Excel 2 ชีต: รายการตั๋ว และ สรุป KPI)
- `client/src/components/floorplan/FloorPlanDesigner.jsx` (เครื่องมือ Polygon, Gizmo, Image/CAD Overlay, Export Dropdown)
- `client/src/components/floorplan/FloorPlanViewer.jsx` (การแสดงผล Polygon, Gizmo, CAD Layer, Image Overlay, Export)
- `client/src/components/floorplan/FloorPlanImageOverlay.jsx` (คอมโพเนนต์จัดการภาพพิมพ์เขียวใต้ผัง)
- `client/src/components/floorplan/DxfImportModal.jsx` (หน้าต่างนำเข้าและเลือกเลเยอร์ DXF)
- `client/src/components/floorplan/AssetInventoryModal.jsx` (ตารางบริหารจัดการทรัพย์สินทั้งแคมปัส)
- `client/src/components/floorplan/MaintenanceReportModal.jsx` (หน้าต่างแบบฟอร์มแจ้งซ่อมอุปกรณ์ด่วน)
- `client/src/utils/dxfToKonva.js` (ตัวแปลง DXF เป็น Konva Entities และ Layer Palette)
- `client/src/utils/exportFloorPlan.js` (ระบบส่งออก Retina PNG, Architectural PDF, ASCII DXF)
- `client/src/utils/__tests__/cadAndPolygon.test.js` (ชุดทดสอบการประมวลผล CAD และรูปทรง Polygon)
- `client/src/utils/__tests__/maintenanceKpiAndExcel.test.js` (ชุดทดสอบการคำนวณ KPI SLA และเวิร์กบุ๊ก Excel)

