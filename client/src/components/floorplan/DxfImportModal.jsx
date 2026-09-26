import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { parseDxfText, extractDxfLayers, convertDxfToKonva } from '../../utils/dxfToKonva.js';

export default function DxfImportModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [dxfData, setDxfData] = useState(null);
  const [layers, setLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [importMode, setImportMode] = useState('reference'); // 'reference' | 'convert'
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.dxf')) {
      setErrorMsg('กรุณาเลือกไฟล์ที่มีนามสกุล .dxf');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์ DXF ต้องไม่เกิน 20MB');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSizeStr(`${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = parseDxfText(text);
        setDxfData(parsed);

        const extractedLayers = extractDxfLayers(parsed);
        setLayers(extractedLayers);
        // Default select all layers with entities
        setSelectedLayers(extractedLayers.map((l) => l.name));
        setIsLoading(false);
      } catch (err) {
        setErrorMsg(err.message || 'ไม่สามารถวิเคราะห์ไฟล์ DXF นี้ได้');
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setIsLoading(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleToggleLayer = (layerName) => {
    setSelectedLayers((prev) =>
      prev.includes(layerName)
        ? prev.filter((l) => l !== layerName)
        : [...prev, layerName]
    );
  };

  const handleSelectAllLayers = () => {
    setSelectedLayers(layers.map((l) => l.name));
  };

  const handleDeselectAllLayers = () => {
    setSelectedLayers([]);
  };

  const handleConfirmImport = () => {
    if (!dxfData) return;

    if (selectedLayers.length === 0) {
      setErrorMsg('กรุณาเลือกอย่างน้อย 1 Layer ที่ต้องการนำเข้า');
      return;
    }

    // Convert DXF to Konva shapes
    const { shapes, bounds } = convertDxfToKonva(dxfData, {
      selectedLayers,
      targetWidth: 2000,
      targetHeight: 1400,
      padding: 60,
    });

    onImport({
      fileName,
      shapes,
      bounds,
      importMode,
      selectedLayers,
    });

    onClose();
  };

  const resetModal = () => {
    setFile(null);
    setFileName('');
    setDxfData(null);
    setLayers([]);
    setSelectedLayers([]);
    setErrorMsg('');
  };

  const modalNode = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-xl">
              📐
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide">
                นำเข้าไฟล์แบบแปลน CAD (.DXF)
              </h3>
              <p className="text-xs text-blue-200/80">
                รองรับมาตรฐาน AutoCAD, SketchUp, Revit (Drawing Exchange Format)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Upload Area */}
          {!dxfData ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/60 hover:bg-blue-50/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".dxf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 text-3xl group-hover:scale-105 transition">
                📂
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">
                {isLoading ? '⏳ กำลังประมวลผลไฟล์ DXF...' : 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์ .dxf มาวางที่นี่'}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                รองรับไฟล์ DXF จาก AutoCAD ทุกเวอร์ชัน (ขนาดไฟล์ไม่เกิน 20MB)
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs group-hover:bg-blue-700 transition">
                <span>เลือกไฟล์จากเครื่อง</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Card */}
              <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <div className="text-sm font-bold text-blue-900">{fileName}</div>
                    <div className="text-xs text-blue-600 font-medium">
                      ขนาด: {fileSizeStr} • พบ {dxfData?.entities?.length || 0} Entities ใน {layers.length} Layers
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  🔄 เปลี่ยนไฟล์
                </button>
              </div>

              {/* Layer Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🗂️ เลือกเลเยอร์ที่ต้องการนำเข้า</span>
                    <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-bold">
                      {selectedLayers.length}/{layers.length}
                    </span>
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllLayers}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      เลือกทั้งหมด
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllLayers}
                      className="font-semibold text-slate-500 hover:text-slate-700"
                    >
                      ล้างทั้งหมด
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                  {layers.map((l) => {
                    const checked = selectedLayers.includes(l.name);
                    return (
                      <label
                        key={l.name}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition ${
                          checked ? 'bg-white shadow-xs border border-slate-200' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleLayer(l.name)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span
                            className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: l.color }}
                          />
                          <span className="text-xs font-bold text-slate-800">{l.name}</span>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-400">
                          {l.count} วัตถุ
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Import Mode Options */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  ⚙️ รูปแบบการนำเข้า (Import Mode)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setImportMode('reference')}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'reference'
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'reference'}
                        onChange={() => setImportMode('reference')}
                        className="text-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-800">🎯 ชั้นอ้างอิง CAD (แนะนำ)</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed pl-5">
                      แสดงลายเส้น CAD เป็นฉากอ้างอิง เพื่อให้คุณลากบล็อกห้องหรืออุปกรณ์ทับได้อย่างแม่นยำ
                    </p>
                  </label>

                  <label
                    onClick={() => setImportMode('convert')}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'convert'
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'convert'}
                        onChange={() => setImportMode('convert')}
                        className="text-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-800">🏠 แปลงเป็นกำแพง/ห้อง</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed pl-5">
                      แปลงเส้นรอบรูป (Closed Polyline) เป็นห้องและกำแพงอัตโนมัติ (ขึ้นกับความซับซ้อนของไฟล์)
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-[11px] text-slate-500">
            {dxfData && `พร้อมนำเข้า ${selectedLayers.length} เลเยอร์`}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!dxfData || selectedLayers.length === 0}
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>✨ นำเข้าสู่ผังอาคาร</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
