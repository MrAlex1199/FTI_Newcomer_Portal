# FTI Newcomer & Intern Portal — Technical Specification

> ระบบเว็บภายในสำหรับแนะนำบริษัทและช่วย Onboarding นักศึกษาฝึกงาน / พนักงานใหม่ของ Function International (FTI)
>
> เอกสารนี้จัดทำเพื่อใช้เป็น **Source of Truth สำหรับ AI Coding Assistant** ในการพัฒนาโปรเจกต์ทีละขั้น โดยเน้นความปลอดภัย ใช้งานจริงได้ และไม่รบกวนระบบหลักของบริษัท

---

## 1. Project Overview

### 1.1 ชื่อโครงการ

**FTI Newcomer Portal**

ชื่อที่ใช้ใน UI อาจเป็น:

- FTI Welcome Hub
- FTI Newcomer Center
- FTI Intern & Employee Hub

แนะนำ: **FTI Welcome Hub**

### 1.2 เป้าหมาย

สร้างเว็บไซต์ภายในบริษัทที่ช่วยให้:

1. นักศึกษาฝึกงานรุ่นใหม่รู้จักบริษัทและสถานที่ทำงานเร็วขึ้น
2. พนักงานใหม่รู้จักบุคลากร แผนก และผู้ที่ต้องติดต่อ
3. ค้นหาข้อมูลพื้นฐานขององค์กรได้จากที่เดียว
4. มีข้อมูลกฎระเบียบและคำแนะนำสำหรับวันแรก
5. เก็บข้อมูลนักศึกษาฝึกงานเป็นรุ่นและค้นหาย้อนหลังได้
6. เป็นผลงาน Full Stack + IT Support ที่สามารถนำเสนอเป็นโปรเจกต์ฝึกงานได้
7. แยกออกจากระบบธุรกิจหลัก ลดความเสี่ยงต่อ Production System ของบริษัท

### 1.3 แนวคิดสำคัญ

เว็บนี้ควรเป็น **Internal Information & Onboarding Portal** ไม่ใช่ HRIS และไม่ควรเก็บข้อมูลเงินเดือน, ประวัติส่วนตัวละเอียด, เอกสาร HR สำคัญ หรือข้อมูลลับทางธุรกิจ

---

# 2. Company Context Used for Initial Content

ข้อมูลตั้งต้นจากเว็บไซต์ FTI ที่ตรวจสอบได้ ณ วันที่จัดทำเอกสาร:

- บริษัทดำเนินธุรกิจผลิต นำเข้า และขายส่งผลิตภัณฑ์เกี่ยวกับระบบน้ำอย่างครบวงจร
- เว็บไซต์บริษัทมีส่วนเกี่ยวกับบริษัท, วิสัยทัศน์/พันธกิจ, ประวัติ, โครงสร้างองค์กร, ข่าว/กิจกรรม และร่วมงานกับเรา
- สำนักงานใหญ่ระบุที่ 313 ถนนเจริญพัฒนา แขวงบางชัน เขตคลองสามวา กรุงเทพมหานคร 10510
- โทรศัพท์กลาง 0-2540-6263 และเว็บไซต์มีข้อมูลติดต่อฝ่ายต่าง ๆ
- เว็บไซต์บริษัทระบุว่าบริษัทก่อตั้งเมื่อ 3 มกราคม 2540 และย้ายสำนักงานใหญ่ไปยังที่ตั้งปัจจุบันในปี 2547
- เว็บไซต์บริษัทระบุมาตรฐานระบบบริหารงานคุณภาพ ISO 9001:2015

แหล่งอ้างอิงหลัก:

- https://www.functioninter.co.th/th/home
- https://www.functioninter.co.th/th/about-us
- https://www.functioninter.co.th/th/about-us/company-milestone
- https://www.functioninter.co.th/th/about-us/vision-slogan-mission-and-quality-policy
- https://www.functioninter.co.th/th/contact-us
- https://www.functioninter.co.th/th/career/available-position

**กฎสำคัญ:** ข้อมูลในส่วนนี้เป็นเพียง seed content เพื่อเริ่มต้นระบบ ไม่ควร hard-code ให้แก้ไม่ได้ ควรทำหน้า Admin สำหรับแก้ไขข้อมูลบริษัท

---

# 3. Core Features

## 3.1 Authentication

ระบบต้องมี Login และ Logout

### Roles

1. `super_admin`
   - จัดการทุกอย่าง
   - จัดการ Admin
   - จัดการระบบตั้งค่า

2. `admin`
   - จัดการข้อมูลบริษัท
   - จัดการพนักงาน
   - จัดการนักศึกษาฝึกงาน
   - จัดการกฎระเบียบ
   - จัดการประกาศ
   - จัดการ FAQ
   - จัดการแผนก

3. `editor`
   - แก้ไข Content ที่ได้รับสิทธิ์
   - เพิ่มข่าวหรือคู่มือ
   - ไม่มีสิทธิ์จัดการผู้ใช้ระบบ

4. `staff`
   - อ่านข้อมูลภายในตามสิทธิ์
   - ดู Directory
   - ดูแผนผังองค์กร
   - ดูคู่มือ

5. `intern`
   - ดูข้อมูลสำหรับ Intern
   - ดูพนักงาน/ทีมที่ได้รับอนุญาต
   - ดูคู่มือวันแรก
   - ดูข้อมูลรุ่นฝึกงาน
   - สามารถแก้ไข Profile ของตัวเองได้เฉพาะ field ที่อนุญาต

### Authentication Rules

- Password ต้อง hash ด้วย Argon2id หรือ bcrypt
- ห้ามเก็บ password plaintext
- JWT ควรเก็บใน HttpOnly Secure SameSite cookie
- หลีกเลี่ยงการเก็บ JWT ใน localStorage หากสามารถใช้ HttpOnly cookie ได้
- มี `access token` อายุสั้น และพิจารณา `refresh token` สำหรับ production
- มี rate limit ที่ Login
- มี account lock / cooldown หลัง Login ผิดหลายครั้ง
- มี Logout ที่ invalidate refresh token/session
- มี validation ทุก request
- ทุก protected route ต้องตรวจสอบ role/permission ฝั่ง Backend เสมอ

---

# 4. Main User Experience

## 4.1 Landing / Dashboard

หลัง Login ให้แสดงหน้า Dashboard

