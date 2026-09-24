# รายงานสรุปการปรับปรุง UX/UI ตารางบริหารจัดการทรัพย์สิน (Asset Inventory Management Modal)
## Floor Plan & Smart Campus Asset Suite

**วันที่จัดทำ:** 22 กันยายน 2026  
**สถานะ:** ✅ พัฒนาเสร็จสมบูรณ์ และผ่านการทดสอบทั้งบน PC และ Mobile (Production Ready)  
**ไฟล์เป้าหมายหลัก:**
- `client/src/components/floorplan/AssetInventoryModal.jsx`
- `client/src/i18n/messages.js`
- ฐานข้อมูล `FloorPlan` (MongoDB)

---

## 📌 1. บทนำและที่มาของปัญหา (Background & Problem Statement)

จากการประเมินประสบการณ์ผู้ใช้งาน (UX/UI Review) ของหน้าต่างป๊อปอัป **"ตารางบริหารจัดการทรัพย์สิน" (Asset Inventory Modal)** ในระบบผังอาคารอัจฉริยะ (`/floor-plan`) พบข้อจำกัดที่ต้องได้รับการแก้ไขอย่างเร่งด่วน:

1. **ปัญหาบนหน้าจอคอมพิวเตอร์ (PC / Desktop):**
   - ตารางข้อมูล (Data Table) ขาดการตรึงหัวตาราง (Sticky Header) ทำให้เมื่อเลื่อนดูข้อมูลจำนวนมาก ผู้ใช้งานจะไม่เห็นหัวคอลัมน์
   - ไม่มีระบบจัดเรียงข้อมูลตามคอลัมน์ (Column Sorting)
   - ระยะคอลัมน์และการจัดการขนาดหน้าจอทำให้ปุ่ม Action การจัดการ (`ชี้เป้าบนผัง` / `แจ้งซ่อม`) ถูกบีบอัดหรือตกขอบขวา
2. **ปัญหาบนหน้าจอมือถือ (Mobile / Small Viewport):**
   - การแสดงตาราง 7 คอลัมน์บนมือถือทำให้เกิดการบีบอัดตัวอักษรและต้องเลื่อนหน้าจอแนวนอน (Horizontal Scrolling) อย่างไม่สะดวก
   - ปุ่มกดมีขนาดเล็กเกินไป ไม่เหมาะกับระยะการใช้นิ้วสัมผัส (Touch Target Size)
3. **ปัญหาคำศัพท์และการแสดงผล 2 ภาษา (i18n):**
   - มีการตกค้างของคำว่า **"20 ไร่"** ในฐานข้อมูลและอินเทอร์เฟซ ซึ่งต้องเปลี่ยนเป็นคำว่า **"พื้นที่ทั้งหมด"** (TH) และ **"Campus Master Plan (All Areas)"** (EN)
   - คีย์แสดงผลหมายเลขชั้น (`floorNumberLabel`) แสดงเป็นชื่อคีย์ตัวอักษรแทนที่จะเป็น `"ชั้น X"` หรือ `"Floor X"`

---

## 🎨 2. สถาปัตยกรรม UX/UI ใหม่ (Responsive Hybrid Architecture)

ระบบได้รับการปรับโครงสร้างใหม่เป็นแบบ **Hybrid Presentation** ซึ่งปรับเปลี่ยนมุมมองตามขนาดหน้าจออย่างชาญฉลาด:

```
                          ┌─────────────────────────────┐
                          │   Asset Inventory Modal     │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     Desktop View (>= 640px)                         Mobile View (< 640px)
 ┌──────────────────────────────┐                ┌──────────────────────────────┐
 │ • Full Data Table            │                │ • Native Bottom Sheet (94vh) │
 │ • Sticky Header & Sorters    │                │ • Drag Handle Indicator      │
 │ • Expanded Max-Width (7xl)   │                │ • Mobile Asset Cards         │
 │ • Spacious Action Buttons    │                │ • Dual Touch-Target Buttons  │
 └──────────────────────────────┘                └──────────────────────────────┘
```

### 2.1 หน้าจอ Desktop (PC / Tablet แนวนอน)
- **High-Density Data Table with Sticky Header:** ส่วนหัวตารางถูกตรึงไว้ด้านบน (`sticky top-0 z-10 backdrop-blur-xs`) พร้อมไอคอนบอกทิศทางการเรียงลำดับ (`▲ / ▼`)
- **Interactive Sorting:** คลิกที่หัวคอลัมน์เพื่อสลับการเรียงลำดับ (รหัสทรัพย์สิน, ชื่ออุปกรณ์, สถานที่ตั้ง, สถานะ)
- **Expanded Width:** ขยายขอบเขตหน้าต่างเป็น `max-w-7xl` พร้อมจัดสรรความกว้างคอลัมน์และช่องว่างอย่างลงตัว ทำให้ปุ่ม Action ด้านขวามีพื้นที่เพียงพอ ไม่ตกขอบ

### 2.2 หน้าจอมือถือ (Mobile Viewport < 640px)
- **Native Bottom Sheet:** แสดงผลแบบ Bottom Sheet ความสูง `h-[94vh]` พร้อมมุมโค้งมนด้านบน (`rounded-t-3xl`) และแถบขีดช่วยดึง (Drag Indicator Pill)
- **Mobile Asset Cards:** ยกเลิกการแสดงตารางแนวนอน และเปลี่ยนเป็นการ์ดข้อมูลทรัพย์สินแต่ละชิ้นที่อ่านง่าย
- **Dual Touch-Friendly Buttons:** มีปุ่มกดขนาดใหญ่ 2 ปุ่มแยกสีชัดเจนในทุกการ์ด:
  - 🎯 **ชี้เป้าบนผัง** (สี Indigo): สลับไปยังอาคาร/ชั้นที่ถูกต้อง พร้อมซูมและกระพริบตำแหน่งอุปกรณ์
  - 🔧 **แจ้งซ่อม** (สี Amber): เปิดหน้าต่างแบบฟอร์มส่งคำขอแจ้งซ่อมทันที

