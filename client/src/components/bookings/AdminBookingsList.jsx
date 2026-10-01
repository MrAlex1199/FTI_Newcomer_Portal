import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import {
  useCancelBooking,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from '../../hooks/useBookings.js';
import Modal from '../common/Modal.jsx';

export default function AdminBookingsList({ bookings = [], resources = [] }) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const cancelMut = useCancelBooking();
  const createResMut = useCreateResource();
  const updateResMut = useUpdateResource();
  const deleteResMut = useDeleteResource();

  const [activeSubTab, setActiveSubTab] = useState('bookings'); // 'bookings' | 'resources'
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [resForm, setResForm] = useState({
    name: '',
    type: 'room',
    category: '',
    capacity: 4,
    locationOrPlate: '',
    description: '',
    driverAvailable: false,
    status: 'active',
    icon: '🏢',
    color: '#3b82f6',
    amenities: [],
  });
  const [amenityInput, setAmenityInput] = useState('');

  const openAddResource = () => {
    setEditingResource(null);
    setResForm({
      name: '',
      type: 'room',
      category: 'ห้องประชุม',
      capacity: 6,
      locationOrPlate: '',
      description: '',
      driverAvailable: false,
      status: 'active',
      icon: '🏢',
      color: '#3b82f6',
      amenities: [],
    });
    setResourceModalOpen(true);
  };

  const openEditResource = (res) => {
    setEditingResource(res);
    setResForm({
      name: res.name || '',
      type: res.type || 'room',
      category: res.category || '',
      capacity: res.capacity || 4,
      locationOrPlate: res.locationOrPlate || '',
      description: res.description || '',
      driverAvailable: Boolean(res.driverAvailable),
      status: res.status || 'active',
      icon: res.icon || (res.type === 'room' ? '🏢' : '🚗'),
      color: res.color || '#3b82f6',
      amenities: Array.isArray(res.amenities) ? [...res.amenities] : [],
    });
    setResourceModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await updateResMut.mutateAsync({
          id: editingResource._id,
          payload: resForm,
        });
        showToast(t('resourceSavedSuccess'), 'success');
      } else {
        await createResMut.mutateAsync(resForm);
        showToast(t('resourceSavedSuccess'), 'success');
      }
      setResourceModalOpen(false);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save resource', 'error');
    }
  };

  const handleDeleteResource = async (res) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${res.name}?`)) return;
    try {
      await deleteResMut.mutateAsync(res._id);
      showToast('ลบทรัพยากรสำเร็จ', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not delete resource', 'error');
    }
  };

  const handleAdminCancelBooking = async (b) => {
    const reason = window.prompt('ระบุเหตุผลในการยกเลิกรายการนี้:', 'Admin cancellation');
    if (!reason) return;

    try {
      await cancelMut.mutateAsync({
        id: b._id,
        payload: { cancellationReason: reason },
      });
      showToast(t('bookingCancelled'), 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not cancel booking', 'error');
    }
  };

  const addAmenity = () => {
    const val = amenityInput.trim();
    if (!val || resForm.amenities.includes(val)) return;
    setResForm((prev) => ({ ...prev, amenities: [...prev.amenities, val] }));
    setAmenityInput('');
  };

  const removeAmenity = (idx) => {
    setResForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== idx),
    }));
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'bookings'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            📋 การจองทั้งหมด ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('resources')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'resources'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ⚙️ จัดการห้องและรถ ({resources.length})
          </button>
        </div>

        {activeSubTab === 'resources' && (
          <button
            type="button"
            onClick={openAddResource}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <span>+</span>
            <span>{t('addResource')}</span>
          </button>
        )}
      </div>

      {/* SubTab 1: All Bookings Management Table */}
      {activeSubTab === 'bookings' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">รหัสการจอง</th>
                  <th className="px-4 py-3">ทรัพยากร</th>
                  <th className="px-4 py-3">หัวข้อ / จุดประสงค์</th>
                  <th className="px-4 py-3">ช่วงเวลา</th>
                  <th className="px-4 py-3">ผู้จอง / แผนก</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => {
                  const res = b.resourceId || {};
                  return (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {b.bookingNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span>{res.icon || (b.resourceType === 'room' ? '🏢' : '🚗')}</span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">
                            {res.name || 'Resource'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 truncate max-w-[180px]">{b.title}</p>
                        {b.destination && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            📍 {b.destination}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">
                        {formatDateTime(b.startTime)} - {new Date(b.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{b.contactName}</p>
                        <p className="text-[11px] text-slate-400">{b.department || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            b.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {b.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'ยืนยันแล้ว'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleAdminCancelBooking(b)}
                            className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Resource Catalog Management */}
      {activeSubTab === 'resources' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <div
              key={res._id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{res.icon || (res.type === 'room' ? '🏢' : '🚗')}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate max-w-[160px]">
                        {res.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {res.category} · 👥 {res.capacity} {t('seats')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      res.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  📍 {res.locationOrPlate || '—'}
                </p>
                {res.description && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{res.description}</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditResource(res)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteResource(res)}
                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <Modal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title={editingResource ? t('editResource') : t('addResource')}
        size="md"
      >
        <form onSubmit={handleSaveResource} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('resourceName')} *
            </label>
            <input
              type="text"
              required
              value={resForm.name}
              onChange={(e) => setResForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('resourceType')}
              </label>
              <select
                value={resForm.type}
                onChange={(e) => setResForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
              >
                <option value="room">🏢 Meeting Room</option>
                <option value="vehicle">🚗 Company Vehicle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('capacity')} ({t('seats')})
              </label>
              <input
                type="number"
                min={1}
                value={resForm.capacity}
                onChange={(e) => setResForm((prev) => ({ ...prev, capacity: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('resourceCategory')}
              </label>
              <input
                type="text"
                value={resForm.category}
                onChange={(e) => setResForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. ห้องประชุมใหญ่ / รถตู้ VIP"
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('locationOrPlate')}
              </label>
              <input
                type="text"
                value={resForm.locationOrPlate}
                onChange={(e) => setResForm((prev) => ({ ...prev, locationOrPlate: e.target.value }))}
                placeholder="e.g. อาคาร A ชั้น 4 / 1นข-9988"
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบาย (Description)
            </label>
            <textarea
              rows={2}
              value={resForm.description}
              onChange={(e) => setResForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 p-2 text-sm text-slate-900"
            />
          </div>

          {/* Amenities tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สิ่งอำนวยความสะดวก / อุปกรณ์ประจำ (Amenities)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="พิมพ์แล้วกด Enter..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-1 text-xs"
              />
              <button
                type="button"
                onClick={addAmenity}
                className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resForm.amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700 flex items-center gap-1"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeAmenity(idx)}
                    className="text-slate-400 hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResourceModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
