import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useAuth from '../../hooks/useAuth.js';
import useLanguage from '../../hooks/useLanguage.js';
import { useToast } from '../../hooks/ToastContext.jsx';
import maintenanceService from '../../services/maintenanceService.js';

export default function MaintenanceReportModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(t('issueTitleRequired'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        assetId: asset.id,
        assetCode: asset.code || asset.licensePlate || asset.parkingSlot || '',
        assetName: asset.name,
        assetType: asset.type,
        buildingId: asset.buildingId || 'b1',
        buildingName: asset.buildingName || 'อาคารหลัก',
        floorNumber: asset.floorNumber || 1,
        roomName: asset.roomName || t('commonArea'),
        floorPlanId: asset.floorPlanId || undefined,
        title: title.trim(),
        description: description.trim(),
        urgency,
        reporterName: user?.name || 'พนักงาน',
        reporterEmail: user?.email || '',
        reporterPhone: phone.trim(),
        // IT Specs snapshot
        pcName: asset.pcName || '',
        osVersion: asset.osVersion || '',
        cpu: asset.cpu || '',
        ram: asset.ram || '',
        storage: asset.storage || '',
        specs: asset.specs || '',
        peripherals: Array.isArray(asset.peripherals) ? asset.peripherals : (asset.peripherals ? [asset.peripherals] : []),
        installedSoftware: Array.isArray(asset.installedSoftware) ? asset.installedSoftware : (asset.installedSoftware ? [asset.installedSoftware] : []),
      };

      const res = await maintenanceService.create(payload);
      showToast(res.message || t('reportSubmitSuccess'), 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || t('errorSubmittingReport'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-lg text-white shadow-md shadow-amber-200">
              🔧
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t('maintenanceReportModalTitle')}</h3>
              <p className="text-xs text-slate-500">{t('maintenanceReportModalDesc')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-700 border border-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Asset Details Preview Card */}
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900">{asset.name}</span>
              <span className="font-mono text-slate-500 font-semibold">
                ({asset.code || asset.licensePlate || 'ID: ' + asset.id})
              </span>
              {asset.pcName && (
                <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                  💻 {asset.pcName}
                </span>
              )}
              {asset.osVersion && (
                <span className="text-[10px] text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
                  🪟 {asset.osVersion}
                </span>
              )}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              📍 {asset.buildingName} • {t('floorNumberLabel', { floor: asset.floorNumber || 1 })} • {asset.roomName || t('commonArea')}
            </div>
          </div>
          <span className="rounded-md bg-white px-2 py-1 font-semibold text-slate-600 border border-slate-200">
            {asset.type === 'cctv' ? '📹 CCTV' : asset.type === 'computer' ? '💻 PC' : asset.type === 'printer' ? '🖨️ Printer' : '📦 Asset'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('issueTitleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={t('issueTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('urgencyLabel')}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="low">{t('urgencyLow')}</option>
                <option value="medium">{t('urgencyMedium')}</option>
                <option value="high">{t('urgencyHigh')}</option>
                <option value="critical">{t('urgencyCritical')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('contactPhoneLabel')}
              </label>
              <input
                type="text"
                placeholder={t('contactPhonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('additionalDetailsLabel')}
            </label>
            <textarea
              rows={3}
              placeholder={t('additionalDetailsPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              {t('btnCancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-200 hover:bg-amber-600 transition disabled:opacity-50"
            >
              {isSubmitting ? t('submittingReport') : t('btnConfirmReport')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

