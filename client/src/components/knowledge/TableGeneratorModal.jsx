import { useState } from 'react';
import Modal from '../common/Modal.jsx';

export default function TableGeneratorModal({ open, onClose, onInsertTable }) {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [align, setAlign] = useState('left'); // 'left' | 'center' | 'right'
  const [preset, setPreset] = useState('custom');

  const presets = {
    custom: {
      cols: 3,
      rows: 3,
      headers: ['หัวข้อที่ 1', 'หัวข้อที่ 2', 'รายละเอียด'],
    },
    sla: {
      cols: 3,
      rows: 4,
      headers: ['ประเภทงานซ่อม / บริการ', 'ระยะเวลามาตรฐาน (SLA)', 'ผู้รับผิดชอบหลัก'],
      sampleRows: [
        ['เครื่องเปิดไม่ติด / จอฟ้า', 'ภายใน 2 ชั่วโมง', 'IT Support On-site'],
        ['ติดตั้งซอฟต์แวร์ลิขสิทธิ์', 'ภายใน 4 ชั่วโมง', 'Helpdesk Tier 1'],
        ['เปลี่ยนอุปกรณ์ฮาร์ดแวร์ / RAM', 'ภายใน 1 วันทำการ', 'IT Hardware Lead'],
        ['สั่งซื้ออุปกรณ์ใหม่ทดแทน', 'ภายใน 3-5 วันทำการ', 'Procurement & IT Head'],
      ],
    },
    raci: {
      cols: 5,
      rows: 4,
      headers: ['ขั้นตอน (Task)', 'R (ทำ)', 'A (อนุมัติ)', 'C (ปรึกษา)', 'I (แจ้ง)'],
      sampleRows: [
        ['แจ้งเรื่องเครื่องเสีย', 'ผู้ใช้งาน', 'หัวหน้าแผนก', 'IT Helpdesk', 'HR'],
        ['ตรวจเช็คสภาพเครื่อง', 'IT Tech', 'IT Supervisor', '-', 'ผู้ใช้งาน'],
        ['อนุมัติเปลี่ยนอะไหล่', '-', 'Department Head', 'จัดซื้อ', 'ผู้ใช้งาน'],
        ['ตรวจรับเครื่องซ่อมเสร็จ', 'ผู้ใช้งาน', 'IT Tech', '-', 'Asset Management'],
      ],
    },
    spec: {
      cols: 3,
      rows: 4,
      headers: ['ชิ้นส่วน / สเปค', 'รายละเอียดอุปกรณ์', 'สถานะการรับประกัน'],
      sampleRows: [
        ['Processor (CPU)', 'Intel Core i7-13700H', 'อยู่ในประกันศูนย์ (Valid)'],
        ['Memory (RAM)', '16GB DDR5 5200MHz', 'อยู่ในประกันศูนย์ (Valid)'],
        ['Storage (SSD)', '512GB NVMe M.2 Gen4', 'อยู่ในประกันศูนย์ (Valid)'],
        ['Operating System', 'Windows 11 Pro 64-bit (FTI Image)', 'FTI Corporate Volume'],
      ],
    },
  };

  const handleSelectPreset = (key) => {
    setPreset(key);
    const p = presets[key];
    if (p) {
      setCols(p.cols);
      setRows(p.rows);
    }
  };

  const generateMarkdownTable = () => {
    const selectedPreset = presets[preset];
    const alignDivider = align === 'center' ? ':---:' : align === 'right' ? '---:' : ':---';

    let headers = [];
    if (selectedPreset && selectedPreset.headers && selectedPreset.headers.length === cols) {
      headers = selectedPreset.headers;
    } else {
      headers = Array.from({ length: cols }, (_, i) => `คอลัมน์ ${i + 1}`);
    }

    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${Array(cols).fill(alignDivider).join(' | ')} |`;

    const dataLines = [];
    for (let r = 0; r < rows; r++) {
      if (selectedPreset && selectedPreset.sampleRows && selectedPreset.sampleRows[r]) {
        dataLines.push(`| ${selectedPreset.sampleRows[r].slice(0, cols).join(' | ')} |`);
      } else {
        const rowCells = Array.from({ length: cols }, (_, c) => `แถว ${r + 1} ช่อง ${c + 1}`);
        dataLines.push(`| ${rowCells.join(' | ')} |`);
      }
    }

    return `\n${headerLine}\n${separatorLine}\n${dataLines.join('\n')}\n`;
  };

  const handleInsert = () => {
    const tableMd = generateMarkdownTable();
    onInsertTable(tableMd);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="text-base font-bold text-slate-800">สร้างตาราง Markdown (Table Generator)</span>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            เลือกรูปแบบตารางสำเร็จรูป (Preset)
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectPreset('custom')}
              className={`rounded-xl border p-2 text-left transition ${
                preset === 'custom'
                  ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              📝 ตารางทั่วไป (Custom)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('sla')}
              className={`rounded-xl border p-2 text-left transition ${
                preset === 'sla'
                  ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              ⏱️ กำหนดเวลา SLA
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('raci')}
              className={`rounded-xl border p-2 text-left transition ${
                preset === 'raci'
                  ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              👥 เมทริกซ์ RACI
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('spec')}
              className={`rounded-xl border p-2 text-left transition ${
                preset === 'spec'
                  ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              💻 สเปคเครื่อง & อุปกรณ์
            </button>
          </div>
        </div>

        {/* Rows, Columns & Alignment */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              จำนวนคอลัมน์ (Cols)
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={cols}
              onChange={(e) => {
                setPreset('custom');
                setCols(Math.max(1, Math.min(8, Number(e.target.value) || 1)));
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              จำนวนแถว (Rows)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={rows}
              onChange={(e) => {
                setPreset('custom');
                setRows(Math.max(1, Math.min(15, Number(e.target.value) || 1)));
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              จัดชิดขอบ (Align)
            </label>
            <select
              value={align}
              onChange={(e) => setAlign(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="left">ชิดซ้าย (Left)</option>
              <option value="center">กึ่งกลาง (Center)</option>
              <option value="right">ชิดขวา (Right)</option>
            </select>
          </div>
        </div>

        {/* Preview of Generated Markdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            ตัวอย่างโค้ด Markdown ที่จะแทรก
          </label>
          <pre className="max-h-36 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10px] leading-relaxed text-slate-700">
            {generateMarkdownTable().trim()}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <span>📥</span>
            <span>แทรกตารางลงในบทความ</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
