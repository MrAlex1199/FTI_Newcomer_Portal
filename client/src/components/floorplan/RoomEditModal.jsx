import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import { ROOM_PALETTE, calculateAreaMeters } from './snapUtils.js';
import useLanguage from '../../hooks/useLanguage.js';

export default function RoomEditModal({
  open,
  room,
  departments = [],
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useLanguage();

  if (!room) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`🏢 ${t('editRoomDetails') || 'แก้ไขข้อมูลห้อง'}: ${room.name}`}
      size="md"
    >
      <RoomEditForm
        room={room}
        departments={departments}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        t={t}
      />
    </Modal>
  );
}

function RoomEditForm({ room, departments, onClose, onSave, onDelete, t }) {
  const [name, setName] = useState(room.name || '');
  const [department, setDepartment] = useState(room.department || '');
  const [extension, setExtension] = useState(room.extension || '');
  const [description, setDescription] = useState(room.description || '');
  const [color, setColor] = useState(room.color || '#dbeafe');
  const [capacity, setCapacity] = useState(room.capacity || 0);

  const area = calculateAreaMeters(room.width || 0, room.height || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...room,
      name: name.trim() || 'ห้องใหม่',
      department: department.trim(),
      extension: extension.trim(),
      description: description.trim(),
      color,
      capacity: Number(capacity) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Room dimensions summary */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
        <div>
          <span className="font-semibold">{t('roomDimensions') || 'ขนาดพื้นที่'}:</span>{' '}
          {Math.round(Math.abs(room.width) / 20)}m × {Math.round(Math.abs(room.height) / 20)}m
        </div>
        <div className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800">
          ~{area} {t('squareMeters') || 'ตร.ม.'}
        </div>
      </div>

      {/* Room Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('roomName') || 'ชื่อห้อง / พื้นที่'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น ห้องประชุม A, แผนกไอที, ห้องครัว"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Department & Extension */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('department') || 'แผนกที่รับผิดชอบ'}
          </label>
          <input
            type="text"
            list="dept-options"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="เลือกหรือพิมพ์แผนก"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          <datalist id="dept-options">
            {departments.map((d) => (
              <option key={d._id || d.name} value={d.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('phoneExtension') || 'เบอร์ต่อภายใน (Ext.)'}
          </label>
          <input
            type="text"
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            placeholder="เช่น 1001, 1205"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Capacity & Facilities */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('seatingCapacity') || 'ความจุที่นั่ง (คน)'}
        </label>
        <input
          type="number"
          min="0"
          max="200"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Description / Equipment */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('roomFacilities') || 'คำอธิบาย / อุปกรณ์ในห้อง'}
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เช่น มีโปรเจกเตอร์ 4K, กระดานไวท์บอร์ด, ปลั๊กไฟ 6 จุด"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Color Swatches */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('roomColor') || 'สีพื้นห้อง'}
        </label>
        <div className="flex flex-wrap gap-2">
          {ROOM_PALETTE.map((item) => (
            <button
              type="button"
              key={item.hex}
              onClick={() => setColor(item.hex)}
              className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                color === item.hex
                  ? 'scale-110 border-primary-600 ring-2 ring-primary-300'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: item.hex }}
              title={item.name}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmDeleteRoom') || 'ต้องการลบห้องนี้ใช่หรือไม่?')) {
                onDelete(room.id);
                onClose();
              }
            }}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            🗑️ {t('delete') || 'ลบห้องนี้'}
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('cancel') || 'ยกเลิก'}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition"
          >
            {t('saveChanges') || 'บันทึก'}
          </button>
        </div>
      </div>
    </form>
  );
}