### Sections

- Welcome message
- ชื่อผู้ใช้งาน
- ตำแหน่ง / แผนก
- วันเริ่มงานหรือเริ่มฝึกงาน
- จำนวนวันตั้งแต่เริ่มงาน
- Quick Menu
- ข่าวสารล่าสุด
- ประกาศสำคัญ
- คู่มือที่แนะนำ
- People Spotlight
- นักศึกษาฝึกงานรุ่นปัจจุบัน
- ปุ่มดูแผนที่บริษัท
- ปุ่มดู Organization Chart

---

# 5. Intern Directory

## 5.1 ข้อมูลที่แสดง

สำหรับนักศึกษาฝึกงาน ให้แสดงข้อมูลเท่าที่จำเป็น:

- Profile Photo
- ชื่อ - นามสกุล
- ชื่อเล่น (optional)
- มหาวิทยาลัย
- คณะ / สาขา
- ชั้นปี (optional)
- อายุ (optional / ต้องได้รับอนุญาตจากเจ้าของข้อมูล)
- รุ่นที่ฝึกงาน (`intern_batch`)
- วันที่เริ่มฝึก
- วันที่สิ้นสุด
- แผนก
- ผู้ดูแล / Mentor
- งานหรือหัวข้อที่รับผิดชอบแบบสั้น ๆ
- สถานะ `active / completed / upcoming`

### Privacy Recommendation

**ไม่ควรแสดงวันเกิดเต็ม** ใน Directory

ใช้ `age` หรือ `age_range` เท่านั้นเมื่อจำเป็น และต้องมี consent/นโยบายภายในรองรับ

ตัวอย่าง:

```text
ชื่อ: กิตติภาส ทิพย์...
มหาวิทยาลัย: ...
สาขา: เทคโนโลยีสารสนเทศ
รุ่น: 2026/01
เริ่มฝึก: 1 สิงหาคม 2026
สิ้นสุด: 31 ตุลาคม 2026
แผนก: IT
Mentor: ...
```

### Search / Filter

- ชื่อ
- มหาวิทยาลัย
- แผนก
- รุ่น
- ปี
- สถานะ

---

# 6. Employee Directory

## 6.1 Employee Card

แสดง:

- Profile photo
- ชื่อ
- ชื่อเล่น (ถ้าอนุญาต)
- ตำแหน่ง
- แผนก
- บริษัท/หน่วยงานย่อยถ้ามี
- Extension / เบอร์ภายใน (ถ้าได้รับอนุญาต)
- Email ภายใน (ถ้าได้รับอนุญาต)
- Office location
- Skills/Area (optional)

ไม่แนะนำให้แสดง:

- เลขบัตรประชาชน
- วันเกิด
- ที่อยู่บ้าน
- เบอร์โทรศัพท์ส่วนตัว
- เงินเดือน
- ข้อมูลส่วนบุคคลที่ไม่เกี่ยวกับการทำงาน

---

# 7. Organization Chart

ต้องมีหน้า:

`/organization`

### UI

- Tree structure
- Zoom In / Zoom Out
- Collapse / Expand
- Click employee → เปิดข้อมูลแบบ Modal/Side Panel
- Filter by department
- Search employee

### ตัวอย่าง Structure

```text
บริษัท
├── ฝ่ายบริหาร
├── ฝ่ายทรัพยากรบุคคล
├── ฝ่าย IT
│   ├── IT Support
│   ├── Software / Developer
│   └── Infrastructure
├── ฝ่ายการตลาด
├── ฝ่ายขาย
├── ฝ่ายจัดซื้อ
└── ฝ่ายอื่น ๆ
```

**หมายเหตุ:** รายชื่อและสายบังคับบัญชาต้องใช้ข้อมูลจริงจากบริษัทเมื่อได้รับอนุญาต ห้ามเดาข้อมูลจริงจากเว็บไซต์แล้วนำไปใช้เป็นฐานข้อมูลพนักงาน

---

# 8. Department Directory

สร้างหน้า:

`/departments`

แต่ละ Department แสดง:

- Department name
- Description
- Manager
- Members
- หน้าที่หลัก
- ติดต่อใครเรื่องอะไร
- ตำแหน่งที่พบบ่อยในแผนก
- Location
- Contact extension (optional)

### ตัวอย่าง

```text
IT Department

หน้าที่:
- ดูแล Computer / Network
- Support ผู้ใช้งาน
- ดูแลระบบภายใน
- ดูแล Software / Hardware

ติดต่อเรื่อง:
- Computer มีปัญหา
- Internet / Wi-Fi
- Printer
- Account / Password
```

---

# 9. Company Map

หน้า:

`/location`

ต้องแสดง:

- Google Maps / OpenStreetMap หรือ map provider ที่บริษัทอนุญาต
- ตำแหน่งสำนักงานใหญ่
- ที่อยู่
- โทรศัพท์กลาง
- Parking
- ทางเข้า
- จุดลงทะเบียน/Reception
- จุดติดต่อ HR
- จุดติดต่อ IT
- ห้องประชุมสำคัญ
- จุด emergency
- จุดรวมพล (ถ้ามีข้อมูลจากบริษัท)

### Interactive Map

เมื่อคลิกจุด:

```text
ชื่อจุด
รายละเอียด
ผู้ติดต่อ
เบอร์ภายใน
```

**สำคัญ:** อย่าเผยแพร่ข้อมูลด้านความปลอดภัยเชิงลึก เช่น จุดอ่อนของระบบรักษาความปลอดภัย, รหัสประตู, CCTV blind spot หรือข้อมูลที่อาจถูกนำไปใช้ในทางไม่เหมาะสม

---

# 10. Newcomer Guide

หน้า:

`/getting-started`

แบ่งเป็นหมวด:

### First Day

- มาถึงกี่โมง
- ต้องติดต่อใคร
- ลงทะเบียนที่ไหน
- Parking อยู่ตรงไหน
- แต่งกายอย่างไร
- เตรียมอะไรไปบ้าง
- ต้องนำบัตรประชาชนหรือเอกสารอะไรหรือไม่
- วันแรกต้องทำอะไร

### First Week

- แนะนำแผนก
- ตั้งค่า Computer
- ขอ Account
- เรียนรู้ระบบที่จำเป็น
- รู้จัก Mentor
- วิธีขอความช่วยเหลือ

