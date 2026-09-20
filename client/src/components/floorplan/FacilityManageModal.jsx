import { useState } from 'react';
import {
  useCreateFacility,
  useUpdateFacility,
  useDeleteFacility,
  useAddFacilityFloor,
  useDeleteFacilityFloor,
} from '../../hooks/useFacilities.js';
import useLanguage from '../../hooks/useLanguage.js';
import ConfirmDialog from '../common/ConfirmDialog.jsx';

export default function FacilityManageModal({
  isOpen,
  onClose,
  facilities = [],
  onSelectFacility,
}) {
  const { t } = useLanguage();
  const createFacilityMutation = useCreateFacility();
  const updateFacilityMutation = useUpdateFacility();
  const deleteFacilityMutation = useDeleteFacility();
  const addFloorMutation = useAddFacilityFloor();
  const deleteFloorMutation = useDeleteFacilityFloor();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingFacility, setEditingFacility] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    type: 'office',
    totalFloors: 1,
    icon: '🏢',
    description: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setFormData({
      name: '',
      shortName: '',
      type: 'office',
      totalFloors: 1,
      icon: '🏢',
      description: '',
    });
    setErrorMsg('');
    setActiveTab('create');
  };

  const handleStartEdit = (facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name || '',
      shortName: facility.shortName || '',
      type: facility.type || 'office',
      totalFloors: facility.totalFloors || 1,
      icon: facility.icon || '🏢',
      description: facility.description || '',
    });
    setErrorMsg('');
    setActiveTab('edit');
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('กรุณากรอกชื่ออาคาร');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await createFacilityMutation.mutateAsync({
        ...formData,
        totalFloors: Number(formData.totalFloors) || 1,
      });
      setIsSubmitting(false);
      setActiveTab('list');
      if (res?.data?.facility && onSelectFacility) {
        onSelectFacility(res.data.facility);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสร้างอาคาร');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('กรุณากรอกชื่ออาคาร');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateFacilityMutation.mutateAsync({
        id: editingFacility.facilityId || editingFacility._id,
        payload: {
          name: formData.name.trim(),
          shortName: formData.shortName.trim(),
          icon: formData.icon,
          description: formData.description,
        },
      });
      setIsSubmitting(false);
      setActiveTab('list');
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการแก้ไขอาคาร');
    }
  };

  const handleDelete = async (facility) => {
    const confirmName = window.prompt(
      `คุณแน่ใจหรือไม่ว่าต้องการลบ "${facility.name}"?\n(ข้อมูลแปลนทุกชั้นและอุปกรณ์ในอาคารนี้จะถูกลบออกทั้งหมด)\n\nพิมพ์ "${facility.shortName || facility.name}" เพื่อยืนยันการลบ:`
    );

    if (confirmName !== (facility.shortName || facility.name)) {
      if (confirmName !== null) {
        alert('ชื่อที่พิมพ์ไม่ตรงกัน ยกเลิกการลบ');
      }
      return;
    }

    try {
      await deleteFacilityMutation.mutateAsync(facility.facilityId || facility._id);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'ไม่สามารถลบอาคารได้');
    }
  };

  const handleAddFloor = async (facility) => {
    const nextFloor = (facility.actualFloorCount || facility.totalFloors || 1) + 1;
    if (
      !window.confirm(
        `ต้องการเพิ่มชั้น ${nextFloor} ให้กับ "${facility.name}" ใช่หรือไม่?\n(ระบบจะสร้างแปลนชั้นใหม่พร้อมผนังรอบนอกให้ทันที)`
      )
    ) {
      return;
    }

    try {
      await addFloorMutation.mutateAsync({
        id: facility.facilityId || facility._id,
        payload: { floorName: `ชั้น ${nextFloor}` },
      });
      alert(`เพิ่มชั้น ${nextFloor} เรียบร้อยแล้ว!`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'ไม่สามารถเพิ่มชั้นได้');
    }
  };

  const handleDeleteFloor = (facility) => {
    const currentTotal = facility.actualFloorCount || facility.totalFloors || 1;
    if (currentTotal <= 1) {
      setErrorMsg('ไม่สามารถลบได้ เนื่องจากอาคารต้องมีอย่างน้อย 1 ชั้น');
      return;
    }

    setConfirmDialog({
      title: 'ยืนยันการลบชั้นแปลนอาคาร',
      message: `⚠️ คุณต้องการลบ "ชั้น ${currentTotal}" (ชั้นบนสุด) ของ "${facility.name}" ใช่หรือไม่?\n\nข้อมูลโครงสร้างห้องและอุปกรณ์ในชั้นนี้จะถูกลบออกอย่างถาวร!`,
      confirmLabel: 'ยืนยันลบชั้นนี้',
      onConfirm: async () => {
        try {
          await deleteFloorMutation.mutateAsync({
            id: facility.facilityId || facility._id,
            floorNumber: currentTotal,
          });
        } catch (err) {
          setErrorMsg(err.response?.data?.message || err.message || 'ไม่สามารถลบชั้นได้');
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <span className="text-xl">🏗️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                จัดการข้อมูลอาคารและโกดัง (Campus Facilities)
              </h2>
              <p className="text-xs text-slate-500">
                เพิ่ม ลบ หรือแก้ไขอาคารและจำนวนชั้นบนพื้นที่ 20 ไร่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 รายการอาคาร ({facilities.length})
          </button>
          <button
            onClick={handleStartCreate}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ➕ เพิ่มอาคาร / โกดังใหม่
          </button>
          {activeTab === 'edit' && (
            <button className="py-3 px-4 text-sm font-semibold border-b-2 border-amber-500 text-amber-600">
              ✏️ แก้ไขข้อมูลอาคาร
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB: LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-medium">
                  อาคารทั้งหมดบนพื้นที่ FTI Campus (คลิกเพื่อเลือกดูหรือจัดการ)
                </span>
                <button
                  onClick={handleStartCreate}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>เพิ่มอาคาร</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {facilities.map((f) => (
                  <div
                    key={f.facilityId || f.id || f._id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-blue-300 transition group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{f.icon || (f.type === 'warehouse' ? '🏭' : '🏢')}</span>
                          <div>
                            <div className="font-semibold text-sm text-slate-900">
                              {f.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              รหัส: <span className="font-mono font-medium">{f.shortName || f.id}</span> • {f.type === 'warehouse' ? 'โกดังสินค้า' : f.type === 'parking' ? 'ลานจอดรถ' : 'อาคารสำนักงาน'}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full">
                          {f.actualFloorCount || f.totalFloors || 1} ชั้น
                        </span>
                      </div>
                      {f.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {f.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddFloor(f)}
                          className="px-2 py-1 bg-white border border-slate-300 hover:border-blue-400 text-slate-700 text-[11px] rounded font-medium transition"
                          title="เพิ่มชั้นใหม่ให้อาคารนี้"
                        >
                          + ชั้น
                        </button>
                        {(f.actualFloorCount || f.totalFloors || 1) > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFloor(f)}
                            className="px-2 py-1 bg-white border border-rose-200 hover:border-rose-400 text-rose-600 text-[11px] rounded font-medium transition"
                            title={`ลบชั้น ${f.actualFloorCount || f.totalFloors} (ชั้นบนสุด)`}
                          >
                            - ชั้น
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(f)}
                          className="px-2 py-1 bg-white border border-slate-300 hover:border-amber-400 text-slate-700 text-[11px] rounded font-medium transition"
                          title="แก้ไขชื่อและรายละเอียด"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          className="px-2 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] rounded font-medium transition"
                          title="ลบอาคารนี้และแปลนทุกชั้น"
                        >
                          🗑️ ลบ
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectFacility) onSelectFacility(f);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-[11px] font-semibold transition"
                      >
                        ดูแปลน ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREATE */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmitCreate} className="space-y-4 text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทสิ่งปลูกสร้าง
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const tVal = e.target.value;
                      setFormData({
                        ...formData,
                        type: tVal,
                        icon: tVal === 'warehouse' ? '🏭' : tVal === 'parking' ? '🅿️' : '🏢',
                      });
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="office">🏢 อาคารสำนักงาน (Building)</option>
                    <option value="warehouse">🏭 โกดังสินค้า / คลัง (Warehouse)</option>
                    <option value="parking">🅿️ ลานจอดรถ / จุดจอด (Parking Area)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ไอคอนแสดงผล
                  </label>
                  <div className="flex items-center gap-2">
                    {['🏢', '🏭', '🅿️', '🏬', '🏗️', '📦', '🧪', '⚡'].map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: ic })}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition ${
                          formData.icon === ic
                            ? 'border-blue-600 bg-blue-50 scale-110 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่ออาคาร / โกดัง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น อาคารบริหาร 6, คลังสินค้า F"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อย่อ (Short Code)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น B6, W6"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนชั้นเริ่มต้น (Total Floors)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.totalFloors}
                    onChange={(e) =>
                      setFormData({ ...formData, totalFloors: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-28 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">
                    💡 ระบบจะสร้างแปลนพร้อมผนังภายนอกให้ทุกชั้นโดยอัตโนมัติ (สามารถเพิ่มชั้นภายหลังได้)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบาย หรือ แผนกที่ประจำการ
                </label>
                <textarea
                  rows="2"
                  placeholder="เช่น ฝ่ายซ่อมบำรุง, คลังสินค้าสำเร็จรูป, จุดชาร์จ EV..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>กำลังสร้างแปลน...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>บันทึกและสร้างแปลนทุกชั้น</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: EDIT */}
          {activeTab === 'edit' && editingFacility && (
            <form onSubmit={handleSubmitEdit} className="space-y-4 text-slate-800">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                กำลังแก้ไขข้อมูลของ: <strong>{editingFacility.name}</strong> ({editingFacility.shortName || editingFacility.id})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่ออาคาร / โกดัง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อย่อ (Short Code)
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ไอคอนแสดงผล
                </label>
                <div className="flex items-center gap-2">
                  {['🏢', '🏭', '🅿️', '🏬', '🏗️', '📦', '🧪', '⚡'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: ic })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition ${
                        formData.icon === ic
                          ? 'border-amber-600 bg-amber-50 scale-110 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบาย หรือ ข้อมูลประจำอาคาร
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      {confirmDialog && (
        <ConfirmDialog
          open={Boolean(confirmDialog)}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={true}
          loading={deleteFloorMutation.isPending}
        />
      )}
    </div>
  );
}
