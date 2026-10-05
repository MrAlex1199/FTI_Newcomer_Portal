import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';

export default function WritingGuideModal({ open, onClose, onInsertTemplate }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('sop');

  const templates = {
    sop: `## 📋 วัตถุประสงค์ (Purpose)
อธิบายขอบเขตและเป้าหมายของคู่มือนี้ตามมาตรฐาน ISO 20000 / ITIL

> [!NOTE]
> ข้อกำหนดเบื้องต้น: ผู้ปฏิบัติงานต้องมีสิทธิ์ในระบบระดับ User หรือ Technician

---

## 🛠️ ขั้นตอนการปฏิบัติงาน (Standard Operating Procedure)

### 1️⃣ ขั้นตอนที่ 1: ตรวจสอบและลงทะเบียนคำขอ
- ผู้ใช้แจ้งปัญหาผ่านระบบ Helpdesk หรือโทรต่อสาย IT
- ระบุหมายเลขเครื่อง (Asset Tag) เช่น \`FTI-NB-2024-001\`
- ระบุอาการผิดปกติอย่างชัดเจน

### 2️⃣ ขั้นตอนที่ 2: การวินิจฉัยทางเทคนิค (Initial Diagnosis)
- ช่างไอทีเข้าตรวจสอบเบื้องต้น หรือทำการ Remote ตรวจเช็ค
- ตรวจสอบประวัติการซ่อมบำรุงในฐานข้อมูล

> [!TIP]
> หากสามารถแก้ไขทางซอฟต์แวร์ได้ ให้ดำเนินการทันทีและปิดคำร้อง

### 3️⃣ ขั้นตอนที่ 3: การส่งซ่อม / ดำเนินการเปลี่ยนอะไหล่
- กรณีต้องเปลี่ยนอะไหล่ ให้ผู้ใช้เปิด **ใบเบิกอุปกรณ์ไอที (Form IT-REQ-01)**
- รอการอนุมัติจากผู้จัดการฝ่าย (Department Manager) ภายใน 24 ชม.

### 4️⃣ ขั้นตอนที่ 4: การส่งมอบและตรวจรับ (Handover & Sign-off)
- ส่งมอบเครื่องคืนให้ผู้ใช้พร้อมให้ทดสอบการทำงาน
- ผู้ใช้ลงนามตรวจรับในระบบ และปิดงานสมบูรณ์ 🟢

---

## 📞 ช่องทางการติดต่อเร่งด่วน
หากเกิดเหตุฉุกเฉินติดต่อเบอร์ต่อภายใน **#4102** หรือ Helpdesk Counter ชั้น 3`,

    table: `### 📊 เมทริกซ์การกำหนดสิทธิ์และความรับผิดชอบ (RACI Matrix)

| หน้าที่งาน (Role) | ผู้รับผิดชอบ (Responsible) | ผู้มีอำนาจอนุมัติ (Accountable) | ผู้ให้คำปรึกษา (Consulted) | ผู้รับทราบข้อมูล (Informed) |
| :--- | :--- | :--- | :--- | :--- |
| แจ้งเครื่องเสีย | ผู้ใช้งาน (User) | หัวหน้าแผนก | Helpdesk IT | ฝ่ายบุคคล (HR) |
| ตรวจสอบสภาพเครื่อง | ช่างเทคนิค IT | IT Supervisor | หัวหน้างานผู้แจ้ง | ผู้ใช้งาน |
| อนุมัติใบเบิกอุปกรณ์ | - | ผู้อำนวยการฝ่าย | ฝ่ายจัดซื้อ | แผนกบัญชี |
| ส่งมอบและบันทึกทรัพย์สิน | เจ้าหน้าที่ IT Asset | IT Manager | - | ผู้ใช้งาน (Sign-off) |`,

    keyboard: `### ⌨️ คีย์ลัดและคำสั่งที่ใช้บ่อย (Common Shortcuts & Commands)

1. กด <kbd>Windows</kbd> + <kbd>R</kbd> เพื่อเปิดหน้าต่าง Run
2. พิมพ์ \`cmd\` แล้วกด <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd> เพื่อเปิด Administrator Mode
3. คำสั่งล้างแคช DNS:
\`\`\`bash
ipconfig /flushdns
\`\`\`
4. รีสตาร์ทการเชื่อมต่อเครือข่าย:
\`\`\`bash
netsh int ip reset
\`\`\``,

    callouts: `> [!NOTE]
> ข้อความบันทึกทั่วไป: ข้อมูลประกอบเพื่อความเข้าใจที่ถูกต้อง

> [!TIP]
> เคล็ดลับการใช้งาน: แนะนำวิธีทำที่เร็วกว่า หรือการตั้งค่าแนะนำ

> [!IMPORTANT]
> ข้อมูลสำคัญมาก: ต้องปฏิบัติตามอย่างเคร่งครัดตามข้อกำหนดความปลอดภัย

> [!WARNING]
> ข้อควรระวัง: การดำเนินการนี้อาจทำให้ข้อมูลสูญหาย หรือระบบหยุดทำงานชั่วคราว

> [!CAUTION]
> อันตรายระดับสูง: ห้ามดำเนินการหากไม่ได้รับความยินยอมจาก IT Security`,
  };

  const tabs = [
    { id: 'sop', label: '📋 เทมเพลต SOP มาตรฐาน', icon: '📋' },
    { id: 'table', label: '📊 ตาราง & เมทริกซ์', icon: '📊' },
    { id: 'keyboard', label: '⌨️ ปุ่มลัด & คำสั่ง', icon: '⌨️' },
    { id: 'callouts', label: '💡 กล่องข้อความ (Callouts)', icon: '💡' },
  ];

  const handleInsert = (content) => {
    onInsertTemplate(content);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📖</span>
          <div>
            <h3 className="text-base font-bold text-slate-800">คู่มือและเทมเพลตการเขียนบทความ (Writing Guide & Templates)</h3>
            <p className="text-xs text-slate-500 font-normal">เทมเพลตมาตรฐาน ISO 20000 / ITIL พร้อมแทรกลงในบทความได้ทันทีใน 1 คลิก</p>
          </div>
        </div>
      }
      size="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              type="button"
              onClick={() => handleInsert(templates[activeTab])}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <span>📥</span>
              <span>แทรกเทมเพลตนี้ลงในเนื้อหา</span>
            </button>
          </div>

          <pre className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-3.5 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-blue-100">
            {templates[activeTab]}
          </pre>
        </div>

        {/* Obsidian Markdown Hints */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
          <p className="font-bold flex items-center gap-1.5">
            <span>💡</span>
            <span>เคล็ดลับระบบความรู้ FTI Obsidian:</span>
          </p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-blue-800">
            <li>สร้างการเชื่อมโยงสองทาง (Graph Link) โดยพิมพ์ <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-semibold">[[slug-ของบทความ]]</code> หรือใส่ลิงก์ปกติ</li>
            <li>สามารถลากไฟล์รูปภาพมาวาง (Drag & Drop) หรือกด <kbd className="bg-white px-1 py-0.5 rounded shadow-2xs font-mono">Ctrl</kbd> + <kbd className="bg-white px-1 py-0.5 rounded shadow-2xs font-mono">V</kbd> เพื่อแทรกรูปได้โดยตรง</li>
            <li>ใช้แท็ก <code className="bg-white/80 px-1 py-0.5 rounded font-mono">&lt;kbd&gt;ปุ่ม&lt;/kbd&gt;</code> เพื่อแสดงปุ่มคีย์บอร์ดที่สวยงาม</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
