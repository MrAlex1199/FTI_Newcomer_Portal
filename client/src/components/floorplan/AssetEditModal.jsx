import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';

export default function AssetEditModal({
  open,
  asset,
  departments = [],
  allFloorPlans = [],
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useLanguage();

  if (!asset) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={asset.id ? `⚙️ ${t('editAssetDetails') || 'แก้ไขข้อมูลทรัพย์สิน'}: ${asset.code || asset.name || ''}` : `✨ ${t('btnAddNewAsset') || 'เพิ่มอุปกรณ์ใหม่'}`}
      size="md"
    >
      <AssetEditForm
        asset={asset}
        departments={departments}
        allFloorPlans={allFloorPlans}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        t={t}
      />
    </Modal>
  );
}

function AssetEditForm({ asset, departments, allFloorPlans, onClose, onSave, onDelete, t }) {
  const defaultFpId = asset.floorPlanId || (allFloorPlans && allFloorPlans.length > 0 ? allFloorPlans[0]._id : '');
  const [floorPlanId, setFloorPlanId] = useState(defaultFpId);
  const [code, setCode] = useState(asset.code || '');
  const [name, setName] = useState(asset.name || '');
  const [type, setType] = useState(asset.type || 'computer');
  const [rotation, setRotation] = useState(asset.rotation || 0);
  const [fovAngle, setFovAngle] = useState(asset.fovAngle || 75);
  const [rangeMeters, setRangeMeters] = useState(asset.rangeMeters || 10);
  const [status, setStatus] = useState(asset.status || 'active');
  const [assignedTo, setAssignedTo] = useState(asset.assignedTo || '');
  const [department, setDepartment] = useState(asset.department || '');
  const [specs, setSpecs] = useState(asset.specs || '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset.warrantyExpiry || '');
  const [ipAddress, setIpAddress] = useState(asset.ipAddress || '');
  const [licensePlate, setLicensePlate] = useState(asset.licensePlate || '');
  const [driverName, setDriverName] = useState(asset.driverName || '');
  const [parkingSlot, setParkingSlot] = useState(asset.parkingSlot || '');
  const [vehicleModel, setVehicleModel] = useState(asset.vehicleModel || '');
  const [notes, setNotes] = useState(asset.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isVehicle = type.startsWith('vehicle_') || type === 'parking_bay' || type === 'ev_charger';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('assetNameRequired') || 'กรุณาระบุชื่ออุปกรณ์');
      return;
    }

    const targetFloorId = floorPlanId || asset.floorPlanId || (allFloorPlans && allFloorPlans[0] ? allFloorPlans[0]._id : '');
    if (!targetFloorId && allFloorPlans && allFloorPlans.length > 0) {
      setFormError('กรุณาเลือกสถานที่ติดตั้งอุปกรณ์');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await onSave({
        ...asset,
        code: code.trim(),
        name: name.trim() || 'อุปกรณ์ใหม่',
        type,
        rotation: Number(rotation) || 0,
        fovAngle: Number(fovAngle) || 75,
        rangeMeters: Number(rangeMeters) || 10,
        status,
        assignedTo: assignedTo.trim(),
        department: department.trim(),
        specs: specs.trim(),
        warrantyExpiry: warrantyExpiry.trim(),
        ipAddress: ipAddress.trim(),
        licensePlate: licensePlate.trim(),
        driverName: driverName.trim(),
        parkingSlot: parkingSlot.trim(),
        vehicleModel: vehicleModel.trim(),
        notes: notes.trim(),
        floorPlanId: targetFloorId,
        x: Number.isFinite(Number(asset.x)) ? Number(asset.x) : 100,
        y: Number.isFinite(Number(asset.y)) ? Number(asset.y) : 100,
      });
      onClose();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 font-medium flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      {/* Location (Floor Plan) Selection */}
      {allFloorPlans && allFloorPlans.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <label className="block font-bold text-indigo-700 mb-1">
            📍 {t('assetLocation') || 'สถานที่ติดตั้ง (Location)'}
          </label>
          <select
            value={floorPlanId || allFloorPlans[0]?._id || ''}
            onChange={(e) => {
              setFloorPlanId(e.target.value);
              if (formError) setFormError('');
            }}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 font-semibold text-slate-800"
          >
            {allFloorPlans.map((fp) => (
              <option key={fp._id} value={fp._id}>
                {fp.buildingName} - {fp.floorName} (ชั้น {fp.floorNumber})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Type & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('assetType') || 'ประเภทอุปกรณ์ / ยานพาหนะ'} <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          >
            <optgroup label="อุปกรณ์และสำนักงาน">
              <option value="cctv">📹 กล้องวงจรปิด (CCTV Camera)</option>
              <option value="computer">💻 คอมพิวเตอร์ (Workstation / PC)</option>
              <option value="printer">🖨️ เครื่องพิมพ์ (Printer / MFP)</option>
              <option value="desk">🪑 โต๊ะทำงาน / จุดประจำ (Desk)</option>
              <option value="meeting_table">👥 โต๊ะประชุม (Meeting Table)</option>
              <option value="emergency">🚨 อุปกรณ์ฉุกเฉิน / ดับเพลิง (Emergency)</option>
              <option value="other">📦 อุปกรณ์อื่นๆ (Other)</option>
            </optgroup>
            <optgroup label="🚗 ยานพาหนะและลานจอดรถ (Vehicles & Parking)">
              <option value="vehicle_car">🚗 รถยนต์บริษัท / ส่วนกลาง (Car / Sedan / SUV)</option>
              <option value="vehicle_truck">🚚 รถบรรทุกขนส่งสินค้า (Logistics Truck)</option>
              <option value="vehicle_motorcycle">🛵 รถมอเตอร์ไซค์ส่งเอกสาร (Motorcycle)</option>
              <option value="vehicle_forklift">🚜 รถโฟล์คลิฟท์คลังสินค้า (Forklift)</option>
              <option value="parking_bay">🅿️ ช่องจอดรถ / ซองจอด (Parking Bay)</option>
              <option value="ev_charger">⚡ จุดชาร์จรถยนต์ไฟฟ้า (EV Charger)</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('status') || 'สถานะการใช้งาน'} <span className="text-red-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          >
            <option value="active">🟢 ใช้งานปกติ (Active)</option>
            <option value="maintenance">🟡 ซ่อมบำรุง / ตรวจเช็ก (Maintenance)</option>
            <option value="broken">🔴 เสีย / ส่งซ่อม (Broken / Issue)</option>
            <option value="inactive">⚪ ปิดใช้งาน (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Asset Code & Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('assetCode') || 'รหัสทรัพย์สิน'}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น FTI-PC-001, CCTV-01"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('assetName') || 'ชื่ออุปกรณ์'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Workstation IT #1, กล้องโถงทางเข้า"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* CCTV Specific FOV & Angle Controls */}
      {type === 'cctv' && (
        <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-200 space-y-2.5">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
            📹 {t('cctvFovSettings') || 'ตั้งค่ามุมมองกล้องวงจรปิด (FOV Coverage)'}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">
                ทิศทางหมุน ({rotation}°)
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full cursor-pointer accent-primary-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 mb-1">
                มุมองศา FOV ({fovAngle}°)
              </label>
              <select
                value={fovAngle}
                onChange={(e) => setFovAngle(Number(e.target.value))}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs"
              >
                <option value={60}>60° (เลนส์แคบ / ทางเดิน)</option>
                <option value={75}>75° (เลนส์มาตรฐาน)</option>
                <option value={90}>90° (มุมกว้างครอบคลุมห้อง)</option>
                <option value={120}>120° (Ultra-wide)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 mb-1">
                ระยะส่อง ({rangeMeters} เมตร)
              </label>
              <input
                type="number"
                min="3"
                max="30"
                value={rangeMeters}
                onChange={(e) => setRangeMeters(Number(e.target.value))}
                className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Vehicle & Parking Specific Fields */}
      {isVehicle && (
        <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200 space-y-3">
          <div className="font-semibold text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              🚗 ข้อมูลยานพาหนะและจุดจอด (Vehicle & Parking Details)
            </span>
            <span className="text-[11px] text-amber-700 font-mono">
              มุมองศา: {rotation}°
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                ป้ายทะเบียนรถ (License Plate)
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="เช่น 1กข-9922 กทม, 70-4412"
                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                พนักงานขับ / ผู้ดูแล (Driver)
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="เช่น สมชาย ใจมั่น (ฝ่ายขนส่ง)"
                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                ช่องจอดรถประจำ (Parking Slot)
              </label>
              <input
                type="text"
                value={parkingSlot}
                onChange={(e) => setParkingSlot(e.target.value)}
                placeholder="เช่น P-01, EV-02, WH-DOCK-1"
                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                ยี่ห้อ / รุ่นรถ (Vehicle Model)
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="เช่น Toyota Hilux Revo, Isuzu Giga"
                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
              <span>หมุนทิศทางรถ / ซองจอด (Rotation Angle):</span>
              <div className="flex gap-1.5">
                {[0, 45, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotation(deg)}
                    className="px-1.5 py-0.5 bg-white border border-amber-200 rounded text-[10px] font-mono hover:bg-amber-100"
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full cursor-pointer accent-amber-600"
            />
          </div>
        </div>
      )}

      {/* Owner & Department */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('assignedOwner') || 'ผู้ถือครอง / ผู้ใช้งาน'}
          </label>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="ชื่อ-นามสกุล พนักงาน หรือส่วนกลาง"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('department') || 'แผนกที่รับผิดชอบ'}
          </label>
          <input
            type="text"
            list="asset-depts"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="เลือกหรือพิมพ์ชื่อแผนก"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
          <datalist id="asset-depts">
            {departments.map((d) => (
              <option key={d._id || d.name} value={d.name} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Specifications & Warranty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('specs') || 'สเปกอุปกรณ์ / รายละเอียดเครื่อง'}
          </label>
          <input
            type="text"
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="เช่น Core i7, 32GB RAM, 4K resolution"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('warrantyExpiry') || 'วันหมดประกัน'}
          </label>
          <input
            type="date"
            value={warrantyExpiry}
            onChange={(e) => setWarrantyExpiry(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* IP Address & Notes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('ipAddress') || 'IP Address / Network'}
          </label>
          <input
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="เช่น 192.168.10.21"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500 font-mono"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('notes') || 'หมายเหตุ / ประวัติซ่อม'}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ระบุหมายเหตุเพิ่มเติม"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmDeleteAsset') || 'ต้องการลบอุปกรณ์นี้ใช่หรือไม่?')) {
                onDelete(asset.id);
                onClose();
              }
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            🗑️ {t('delete') || 'ลบอุปกรณ์'}
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('cancel') || 'ยกเลิก'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting && <span className="animate-spin text-[10px]">⏳</span>}
            <span>{t('saveChanges') || 'บันทึก'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