### Before Leaving

สำหรับ Intern:

- ส่งมอบงาน
- ส่งไฟล์ Source Code
- ส่ง Documentation
- คืนอุปกรณ์
- ส่งแบบประเมิน

---

# 11. Rules & Regulations

หน้า:

`/policies`

ตัวอย่างหมวด:

- การแต่งกาย
- เวลาทำงาน
- การลางาน/ลาไปมหาวิทยาลัย
- การใช้ Computer
- การใช้ Internet
- การใช้ Email บริษัท
- การรักษาความลับ
- การใช้งาน Software ที่บริษัทอนุญาต
- การถ่ายภาพในพื้นที่บริษัท
- การนำอุปกรณ์ออกนอกบริษัท
- Cybersecurity Basic Rules
- PDPA / Privacy
- Safety
- Emergency Procedure

### Policy Model

แต่ละข้อควรมี:

- title
- short_summary
- content
- priority
- effective_date
- version
- attachment
- updated_by
- updated_at

---

# 12. FAQ

หน้า:

`/faq`

ตัวอย่าง:

- วันแรกต้องมาถึงกี่โมง?
- Parking อยู่ตรงไหน?
- ต้องแต่งชุดอะไร?
- Wi-Fi ขออย่างไร?
- Computer มีปัญหาติดต่อใคร?
- Printer มีปัญหาติดต่อใคร?
- ต้องการลาไปมหาวิทยาลัยแจ้งใคร?
- ห้องน้ำอยู่ตรงไหน?
- โรงอาหารอยู่ตรงไหน?
- ห้องประชุมอยู่ตรงไหน?

เพิ่ม Search FAQ

---

# 13. News & Announcements

หน้า:

`/announcements`

Admin สามารถสร้าง:

- ข่าว
- ประกาศด่วน
- กิจกรรม
- วันหยุด
- Training
- Welcome New Intern
- Maintenance Notice

Fields:

- title
- summary
- content
- cover_image
- category
- publish_at
- expire_at
- pinned
- target_role
- status

---

# 14. Intern Batch System

ระบบรุ่นฝึกงานควรเป็น Feature สำคัญ

ตัวอย่าง:

```text
Batch 2026/01
├── จำนวน 8 คน
├── เริ่มฝึก 01/08/2026
├── สิ้นสุด 31/10/2026
└── แผนกที่เกี่ยวข้อง
```

ใน Batch Page:

- Group photo
- รายชื่อ
- มหาวิทยาลัย
- แผนก
- Mentor
- Project
- Timeline
- Status

### ประโยชน์

นักศึกษารุ่นใหม่สามารถดูรุ่นก่อนหน้าเพื่อเรียนรู้ว่า:

- ใครเคยฝึก
- ฝึกแผนกอะไร
- ทำ Project อะไร
- มีคำแนะนำอะไร

---

# 15. Intern Alumni / Knowledge Archive

เพิ่ม Feature นี้เป็นหนึ่งในจุดเด่นของโครงงาน

ตัวอย่าง:

```text
Intern Alumni

รุ่น: 2025/02
ชื่อ: ...
มหาวิทยาลัย: ...
แผนก: IT
Project: IT Asset Dashboard
สิ่งที่ได้เรียนรู้: ...
คำแนะนำสำหรับรุ่นต่อไป: ...
```

ควรให้เจ้าของข้อมูลเลือกได้ว่าจะให้เผยแพร่หรือไม่

---

# 16. Project Showcase

หน้า:

`/intern-projects`

แสดง Project ของนักศึกษาฝึกงานรุ่นก่อน:

- Project name
- Description
- Tech stack
- Student
- Department
- Mentor
- Start / End
- Repository link (ถ้าบริษัทอนุญาต)
- Demo link (ถ้ามี)
- Screenshot
- Lessons learned

**ห้ามเผยแพร่ Source Code หรือเอกสารภายในที่เป็นความลับโดยไม่ได้รับอนุญาต**

---

# 17. IT Self-Service Center

Feature นี้เหมาะมากกับพื้นฐาน IT Support ของผู้พัฒนา

หน้า:

`/it-help`

### Topics

- Windows Basic
- Printer
- Network
- Wi-Fi
- Email
- Password
- Microsoft 365 / Google Workspace (ตามที่บริษัทใช้)
- VPN
- Shared Folder
- Browser
- Software Request

### Example Article

```text
ปัญหา: Printer พิมพ์ไม่ได้

ตรวจสอบ:
1. Printer เปิดอยู่หรือไม่
2. Computer ต่อ Network หรือไม่
3. Printer ถูกเลือกถูกเครื่องหรือไม่
4. มี Paper Jam หรือไม่
5. ตรวจสอบ Queue
6. หากยังไม่ได้ → ติดต่อ IT
```

ไม่ควรใส่ Password, API Key, Network Secret หรือ Security Bypass ลงในบทความ

---

# 18. Contact Directory

หน้า:

`/contacts`

Quick contact:

- HR
- IT
- Security
- Reception
- Procurement
- Marketing
- Sales
- Admin

ตัวอย่าง:

```text
ฝ่ายทรัพยากรบุคคล
โทร: Internal Extension
เรื่อง: ฝึกงาน / เอกสาร / บุคลากร
```

ข้อมูลติดต่อควรแก้ไขได้จาก Admin

---

# 19. Useful Links

หน้า:

`/links`

รวมลิงก์:

- Website บริษัท
- Email
- Internal systems
- Google Drive / SharePoint (ถ้ามีและได้รับอนุญาต)
- HR systems
- IT request system
- Learning platform
- Map

รองรับการแบ่ง category และกำหนดว่าใครเห็นลิงก์ใด

---

# 20. Emergency & Safety

หน้า:

`/emergency`

แสดงแบบเด่นชัด:

- เบอร์ฉุกเฉินภายใน
- Security
- Reception
- จุดรวมพล
- วิธีแจ้งอุบัติเหตุ
- วิธีแจ้งเหตุไฟไหม้
- วิธีอพยพ
- โรงพยาบาล/สถานพยาบาลใกล้บริษัท ถ้าบริษัทอนุมัติข้อมูล

**ข้อมูลจริงต้องได้รับจากฝ่ายที่รับผิดชอบก่อนเผยแพร่**

---

# 21. Feedback System

