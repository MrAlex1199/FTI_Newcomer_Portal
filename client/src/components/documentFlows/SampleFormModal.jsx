// client/src/components/documentFlows/SampleFormModal.jsx
import React, { useState } from 'react';

export default function SampleFormModal({ isOpen, onClose, flow, language = 'th', locale = 'th' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !flow?.sampleDocument) return null;

  const doc = flow.sampleDocument;
  const isTh = language === 'th' || locale === 'th' || locale === 'th-TH';

  const handleCopyDocNo = () => {
    navigator.clipboard?.writeText(doc.docNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-lg">
              📄
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="sample-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {isTh ? 'ตัวอย่างแบบฟอร์มเอกสารจำลอง (Interactive Sample Form)' : 'Sample ISO Document Form Preview'}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {doc.docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTh
                  ? 'แสดงโครงสร้างแบบฟอร์มทางการตามมาตรฐานการควบคุมเอกสาร ISO / ITIL'
                  : 'Displays standard official structure adhering to ISO & ITIL doc control'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title={isTh ? 'สั่งพิมพ์หรือบันทึกเป็น PDF' : 'Print or Save as PDF'}
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">{isTh ? 'พิมพ์ / PDF' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Printable Sheet Container */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-7 shadow-sm text-slate-800 dark:text-slate-200">
            {/* ISO Document Formal Header */}
            <div className="border-b-2 border-slate-800 dark:border-slate-600 pb-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-1 flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-3 md:pb-0 pr-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
                    FTI
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
                      สภาอุตสาหกรรมแห่งประเทศไทย
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      The Federation of Thai Industries
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2 text-center">
                  <h4 className="text-sm sm:text-base font-extrabold uppercase text-slate-900 dark:text-white">
                    {isTh ? doc.formNameTh : doc.formNameEn}
                  </h4>
                  <p className="text-xs text-primary-700 dark:text-primary-400 font-medium mt-0.5">
                    {isTh ? doc.formNameEn : doc.formNameTh}
                  </p>
                </div>

                <div className="md:col-span-1 text-right text-[11px] font-mono space-y-0.5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-2 md:pt-0 pl-3">
                  <div className="flex justify-between md:justify-end gap-2">
                    <span className="text-slate-400">Doc No:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{doc.docNumber}</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-2">
                    <span className="text-slate-400">Control:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{doc.docRevision}</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-2">
                    <span className="text-slate-400">Effective:</span>
                    <span>{doc.effectiveDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <span>
                  <strong className="text-slate-700 dark:text-slate-300">มาตรฐานอ้างอิง:</strong> {doc.isoCode}
                </span>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
                  ✓ เอกสารควบคุมตามระบบคุณภาพ (Controlled Document)
                </span>
              </div>
            </div>

            {/* Section 1: Requester Details */}
            <div className="mb-6">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-primary-600 rounded-sm"></span>
                ส่วนที่ 1: ข้อมูลผู้ยื่นคำขอ (Requester Information)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">ชื่อ - นามสกุล (Name):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{doc.requesterInfo.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">รหัสพนักงาน (Employee ID):</span>
                  <span className="font-mono font-semibold">{doc.requesterInfo.empId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ฝ่าย / แผนก (Department):</span>
                  <span className="font-semibold text-primary-700 dark:text-primary-300">{doc.requesterInfo.dept}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ตำแหน่ง (Position):</span>
                  <span>{doc.requesterInfo.position}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">เบอร์ติดต่อภายใน (Ext.):</span>
                  <span>{doc.requesterInfo.tel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">อีเมลองค์กร (Work Email):</span>
                  <span className="text-blue-600 dark:text-blue-400">{doc.requesterInfo.email}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Requisition & Item Details */}
            <div className="mb-6">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-primary-600 rounded-sm"></span>
                ส่วนที่ 2: รายละเอียดการขอเบิก / วัตถุประสงค์ (Justification & Details)
              </h5>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">ประเภทคำขอ / เหตุผลความจำเป็น:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{doc.equipmentDetails.reasonType}</p>
                </div>

                {doc.equipmentDetails.oldAssetTag !== '-' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-700 gap-2">
                    <div>
                      <span className="text-slate-400 text-[11px]">รหัสสินทรัพย์เดิม (Old Asset Tag):</span>
                      <p className="font-mono font-bold text-red-600 dark:text-red-400">{doc.equipmentDetails.oldAssetTag}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">รุ่น / สเปกเดิม (Old Model):</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{doc.equipmentDetails.oldModel}</p>
                    </div>
                  </div>
                )}

                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px]">อาการชำรุด / ผลการประเมินทางเทคนิค:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{doc.equipmentDetails.defectSymptom}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-blue-50/40 dark:bg-blue-950/20 gap-3">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[11px]">รายการที่ขอเบิก / ดำเนินการ:</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{doc.equipmentDetails.requestedItem}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{doc.equipmentDetails.preferredSpec}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">จำนวนที่ขอ (Quantity):</span>
                    <p className="font-mono font-bold text-primary-700 dark:text-primary-300 text-sm mt-0.5">{doc.equipmentDetails.quantity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Formal Dual Approvals & Signatures Matrix */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-primary-600 rounded-sm"></span>
                ส่วนที่ 3: บันทึกการลงนามและอนุมัติตามลำดับชั้น (Approval Matrix)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {doc.signatures.map((sig, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between text-xs"
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {sig.roleTh}
                      </p>
                      <div className="my-3 py-2 border-y border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <span className="font-serif italic font-bold text-primary-800 dark:text-primary-300 text-sm tracking-wide">
                          ✍️ {sig.name}
                        </span>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          ✓ {sig.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 text-center">
                      <span>ลงวันที่: {sig.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDocNo}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-primary-600 transition flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>{copied ? (isTh ? 'คัดลอกรหัสแล้ว!' : 'Copied!') : (isTh ? 'คัดลอกเลขที่เอกสาร' : 'Copy Doc Number')}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition"
          >
            {isTh ? 'ปิดหน้าต่างตัวอย่าง' : 'Close Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}