---

## ⚡ 3. ฟีเจอร์แถบ KPI และการสืบค้นข้อมูลขั้นสูง

1. **Interactive KPI Summary Chips:**
   - แถบสรุปตัวเลขทรัพย์สินด้านบนแบบเรียลไทม์:
     - 📋 **ทรัพย์สินทั้งหมด**
     - 🟢 **ใช้งานปกติ (Active)**
     - 🟠 **กำลังซ่อม (Maintenance)**
     - 🔴 **ชำรุด (Broken)**
   - เมื่อคลิกที่ชิป KPI ตัวใด จะทำหน้าที่เป็น Quick Status Filter กรองรายการทันที
2. **Universal Fast Search & Filter Pills:**
   - ช่องค้นหาด่วนที่ตรวจจับคำค้นหาพร้อมกันทั้ง: รหัสทรัพย์สิน, ทะเบียนรถ, ชื่ออุปกรณ์, สเปก, ชื่อพนักงานผู้ถือครอง, แผนก และห้องติดตั้ง พร้อมปุ่ม `✕` เคลียร์ข้อความ
   - Type Filter Pills สำหรับกรองประเภทอุปกรณ์ (`📹 CCTV`, `💻 คอมพิวเตอร์`, `🖨️ เครื่องพิมพ์`, `🚗 ยานพาหนะ`)
3. **Scope Toggle:**
   - สลับขอบเขตการดูระหว่าง **"🏢 เฉพาะชั้นนี้"** และ **"🌐 พื้นที่ทั้งหมด"** ได้อย่างรวดเร็ว
4. **Pagination Controls:**
   - เลือกระยะจำนวนแถวต่อหน้าได้ (10, 25, 50 รายการ) พร้อมปุ่ม `← ก่อนหน้า` และ `ถัดไป →`

---

## 🌐 4. การจัดการฐานข้อมูลและการรองรับ 2 ภาษา (Database & i18n)

1. **การล้างคำว่า "20 ไร่" ในฐานข้อมูลและโค้ด:**
   - อัปเดตข้อมูลเอกสารใน MongoDB Collection `floorplans` จาก `"ผังบริเวณโครงการรวม 20 ไร่"` เป็น `"ผังบริเวณพื้นที่ทั้งหมด (Campus Master Plan)"`
   - เพิ่มฟังก์ชัน `formatBuildingName(rawName)` เพื่อกรองและแปลงคำศัพท์ตกค้างให้เป็นภาษาไทย/อังกฤษอย่างปลอดภัย
2. **การปรับแต่ง Localization (`client/src/i18n/messages.js`):**
   - เพิ่มคีย์แปลภาษาใหม่: `kpiTotal`, `kpiActive`, `kpiMaintenance`, `kpiBroken`, `rowsPerPage`, `showingRangeOfTotal`, `prevPage`, `nextPage`, `pageOf`, `sortBy`, `floorNumberLabel`
   - แก้ไขปัญหา `floorNumberLabel` แสดงผลเป็นชื่อตัวแปร ให้แสดงเป็น `"ชั้น {floor}"` (TH) และ `"Floor {floor}"` (EN) อย่างสมบูรณ์

---

## 🧪 5. ผลการทดสอบและการตรวจสอบ (Verification Results)

| รายการทดสอบ | สภาพแวดล้อม | ผลลัพธ์ | หมายเหตุ |
|:---|:---:|:---:|:---|
| **Production Build Test** | Vite / Node.js | ✅ ผ่าน 100% | `npm run build` สำเร็จ ไม่มีข้อผิดพลาด (0 errors) |
| **Desktop Layout Test** | 1710x986 Viewport | ✅ ผ่าน 100% | ตารางกว้างขวาง หัวตาราง Sticky, ปุ่ม Action ชัดเจน ไม่ตกขอบ |
| **Mobile Layout Test** | 390x844 Viewport | ✅ ผ่าน 100% | แสดงผล Bottom Sheet การ์ดสัมผัสชัดเจน ไม่มี Horizontal Scroll |
| **KPI Chips Filtering** | Desktop & Mobile | ✅ ผ่าน 100% | ตัวเลข KPI สอดคล้องกับสถานะ และคลิกเพื่อกรองได้ทันที |
| **Language Toggle Test** | TH ⇄ EN | ✅ ผ่าน 100% | ข้อความ สรุป KPI และชื่ออาคารสลับภาษาถูกต้องสมบูรณ์ |
| **Elimination of "20 ไร่"** | All Views & DB | ✅ ผ่าน 100% | ไม่พบคำว่า "20 ไร่" ในระบบ แสดงผลเป็น "พื้นที่ทั้งหมด" |

---

## 📁 6. สรุปรายการไฟล์ที่มีการเปลี่ยนแปลง

1. `client/src/components/floorplan/AssetInventoryModal.jsx`: ปรับปรุงโครงสร้างสถาปัตยกรรม UI ตาราง PC และการ์ด Mobile
2. `client/src/i18n/messages.js`: เพิ่มชุดคำแปลภาษาไทยและภาษาอังกฤษสำหรับตารางจัดการทรัพย์สิน
3. `server/src/data/generateCampusData.js` & `campusFloorPlansData.js`: ปรับปรุงคำศัพท์ Master Plan
4. `docs/ASSET_INVENTORY_MODAL_REDESIGN_REPORT.md`: เอกสารสรุปรายงานฉบับนี้