ให้นักศึกษาฝึกงานและพนักงานใหม่ส่ง feedback ได้

ตัวอย่าง:

```text
วันนี้หาข้อมูลอะไรไม่เจอ?
ข้อมูลไหนควรเพิ่ม?
คู่มือข้อไหนไม่ชัด?
มีปัญหาอะไรในวันแรก?
```

Admin dashboard:

- จำนวน feedback
- Category
- Status
- Resolved / Pending

---

# 22. Onboarding Checklist

Feature แนะนำเพิ่มเติมที่ควรทำเป็น MVP+

ตัวอย่างสำหรับ Intern:

```text
[ ] อ่านกฎระเบียบ
[ ] รู้จัก Mentor
[ ] รู้ตำแหน่ง HR
[ ] รู้ตำแหน่ง IT
[ ] รู้ทางไปห้องน้ำ
[ ] รู้จุด Parking
[ ] Login Email แล้ว
[ ] ทดสอบ Internet
[ ] ทดสอบ Printer
[ ] อ่าน Security Guideline
```

ระบบสามารถเก็บ progress ได้

---

# 23. Notifications

MVP ไม่ต้องทำ Push Notification เต็มรูปแบบ

เริ่มจาก:

- notification center ในเว็บ
- unread count
- notification เมื่อมีประกาศสำคัญ
- notification เมื่อ admin เปลี่ยนแปลงข้อมูลที่เกี่ยวข้อง

Phase ถัดไปค่อยพิจารณา Email / LINE / Microsoft Teams ตาม policy ของบริษัท

---

# 24. Admin Dashboard

หน้า:

`/admin`

Cards:

- Total Employees
- Active Interns
- Upcoming Interns
- Departments
- Announcements
- Pending Feedback
- Knowledge Articles

Charts:

- Intern by University
- Intern by Department
- Intern by Batch
- Project by Technology

---

# 25. Recommended Tech Stack

เลือก Stack ที่เหมาะกับความรู้ Full Stack ของผู้พัฒนาและง่ายต่อการนำเสนอ

## Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- Zod หรือ Yup
- TanStack Query (recommended)
- Lucide React / Heroicons

## Backend

- Node.js
- Express.js
- REST API
- JWT + HttpOnly Cookie หรือ Secure Session
- bcrypt/Argon2
- Multer หรือ Upload middleware
- Zod/Joi validation
- Helmet
- CORS
- express-rate-limit

## Database

แนะนำ:

**MongoDB + Mongoose**

เหตุผล:

- พัฒนาง่าย
- เหมาะกับ Content ที่มีหลายประเภท
- ทำ CRUD ง่าย
- ผู้พัฒนามีประสบการณ์กับ MongoDB อยู่แล้ว

## Storage

Development:

```text
local uploads/
```

Production แนะนำ:

- Cloudinary / S3-compatible storage / บริษัทอนุมัติ storage

ไม่ควรเก็บไฟล์ขนาดใหญ่ทั้งหมดใน MongoDB

---

# 26. Architecture

```text
Browser
   |
   v
React + Vite
   |
   | HTTPS REST API
   v
Express API
   |
   +---- Authentication
   +---- Authorization
   +---- Validation
   +---- Business Logic
   +---- File Upload
   |
   v
MongoDB

Optional:
   |
   +---- Object Storage
   +---- Email Service
   +---- Map Service
```

---

# 27. Suggested Project Structure

```text
fti-welcome-hub/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── interns/
│   │   │   ├── departments/
│   │   │   ├── organization/
│   │   │   ├── policies/
│   │   │   ├── faq/
│   │   │   ├── announcements/
│   │   │   ├── projects/
│   │   │   ├── it-help/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── router/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── uploads/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── docs/
│   ├── ERD.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .env.example
├── README.md
└── package.json
```

---

# 28. Database Design

## 28.1 User

```js
{
  _id,
  username,
  email,
  passwordHash,
  role,
  employeeId,
  internId,
  isActive,
  lastLoginAt,
  createdAt,
  updatedAt
}
```

## 28.2 Employee

```js
{
  _id,
  employeeCode,
  firstName,
  lastName,
  nickname,
  position,
  departmentId,
  managerId,
  profileImage,
  workEmail,
  extension,
  officeLocation,
  bio,
  skills,
  isPublished,
  createdAt,
  updatedAt
}
```

## 28.3 Intern

```js
{
  _id,
  firstName,
  lastName,
  nickname,
  university,
  faculty,
  major,
  year,
  age,
  departmentId,
  mentorId,
  batchId,
  startDate,
  endDate,
  profileImage,
  shortBio,
  projectTitle,
  status,
  isPublished,
  privacyConsent,
  createdAt,
  updatedAt
}
```

## 28.4 Department

```js
{
  _id,
  name,
  code,
  description,
  managerId,
  location,
  extension,
  isActive,
  createdAt,
  updatedAt
}
```

## 28.5 InternBatch

```js
{
  _id,
  code,
  title,
  year,
  sequence,
  startDate,
  endDate,
  description,
  groupPhoto,
  status,
  createdAt,
  updatedAt
}
```

## 28.6 Announcement

```js
{
  _id,
  title,
  summary,
  content,
  coverImage,
  category,
  priority,
  targetRoles,
  publishAt,
  expireAt,
  isPinned,
  status,
  authorId,
  createdAt,
  updatedAt
}
```

## 28.7 Policy

```js
{
  _id,
  title,
  summary,
  content,
  category,
  version,
  effectiveDate,
  attachmentUrl,
  status,
  updatedBy,
  createdAt,
  updatedAt
}
```

## 28.8 FAQ

```js
{
  _id,
  question,
  answer,
  category,
  tags,
  sortOrder,
  isPublished,
  createdAt,
  updatedAt
}
```

## 28.9 KnowledgeArticle

```js
{
  _id,
  title,
  slug,
  category,
  content,
  coverImage,
  tags,
  targetRoles,
  authorId,
  status,
  createdAt,
  updatedAt
}
```

## 28.10 Project

```js
{
  _id,
  title,
  summary,
  description,
  internIds,
  mentorId,
  departmentId,
  techStack,
  screenshotUrls,
  repositoryUrl,
  demoUrl,
  isPublished,
  createdAt,
  updatedAt
}
```

## 28.11 Feedback

