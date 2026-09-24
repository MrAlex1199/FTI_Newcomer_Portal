# 💰 ประเมินค่าใช้จ่าย Deploy — FTI Newcomer Portal (500 Users)

## สรุปโปรไฟล์ระบบ

| รายการ | รายละเอียด |
|---|---|
| **Frontend** | React 18 + Vite (Static SPA, ~4MB built) |
| **Backend** | Express.js + Node.js (REST API + Socket.io) |
| **Database** | MongoDB (Mongoose ODM) |
| **File Storage** | Cloudinary (รูปภาพ) + Local uploads (floor plans) |
| **Real-time** | Socket.io (Chat feature) |
| **จำนวนบัญชี** | 500 คน |
| **Concurrent Users** | ≤ 50 คน |
| **งบประมาณ** | ≤ 500 บาท/เดือน |
| **SLA** | ยอมรับ downtime บ้างได้ |
| **Domain** | ต้องการ Custom Domain + CDN |

---

## 🏆 แผนแนะนำ: Render + MongoDB Atlas + Cloudflare

> [!TIP]
> แผนนี้ให้ค่าใช้จ่ายต่ำที่สุดในขณะที่ยังรองรับ 500 user ได้สบาย พร้อม CDN และ Custom Domain ฟรี

### รายละเอียดค่าใช้จ่ายรายเดือน

| บริการ | Tier/Plan | ค่าใช้จ่าย/เดือน (USD) | ค่าใช้จ่าย/เดือน (THB) | หมายเหตุ |
|---|---|---:|---:|---|
| **Render** (Backend) | Free Instance | **$0** | **฿0** | Node.js server, sleep หลัง 15 นาทีไม่มี request (cold start ~30s) |
| **Render** (Frontend) | Static Site (Free) | **$0** | **฿0** | Serve React build, CDN ในตัว |
| **MongoDB Atlas** | M0 Free Tier | **$0** | **฿0** | 512MB storage, Shared cluster, เพียงพอสำหรับ 500 users |
| **Cloudinary** | Free Tier | **$0** | **฿0** | 25GB storage + 25GB bandwidth/เดือน |
| **Cloudflare** | Free Plan | **$0** | **฿0** | DNS + CDN + SSL + DDoS protection |
| **Domain Name** | .com / .co.th | **~$1/mo** | **~฿35** | ราคาต่อปี ~$12 (~฿420) สำหรับ .com |
| | | | | |
| **รวมทั้งหมด** | | **~$1/mo** | **~฿35/เดือน** | **~฿420/ปี** (ค่าโดเมนอย่างเดียว) |

> [!WARNING]
> **Render Free Tier มีข้อจำกัด**: Server จะ sleep หลังไม่มี request 15 นาที → Request แรกหลัง sleep จะใช้เวลา ~30 วินาที (cold start) ถ้ายอมรับได้ = ฟรี, ถ้ายอมรับไม่ได้ = ดูแผน B

---

## 🥈 แผน B: Render Paid + MongoDB Atlas (ไม่มี Cold Start)

> [!NOTE]
> เหมาะสำหรับกรณีที่ไม่อยากให้ server sleep (ไม่มี cold start delay)

| บริการ | Tier/Plan | ค่าใช้จ่าย/เดือน (USD) | ค่าใช้จ่าย/เดือน (THB) | หมายเหตุ |
|---|---|---:|---:|---|
| **Render** (Backend) | Starter ($7/mo) | **$7** | **฿245** | Always-on, 512MB RAM, 0.5 CPU |
| **Render** (Frontend) | Static Site (Free) | **$0** | **฿0** | CDN ในตัว |
| **MongoDB Atlas** | M0 Free Tier | **$0** | **฿0** | 512MB storage |
| **Cloudinary** | Free Tier | **$0** | **฿0** | 25GB storage |
| **Cloudflare** | Free Plan | **$0** | **฿0** | CDN + SSL |
| **Domain Name** | .com | **~$1** | **~฿35** | |
| | | | | |
| **รวมทั้งหมด** | | **~$8/mo** | **~฿280/เดือน** | **~฿3,360/ปี** |

---

## 🥉 แผน C: Railway (ทางเลือกอื่น, Deploy ง่ายมาก)

| บริการ | Tier/Plan | ค่าใช้จ่าย/เดือน (USD) | ค่าใช้จ่าย/เดือน (THB) | หมายเหตุ |
|---|---|---:|---:|---|
| **Railway** | Hobby ($5/mo + usage) | **~$5-8** | **~฿175-280** | รวม Backend + static hosting, auto-deploy จาก Git |
| **MongoDB Atlas** | M0 Free Tier | **$0** | **฿0** | 512MB storage |
| **Cloudinary** | Free Tier | **$0** | **฿0** | |
| **Cloudflare** | Free Plan | **$0** | **฿0** | CDN + SSL |
| **Domain Name** | .com | **~$1** | **~฿35** | |
| | | | | |
| **รวมทั้งหมด** | | **~$6-9/mo** | **~฿210-315/เดือน** | **~฿2,520-3,780/ปี** |

---

## 📊 เปรียบเทียบ 3 แผน

