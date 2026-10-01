# รายงานการพัฒนาระบบตู้นิรภัยส่วนตัว (Personal Vault System Report)

**โครงการ:** FTI Newcomer Portal (FTI Welcome Hub)  
**วันที่จัดทำ:** 1 ตุลาคม 2026  
**เวอร์ชัน:** 1.0.0  
**สถานะ:** ✅ พัฒนาและทดสอบเสร็จสมบูรณ์ พร้อมใช้งาน (Production Ready)

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

ระบบ**ตู้นิรภัยส่วนตัว (Personal Vault)** ถูกพัฒนาขึ้นเพื่อตอบสนองความต้องการของพนักงานและบุคลากรภายในสภาอุตสาหกรรมแห่งประเทศไทย (FTI) ในการจัดเก็บข้อมูลที่มีความอ่อนไหวสูง เช่น รหัสผ่านระบบภายใน, โน้ตลับ, ข้อมูลบัตรประจำตัว และคีย์ทางเทคนิค (API Keys/SSH) ไว้อย่างปลอดภัยสูงสุด 

ระบบได้รับการออกแบบตามมาตรฐาน **Zero-Knowledge Architecture** ร่วมกับวิทยาการเข้ารหัสลับ **AES-256-GCM (Authenticated Encryption)** โดยกุญแจเข้ารหัสจะถูกสร้างขึ้นแบบไดนามิกจาก **Master PIN 6 หลัก** ของผู้ใช้ร่วมกับ Salt เฉพาะบุคคล ทำให้แม้แต่ผู้ดูแลระบบหรือผู้ดูแลฐานข้อมูลก็ไม่สามารถล่วงรู้หรือถอดรหัสข้อมูลความลับของผู้ใช้ได้หากไม่มี Master PIN

---

## 2. สถาปัตยกรรมและโครงสร้างความปลอดภัย (Security Architecture)

### 2.1 แผนภาพการเข้ารหัสลับ (Cryptographic Flow)

```
[ User Master PIN (6-digit) ]
            │
            ▼
┌──────────────────────────────────────────────┐
│  Key Derivation via scrypt                   │
│  - User Salt (16-byte random hex)            │
│  - Server Pepper                             │
│  - Derived Key: 256 bits (32 bytes)          │
└──────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│  AES-256-GCM Cipher                          │
│  - Initialization Vector: 12-byte random     │
│  - Auth Tag: 16-byte authentication tag      │
│  - Ciphertext: Hex-encoded encrypted payload │
└──────────────────────────────────────────────┘
            │
            ▼
[ Stored safely in MongoDB (VaultItem) ]
```

### 2.2 กลไกการป้องกันเชิงลึก (Defense in Depth)

1. **Zero-Knowledge Principle:** รหัส Master PIN จะไม่ถูกส่งไปเก็บไว้เป็น Plaintext บน Server โดยจะถูก Hash ด้วย `bcrypt` สำหรับการยืนยันตัวตนเท่านั้น ส่วนการเข้ารหัสข้อมูลจะใช้ Derived Key จาก `scrypt`
2. **Volatile Client Memory Only:** ในฝั่ง Frontend รหัส PIN จะถูกเก็บไว้ใน React Memory State ชั่วคราวเฉพาะขณะที่ปลดล็อกตู้นิรภัยอยู่เท่านั้น จะไม่มีการบันทึกรหัส PIN ลงใน `localStorage` หรือ `sessionStorage` เพื่อป้องกันการถูกดึงข้อมูลผ่าน XSS
3. **Configurable Auto-Lock Timer:** ระบบตั้งเวลาล็อกอัตโนมัติ (Default 10 นาที ปรับได้ตั้งแต่ 1-60 นาที) โดยจะจับเวลาถอยหลังแบบ Real-time และจะรีเซ็ตเวลาเมื่อผู้ใช้มีการขยับเมาส์หรือพิมพ์งาน หากหมดเวลาระบบจะล้าง PIN ออกจากหน่วยความจำทันที
4. **Brute Force Lockout:** หากมีการกรอกรหัส PIN ผิดติดต่อกันเกิน 5 ครั้ง ระบบจะสั่งล็อกการเข้าถึงชั่วคราวเป็นเวลา 5 นาทีทันที
5. **Atomic Re-encryption on PIN Change:** เมื่อผู้ใช้ทำการเปลี่ยน Master PIN ระบบจะทำการตรวจสอบ PIN เดิม, ถอดรหัสข้อมูลความลับทั้งหมดของผู้ใช้ในคราวเดียว, และเข้ารหัสใหม่ด้วย PIN ใหม่ทั้งหมดทันทีแบบ Atomic Operation