```js
{
  _id,
  userId,
  category,
  message,
  rating,
  status,
  adminNote,
  createdAt,
  updatedAt
}
```

---

# 29. API Design

Base URL:

```text
/api/v1
```

## Auth

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
PATCH  /auth/password
```

## Employees

```text
GET    /employees
GET    /employees/:id
POST   /employees
PATCH  /employees/:id
DELETE /employees/:id
```

## Interns

```text
GET    /interns
GET    /interns/:id
POST   /interns
PATCH  /interns/:id
DELETE /interns/:id
```

## Departments

```text
GET    /departments
GET    /departments/:id
POST   /departments
PATCH  /departments/:id
DELETE /departments/:id
```

## Batches

```text
GET    /intern-batches
GET    /intern-batches/:id
POST   /intern-batches
PATCH  /intern-batches/:id
DELETE /intern-batches/:id
```

## Organization

```text
GET    /organization/tree
```

## Announcements

```text
GET    /announcements
GET    /announcements/:id
POST   /announcements
PATCH  /announcements/:id
DELETE /announcements/:id
```

## Policies

```text
GET    /policies
GET    /policies/:id
POST   /policies
PATCH  /policies/:id
DELETE /policies/:id
```

## FAQ

```text
GET    /faq
POST   /faq
PATCH  /faq/:id
DELETE /faq/:id
```

## Projects

```text
GET    /projects
GET    /projects/:id
POST   /projects
PATCH  /projects/:id
DELETE /projects/:id
```

## Feedback

```text
POST   /feedback
GET    /feedback
PATCH  /feedback/:id/status
```

## Company Settings

```text
GET    /company
PATCH  /company
```

---

# 30. Query / Filter Design

ตัวอย่าง:

```http
GET /api/v1/interns?search=krit&department=IT&batch=2026-01&status=active&page=1&limit=20
```

Backend ต้องรองรับ:

- Pagination
- Search
- Sorting
- Filtering

Response มาตรฐาน:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 31. Authorization Matrix

| Feature | Super Admin | Admin | Editor | Staff | Intern |
|---|---:|---:|---:|---:|---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Employees | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Employees | ✅ | ✅ | Limited | ❌ | ❌ |
| View Interns | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Interns | ✅ | ✅ | Limited | ❌ | Own profile |
| Manage Departments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Organization Chart | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Policies | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage FAQ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Announcements | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Feedback | ✅ | ✅ | ✅ | ❌ | Submit |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

# 32. Security Requirements

## Mandatory

- HTTPS in production
- Password hashing
- HttpOnly cookie for auth token/session when feasible
- CSRF protection when cookie-based auth is used
- XSS-safe rendering
- MongoDB query validation
- Rate limiting
- Helmet
- CORS restricted to known frontend origin
- File upload MIME/type validation
- File size limits
- Filename sanitization
- Image processing / resizing
- No unrestricted file upload
- No exposed `.env`
- `.env.example` only contains placeholders
- Backend authorization on every admin endpoint
- Audit log for important admin changes

## Secrets

Never commit:

```text
JWT_SECRET
MONGO_URI
SMTP_PASSWORD
Cloudinary Secret
API Keys
```

---

# 33. Privacy / PDPA-Oriented Design

ระบบจะมีข้อมูลบุคคล จึงต้องออกแบบแบบ Privacy-by-Design

### Principles

- เก็บข้อมูลเท่าที่จำเป็น
- จำกัดสิทธิ์การเข้าถึง
- ให้เจ้าของข้อมูลทราบว่านำข้อมูลไปใช้เพื่ออะไร
- มีช่องทางแก้ไข/ขอถอนการเผยแพร่ตาม policy ของบริษัท
- มี retention policy
- อย่าแสดงข้อมูลส่วนตัวเกินความจำเป็น
- แยกข้อมูล Public Internal กับข้อมูล Admin-only

### Visibility Levels

```text
public_internal
staff_only
intern_only
admin_only
private
```

ตัวอย่าง:

```text
age            -> staff_only / intern_only ตาม policy
personal_phone -> private
work_email     -> staff_only
home_address   -> admin_only หรือไม่เก็บ
```

**ก่อนใช้งานจริง ต้องให้ HR/ผู้รับผิดชอบของบริษัทตรวจสอบข้อมูลและข้อความเรื่อง Privacy / Consent**

---

# 34. File Upload Policy

รองรับ:

- JPG
- JPEG
- PNG
- WebP
- PDF เฉพาะกรณีที่จำเป็น

Limit เบื้องต้น:

```text
Image <= 5 MB
PDF <= 10 MB
```

Server ต้องตรวจ:

1. extension
2. MIME type
3. file signature/magic bytes เมื่อเหมาะสม
4. size
5. image dimensions

รูป Profile ควร resize เป็นขนาดมาตรฐาน เช่น:

```text
400x400
800x800
```

---

# 35. UI / UX Guideline

## Style

แนะนำแนว:

**Modern Corporate + Friendly + Clean**

### Visual

- สีหลักอ้างอิง Branding ของ FTI เมื่อได้รับ Brand Guideline
- White / Neutral background
- Card UI
- Rounded corners แบบพอดี
- Soft shadow
- Responsive
- Mobile-first

### Typography

รองรับภาษาไทยได้ดี เช่น:

- Noto Sans Thai
- IBM Plex Sans Thai
- Anuphan

เลือกเพียง 1 family เป็นหลักเพื่อให้โหลดเร็ว

---

# 36. Responsive Requirements

รองรับ:

- Mobile
- Tablet
- Laptop
- Desktop

Breakpoints ควรยึด Tailwind defaults หรือกำหนดระบบเดียวทั้งแอป

ทดสอบขั้นต่ำ:

```text
360px
768px
1024px
1440px
```

---

# 37. Accessibility

ต้องมี:

- Semantic HTML
- Keyboard navigation
- Focus state
- Alt text
- Form labels
- Error messages
- Color contrast ที่อ่านได้
- Modal ปิดด้วย Escape

---

# 38. Search

Global Search ควรค้นหา:

- Employee
- Intern
- Department
- FAQ
- Policy
- Announcement
- IT Article
- Project

ตัวอย่าง:

```text
ค้นหา "printer"
↓
พบ
- IT Guide: Printer เบื้องต้น
- FAQ: เครื่องพิมพ์อยู่ตรงไหน
- Contact: IT Support
```

Phase MVP ใช้ MongoDB text search หรือ regex ที่ควบคุมให้เหมาะสม

Phase 2 ค่อยพิจารณา Elasticsearch / Meilisearch / Typesense เมื่อข้อมูลเยอะ

---

# 39. Audit Log

สร้าง collection:

```text
AuditLog
```

Fields:

```js
{
  userId,
  action,
  entity,
  entityId,
  before,
  after,
  ip,
  userAgent,
  createdAt
}
```

บันทึกอย่างน้อยเมื่อ:

- Create user
- Change role
- Delete user
- Edit employee
- Edit intern
- Publish policy
- Publish announcement
- Change company settings

ไม่ควรเก็บ secret/password ใน audit log

---

# 40. Seed Data

ต้องมี script:

```bash
npm run seed
```

Seed อย่างน้อย:

- 1 super admin
- 1 admin
- 1 editor
- 3 departments
- 5 employees (dummy data)
- 6 interns (dummy data)
- 2 intern batches
- 5 FAQ
- 5 IT articles
- 5 announcements
- 5 policies

**ใช้ข้อมูลสมมติเท่านั้นใน Development**

---

# 41. Environment Variables

`.env.example`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/fti_welcome_hub
JWT_SECRET=change_me
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

Production ต้องเปลี่ยนค่าทั้งหมด

---

# 42. Development Scripts

Root:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "install:all": "npm install && npm install --prefix client && npm install --prefix server"
  }
}
```