| เกณฑ์ | แผน A (Render Free) | แผน B (Render Paid) | แผน C (Railway) |
|---|:---:|:---:|:---:|
| **ค่าใช้จ่าย/ปี** | ~฿420 | ~฿3,360 | ~฿2,520-3,780 |
| **Cold Start** | ⚠️ มี (~30s) | ✅ ไม่มี | ✅ ไม่มี |
| **Deploy ง่าย** | ✅ Push-to-deploy | ✅ Push-to-deploy | ✅ Push-to-deploy |
| **WebSocket (Chat)** | ⚠️ ทำงานแต่อาจ disconnect เมื่อ sleep | ✅ ทำงานต่อเนื่อง | ✅ ทำงานต่อเนื่อง |
| **Custom Domain** | ✅ ฟรี | ✅ ฟรี | ✅ ฟรี |
| **CDN** | ✅ Static site มี CDN | ✅ Static site มี CDN | ⚠️ ต้องใช้ Cloudflare เสริม |
| **SSL** | ✅ ฟรี (auto) | ✅ ฟรี (auto) | ✅ ฟรี (auto) |
| **Scalability** | ⚠️ จำกัด | ✅ ปรับขยายได้ | ✅ ปรับขยายได้ |
| **เหมาะกับ** | ทดลอง/งบน้อยมาก | **แนะนำสำหรับ production** | ต้องการ deploy ง่ายสุด |

---

## 📋 รายละเอียดแต่ละบริการ

### 1. MongoDB Atlas — Free Tier (M0)
- **Storage**: 512 MB (เพียงพอสำหรับ 500 user accounts + data)
- **Connections**: 500 concurrent connections
- **Region**: เลือก Singapore (ap-southeast-1) เพื่อ latency ต่ำสำหรับไทย
- **Backup**: Daily snapshot ฟรี

> [!NOTE]
> ประเมินขนาดข้อมูล: 500 users × ~5KB/user + assets + floor plans + chat ≈ **50-150MB** → M0 (512MB) เพียงพอ

### 2. Cloudinary — Free Tier
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/เดือน
- **Transformations**: 25,000 ครั้ง/เดือน
- ใช้สำหรับ: รูปโปรไฟล์, รูปประกาศ, poster images

### 3. Cloudflare — Free Plan
- **CDN**: Global CDN เร่งความเร็ว static assets
- **SSL**: ฟรี auto SSL certificate
- **DDoS Protection**: Basic protection ฟรี
- **DNS**: ฟรี, เร็วมาก
- **Caching**: Cache static files ลด bandwidth

### 4. Domain Name
- **.com**: ~฿350-500/ปี (Namecheap, Cloudflare Registrar)
- **.co.th**: ~฿800-1,200/ปี (ต้องจดผ่าน registrar ไทย, ต้องมีเอกสารบริษัท)

---

## ⚠️ จุดที่ต้องระวัง

### MongoDB Atlas M0 Limitations
- Storage จำกัด 512MB → ถ้าข้อมูลโตเกิน ต้องอัพเป็น M2 (~$9/เดือน) หรือ M5 (~$25/เดือน)
- ไม่มี dedicated performance → ช้าในบางช่วง peak

### Render Free Tier Limitations
- Server sleep หลัง 15 นาที → Cold start ~30 วินาที
- WebSocket (Chat) จะ disconnect เมื่อ server sleep
- 750 ชั่วโมง/เดือน (เพียงพอสำหรับ 1 instance ตลอดเดือน)

### File Uploads (Floor Plans)
- Render Free Tier ใช้ **ephemeral filesystem** → ไฟล์ที่อัพโหลดผ่าน Multer จะหายหลัง redeploy
- **แก้ไข**: ย้าย floor plan uploads ไปใช้ Cloudinary หรือ S3-compatible storage (เช่น Cloudflare R2 free tier: 10GB ฟรี)

---

## 🎯 คำแนะนำสุดท้าย

> [!IMPORTANT]
> **สำหรับงบ ≤ 500 บาท/เดือน แนะนำ แผน B (Render Starter $7 + MongoDB Atlas Free)**
> - ค่าใช้จ่าย ~฿280/เดือน (~฿3,360/ปี)
> - ไม่มี cold start, WebSocket ทำงานต่อเนื่อง
> - Push-to-deploy จาก GitHub
> - อยู่ในงบประมาณสบายๆ

หรือถ้าอยากประหยัดสุดๆ ใช้ **แผน A (ฟรีทั้งหมด)** ได้ แต่ต้องยอมรับ cold start 30 วินาทีและ chat อาจ disconnect เป็นบางครั้ง

---

## 📈 แผนขยายในอนาคต (ถ้า user เกิน 500 หรือข้อมูลเยอะขึ้น)

| เงื่อนไข | อัพเกรด | ค่าใช้จ่ายเพิ่ม |
|---|---|---|
| ข้อมูลเกิน 512MB | MongoDB Atlas M2 | +$9/เดือน (~฿315) |
| ต้องการ RAM มากขึ้น | Render Standard ($25/mo) | +$18/เดือน (~฿630) |
| รูปภาพเกิน 25GB | Cloudinary Plus ($89/mo) | +$89/เดือน (~฿3,115) |
| ต้องการ file storage ถาวร | Cloudflare R2 (10GB free, $0.015/GB) | ฟรีถ้า ≤10GB |