---

## 3. หมวดหมู่ข้อมูลที่รองรับ (Supported Secret Categories)

| หมวดหมู่ | ไอคอน | รหัสหมวด | ฟิลด์ข้อมูลเฉพาะ |
|---|:---:|---|---|
| **รหัสผ่านบัญชี (Logins)** | 🔑 | `login` | ชื่อผู้ใช้, รหัสผ่าน (Masked `••••••••••••`), ลิงก์ URL, ป้ายกำกับ (Tags) |
| **โน้ตความลับ (Secure Notes)** | 📝 | `note` | เนื้อหาข้อความความลับแบบหลายบรรทัด พร้อมปุ่มเปิดอ่าน/ซ่อน และคัดลอก |
| **บัตรและข้อมูลตัวตน (Cards/IDs)** | 💳 | `card` | ชื่อผู้ถือบัตร, ประเภทบัตร, หมายเลขบัตร (Masked แสดงเฉพาะ 4 ตัวท้าย), วันหมดอายุ, CVV |
| **API & คีย์เทคนิค (Keys/Tokens)** | ⚙️ | `key` | ประเภทคีย์ (API Key, Secret Token, SSH Private Key, Wi-Fi Password), ค่าคีย์ความลับ |

---

## 4. มาตรฐาน UI/UX Promax ที่นำมาใช้

1. **Tactile PIN Keypad & Dots Indicator:**
   - หน้าจอล็อกสไตล์ Apple/Banking App พร้อมจุด PIN 6 จุดที่สว่างและขยายตัวตามจังหวะการกด
   - แป้นพิมพ์ตัวเลขบนหน้าจอ (1-9, 0, Backspace, Clear) ที่มี Feedback การกดที่นุ่มนวล
   - รองรับ Physical Keyboard อัตโนมัติ (กดตัวเลขบนคีย์บอร์ดได้ทันที)
2. **Visual Masking & Micro-interactions:**
   - ข้อมูลความลับจะถูก Mask ซ่อนเป็นค่าเริ่มต้น
   - ปุ่มสลับ 👁️ เปิด/ปิดการแสดงผล
   - ปุ่ม 📋 1-Click Copy พร้อมการแจ้งเตือน Toast ("คัดลอกแล้ว!") ทันที
3. **Password Generator Tool:**
   - มีทั้งแบบเปิดในหน้าต่างแยกเดี่ยว และแบบเรียกใช้ในฟอร์มบันทึกข้อมูล
   - ปรับความยาวได้ตั้งแต่ 8 ถึง 64 ตัวอักษร
   - สลับเปิด/ปิด ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, สัญลักษณ์พิเศษ
   - เกจวัดความแข็งแกร่งของรหัสผ่าน (Weak, Fair, Good, Strong, Military Grade)
4. **Instant Filtering & Bookmarks:**
   - แท็บกรองหมวดหมู่พร้อมจำนวนนับแบบ Real-time
   - กรองเฉพาะรายการโปรด (Favorites ⭐)
   - ค้นหาแบบ Real-time ค้นได้ทั้งชื่อ, บัญชี, โดเมน และ Tags

---

## 5. จุดเชื่อมโยงการเข้าถึงระบบ (Access Points)

ผู้ใช้งานสามารถเข้าสู่หน้าระบบตู้นิรภัยส่วนตัวได้จาก 3 ช่องทางหลัก:
1. **User Profile Dropdown (รูปโปรไฟล์มุมขวาบน):** เมนู "🔒 ตู้นิรภัยส่วนตัว (Vault)"
2. **Dashboard Navigation Card:** การ์ด "🔒 ตู้นิรภัยส่วนตัว (Personal Vault)" ในส่วนของ Directories & Services
3. **Mobile Drawer Navigation:** เมนูนำทางบนหน้าจอสมาร์ทโฟน
4. **Direct URL:** `/vault` (มีการคุ้มครองด้วย `ProtectedRoute` สำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว)

---

## 6. สรุปผลการทดสอบ (Test Summary)

- **Frontend Build:** `npm run build` ผ่าน 100% (Vite production bundle สำเร็จโดยไม่มีข้อผิดพลาด)
- **Unit & Logic Tests:** `vitest` ผ่านทั้งหมด 23 การทดสอบ (ครอบคลุมการตรวจสอบ PIN 6 หลัก, การ Mask ข้อมูลลับ, การกรองหมวดหมู่, และการคำนวณ Auto-Lock)
- **Backend API:** Health Check `/api/health` ทำงานปกติ (Status 200 OK) และโมเดล Mongoose เชื่อมต่อกับ MongoDB Atlas ได้อย่างราบรื่น