Server:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/utils/seed.js"
  }
}
```

Client:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

# 43. Development Phases

## Phase 0 — Project Bootstrap

ทำให้:

- client run ได้
- server run ได้
- MongoDB connect ได้
- `/api/health` ทำงาน
- `.env` ทำงาน

Acceptance:

```text
GET /api/health
→ { "success": true }
```

---

## Phase 1 — Authentication

ทำ:

- User model
- Login
- Logout
- Auth middleware
- Role middleware
- `/auth/me`
- Seed admin

Acceptance:

- Login สำเร็จ
- Login ผิดถูก reject
- Protected page เข้าไม่ได้หากไม่ได้ login
- Admin route ถูกป้องกัน

---

## Phase 2 — Layout + Dashboard

ทำ:

- Navbar
- Sidebar
- Mobile menu
- Dashboard
- Profile summary
- Logout

---

## Phase 3 — Employee / Department

ทำ:

- Employee CRUD
- Department CRUD
- Search
- Filter
- Pagination

---

## Phase 4 — Intern / Batch

ทำ:

- Intern CRUD
- Batch CRUD
- Intern detail
- Intern directory
- Batch page
- Image upload

---

## Phase 5 — Organization Chart

ทำ:

- Tree API
- Tree UI
- Search
- Filter
- Employee detail popup

---

## Phase 6 — Newcomer Content

ทำ:

- Getting Started
- Policies
- FAQ
- Contacts
- Company information
- Location/Map

---

## Phase 7 — Announcement / Knowledge

ทำ:

- Announcements
- IT Help
- Knowledge Articles
- Search

---

## Phase 8 — Admin Dashboard

ทำ:

- Statistics
- CRUD tables
- Publish/unpublish
- User management
- Audit logs

---

## Phase 9 — Feedback + Onboarding Checklist

ทำ:

- Feedback
- Checklist
- Progress tracking

---

## Phase 10 — Security / Production Hardening

ทำ:

- Rate limit
- Helmet
- CORS
- File security
- Logging
- Error handling
- Validation
- Audit log
- Backup plan

---

# 44. MVP Scope

หากเวลาฝึกงานจำกัด ให้ทำ MVP แค่:

### MUST HAVE

- Login
- Role
- Dashboard
- Employee Directory
- Intern Directory
- Intern Batch
- Organization Chart
- Company Info
- Map
- Getting Started
- Rules
- FAQ
- Admin CRUD

### NICE TO HAVE

- Announcement
- IT Help
- Search
- Feedback
- Checklist
- Alumni
- Project Showcase

### FUTURE

- Email notification
- LINE/Teams integration
- SSO
- QR Code
- Visitor system
- Helpdesk/Ticket integration
- AI chatbot

---

# 45. Recommended Extra Features

ฟังก์ชันที่แนะนำให้เพิ่มเพื่อให้โปรเจกต์โดดเด่นแต่ยังไม่แตะระบบหลักบริษัท:

## 45.1 QR Welcome Card

สร้าง QR สำหรับ Intern แต่ละคน:

```text
QR → Profile Page
```

ใช้สำหรับแนะนำตัวในการปฐมนิเทศ

ต้องเป็น QR ของข้อมูลที่อนุญาตให้เผยแพร่เท่านั้น

## 45.2 Digital Business / Contact Card

สร้างหน้า Profile สำหรับ employee/intern แล้วมี:

```text
Add to Contacts
Email
Call
Copy Extension
```

## 45.3 "Who Should I Contact?"

ผู้ใช้เลือกปัญหา:

```text
Computer มีปัญหา
↓
IT Support

เอกสารฝึกงาน
↓
HR

เรื่องห้องประชุม
↓
Admin
```

Feature นี้ใช้งานจริงได้ดีมากสำหรับคนใหม่

## 45.4 Onboarding Progress

```text
Onboarding 70%

████████░░

7 / 10 tasks completed
```

## 45.5 Intern Knowledge Transfer

รุ่นก่อน → รุ่นใหม่

```text
สิ่งที่ควรรู้
สิ่งที่ไม่ควรพลาด
ปัญหาที่เคยเจอ
คำแนะนำ
```

ต้องผ่านการ review ก่อนเผยแพร่

---

# 46. Future AI Feature

ยังไม่ควรทำใน MVP แต่ระบบควรเตรียมโครงสร้างให้เพิ่ม AI ได้

ตัวอย่าง:

```text
AI Assistant
"Printer ห้อง 2 พิมพ์ไม่ได้ ต้องทำอย่างไร?"
```

AI สามารถค้นจาก:

- FAQ
- IT Knowledge
- Policies
- Contacts
- Getting Started

แนวทาง Phase 3:

```text
User
 ↓
Chat UI
 ↓
Backend AI API
 ↓
RAG/Search
 ↓
Approved company documents
```

**AI ห้ามตอบข้อมูลภายในจากเอกสารที่ user ไม่มีสิทธิ์เข้าถึง**

---

# 47. Error Handling

Backend ต้องมี global error middleware

ประเภท:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

Frontend ต้องมี:

- Loading state
- Empty state
- Error state
- Retry button
- Toast notification

ห้ามปล่อยหน้าขาวเมื่อ API error

---

# 48. Logging

Development:

- console log ได้

Production:

- ใช้ structured logging
- แยก error log
- ห้าม log password/token

---

# 49. Testing

ขั้นต่ำ:

## Backend

- Login test
- Auth middleware
- Role middleware
- Employee CRUD
- Intern CRUD
- Validation

## Frontend

- Login flow
- Protected route
- Search/filter
- Form validation

## Manual QA

ทดสอบ:

- Chrome
- Edge
- Mobile viewport
- Desktop

---

# 50. Deployment Recommendation

## Option A — Simple

```text
Frontend → Vercel / Netlify
Backend  → Render / Railway / VPS
Database → MongoDB Atlas
Storage  → Cloudinary/S3
```

## Option B — Company Internal

```text
Internal Server / VM
   ├── Nginx
   ├── Frontend
   ├── Node API
   └── MongoDB
```

**ก่อนนำขึ้นใช้งานจริงต้องให้บริษัทอนุมัติ Infrastructure และ Security Policy**

---

# 51. Backup Strategy

MongoDB:

- Daily backup
- Retention ตาม policy
- Test restore เป็นระยะ

Uploaded files:

- backup หรือใช้ durable object storage

ห้ามพึ่ง backup ที่ไม่มีการทดสอบ restore

---

# 52. Git Workflow

Branches:

```text
main
    ↓
develop
    ↓
feature/auth
feature/intern
feature/employees
feature/admin
```

Commit examples:

```text
feat: add intern directory
feat: add authentication middleware
fix: validate employee upload
refactor: split admin routes
chore: add seed data
```

ห้าม commit:

- `.env`
- upload ที่มีข้อมูลจริง
- password
- API secret
- private company documents

---

# 53. AI Coding Assistant Rules

ส่วนนี้สำคัญที่สุดสำหรับใช้กับ Cursor / Claude Code / Codex / GitHub Copilot / AI Coding Agent

## Rule 1 — ทำทีละ Phase

ห้ามสร้างระบบทั้งหมดในครั้งเดียว

ให้ทำตามลำดับ:

```text
Phase 0
→ Phase 1
→ Phase 2
→ ...
```

แต่ละ Phase ต้อง build/run/test ผ่านก่อนจึงไป Phase ต่อไป

## Rule 2 — อ่านโครงสร้างเดิมก่อนแก้ไฟล์

ก่อนแก้ไขไฟล์ใด:

1. อ่านไฟล์
2. เข้าใจ dependency
3. ตรวจ import/export
4. ตรวจ route ที่เกี่ยวข้อง
5. ค่อยแก้

ห้ามเขียนทับไฟล์ทั้งไฟล์โดยไม่มีเหตุผล

## Rule 3 — Preserve Existing Working Features

ถ้า feature เดิมทำงานอยู่ ห้ามทำลายเพียงเพื่อเพิ่ม feature ใหม่

ทุกการแก้ต้องตรวจ regression

## Rule 4 — Backend First for Data Features

สำหรับ CRUD Feature ให้ทำ:

```text
Model
→ Validator
→ Controller
→ Service
→ Route
→ Middleware
→ API Test
→ Frontend
```

## Rule 5 — No Secret Hardcoding

AI ห้ามสร้าง:

```text
const JWT_SECRET = "1234"
```

ให้ใช้ env เท่านั้น

## Rule 6 — No Fake Real Employee Data

ข้อมูลพนักงานจริงต้องได้รับจากบริษัท

ใน development ให้ใช้ dummy data เท่านั้น

## Rule 7 — No Company Confidential Data

ห้ามสร้างข้อมูลสมมติที่ดูเหมือนข้อมูลลับจริง เช่น:

- password ภายใน
- IP ภายใน
- network credentials
- API key
- access code
- system architecture ที่เป็นความลับ

## Rule 8 — Validation Everywhere

Client validation ไม่เพียงพอ

ต้อง validate ฝั่ง server เสมอ

## Rule 9 — Reusable Components

อย่าสร้างหน้าใหม่โดย copy component เดิมยาว ๆ

ตัวอย่าง reusable components:

```text
DataTable
SearchBar
FilterSelect
Pagination
Modal
ConfirmDialog
FormInput
ImageUpload
Avatar
EmptyState
LoadingState
ErrorState
RoleGuard
```

## Rule 10 — Keep API Consistent

ใช้รูปแบบ response เดียวกันทุก endpoint

---

# 54. Prompt สำหรับเริ่มต้นกับ AI Coding Agent

ใช้ Prompt นี้เป็นข้อความแรกหลังวางเอกสารนี้ไว้ใน project root:

```text
You are the lead full-stack engineer for this project.

Read the entire FTI_Newcomer_Portal_Technical_Spec.md before writing code.

Project goal:
Build an internal company onboarding and information portal for Function International (FTI), focused on interns and new employees.

Tech stack:
- React + Vite
- Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- REST API
- Secure authentication with HttpOnly cookies where feasible

Strict rules:
1. Follow the specification as the source of truth.
2. Work one development phase at a time.
3. Do not implement all features in one step.
4. Before changing any existing file, inspect its current content and dependencies.
5. Do not break existing working features.
6. Use dummy data for development. Never invent real employee credentials or confidential company data.
7. Never hardcode secrets.
8. Validate user input on the backend.
9. Enforce authorization on the backend, not only in React.
10. Keep components reusable and code modular.
11. Add proper loading, empty, error, and success states.
12. Use responsive design.
13. Explain important architecture decisions briefly.
14. After each implementation phase, provide:
   - files created/changed
   - commands to run
   - test steps
   - known limitations
   - next recommended phase

Start with Phase 0 only.
Do not continue to Phase 1 until Phase 0 is complete and verified.
```

---

# 55. Acceptance Criteria for the Final Project

โปรเจกต์ถือว่าใช้งานได้เมื่อ:

### Authentication

- Login/Logout ทำงาน
- Role-based access ทำงาน
- Unauthorized user เข้า Admin ไม่ได้

### Employees

- เพิ่ม/แก้ไข/ลบได้โดย role ที่กำหนด
- Search/filter ได้

### Interns

- CRUD ได้
- Batch ได้
- Profile photo ได้
- Search/filter ได้

### Organization

- แสดงโครงสร้างองค์กรแบบ interactive

### Newcomer

- คู่มือวันแรกใช้งานได้
- FAQ ใช้งานได้
- Policies ใช้งานได้

### Map

- แสดงตำแหน่งบริษัท
- มีข้อมูลที่อยู่และจุดสำคัญที่ได้รับอนุญาต

### Admin

- จัดการ content ได้
- ดูสถิติได้

### Security

- Password ไม่ถูกเก็บ plaintext
- Secret อยู่ใน environment variables
- API มี authorization
- File upload มี validation

### UX

- Mobile responsive
- ไม่เกิด blank screen เมื่อ API error
- Loading/Empty/Error state ครบ

---

# 56. Suggested Demo Flow for Internship Presentation

ลำดับ Demo ที่แนะนำ:

```text
1. Login
2. Dashboard
3. "ฉันเป็นนักศึกษาฝึกงานใหม่"
4. เปิด Getting Started
5. ดูแผนที่บริษัท
6. ดู Organization Chart
7. ค้นหา IT Support
8. ดู Employee Directory
9. ดู Intern รุ่นปัจจุบัน
10. เปิด Intern Alumni
11. เปิด Project Showcase
12. Login เป็น Admin
13. เพิ่ม Intern ใหม่
14. เพิ่ม Announcement
15. แก้ไข FAQ
16. ดู Dashboard Statistics
17. ดู Audit Log
```

นี่จะช่วยให้เห็นทั้ง:

- Frontend
- Backend
- Database
- Authentication
- Authorization
- CRUD
- Search
- File Upload
- Dashboard
- IT Support Knowledge
- Security

---

# 57. Project Positioning for Internship Report

ชื่อหัวข้อทางวิชาการที่แนะนำ:

**การพัฒนาระบบเว็บสารสนเทศสำหรับการต้อนรับและสนับสนุนนักศึกษาฝึกงานและพนักงานใหม่ภายในองค์กร กรณีศึกษา บริษัท ฟังก์ชั่น อินเตอร์เนชั่นแนล จำกัด (มหาชน)**

ภาษาอังกฤษ:

**Development of an Internal Web Information and Onboarding System for Interns and New Employees: A Case Study of Function International Public Company Limited**

### Problem Statement

ข้อมูลที่นักศึกษาฝึกงานหรือพนักงานใหม่ต้องทราบ เช่น สถานที่ทำงาน บุคลากร แผนก กฎระเบียบ ช่องทางการติดต่อ และข้อมูลสำหรับวันแรก อาจกระจายอยู่หลายแหล่ง ทำให้ต้องสอบถามบุคลากรหลายฝ่ายและใช้เวลาในการปรับตัว

### Proposed Solution

พัฒนาระบบเว็บภายในที่รวบรวมข้อมูลสำคัญไว้ในศูนย์กลาง พร้อมระบบ Login, Employee Directory, Intern Directory, Organization Chart, Map, FAQ, Policy, IT Help และ Admin Content Management

### Expected Benefits

- ลดเวลาการค้นหาข้อมูล
- ลดคำถามซ้ำ ๆ ต่อ HR / IT / Admin
- ช่วยให้พนักงานใหม่ปรับตัวเร็วขึ้น
- เก็บความรู้จากนักศึกษาฝึกงานรุ่นก่อน
- เพิ่มความเป็นระบบของ Onboarding
- เป็นฐานความรู้ภายในที่ต่อยอดได้

---

# 58. Final Development Recommendation

เพื่อให้งานเสร็จทันการฝึกงาน **อย่าทำทุก Feature ตั้งแต่แรก**

แนะนำลำดับความสำคัญ:

```text
MVP
├── Login
├── Dashboard
├── Employee Directory
├── Intern Directory
├── Intern Batch
├── Organization Chart
├── Company Info
├── Map
├── Getting Started
├── Rules
├── FAQ
└── Admin CRUD

Then
├── Announcement
├── IT Help
├── Search
├── Feedback
└── Onboarding Checklist

Then optional
├── Alumni
├── Project Showcase
├── QR Profile
└── AI Assistant
```

เป้าหมายคือทำให้ MVP ใช้งานได้จริงก่อน แล้วค่อยเพิ่ม Feature เพื่อเพิ่มคะแนนด้าน Full Stack, Security และ IT Support

---

# 59. Source References

ข้อมูลบริษัทสำหรับ seed content และบริบทโครงการควรตรวจสอบจากเว็บไซต์ทางการของ FTI ก่อนเผยแพร่ทุกครั้ง:

- Function International homepage: https://www.functioninter.co.th/th/home
- About FTI: https://www.functioninter.co.th/th/about-us
- Company milestone: https://www.functioninter.co.th/th/about-us/company-milestone
- Vision, mission and quality policy: https://www.functioninter.co.th/th/about-us/vision-slogan-mission-and-quality-policy
- Contact: https://www.functioninter.co.th/th/contact-us
- Careers: https://www.functioninter.co.th/th/career/available-position

---

# 60. Important Disclaimer for Internal Deployment

เอกสารนี้เป็น Technical Specification สำหรับพัฒนา Prototype/MVP ของระบบภายใน ไม่ใช่เอกสารยืนยันนโยบาย HR, PDPA, Information Security หรือ Company Policy ของ FTI

ก่อนนำข้อมูลจริงขึ้นระบบ ต้องได้รับการอนุมัติจากผู้รับผิดชอบที่เกี่ยวข้อง โดยเฉพาะ:

- HR
- IT / Information Security
- ผู้ดูแลข้อมูลส่วนบุคคล
- ผู้อนุมัติข้อมูลพนักงาน
- ผู้อนุมัติเนื้อหา Company Policy

ไม่ควรนำข้อมูลจากเว็บไซต์สาธารณะมาสร้างเป็นฐานข้อมูลพนักงานภายในโดยอัตโนมัติ

---

**Document Version:** 1.0

**Purpose:** AI-assisted full-stack development specification

**Primary Audience:** นักศึกษาฝึกงาน / พนักงานใหม่ / HR / IT / Admin
