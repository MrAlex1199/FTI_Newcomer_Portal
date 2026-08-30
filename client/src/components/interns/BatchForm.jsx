import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import ImageUpload from '../common/ImageUpload.jsx';

const BLANK = { code: '', title: '', year: new Date().getFullYear(), sequence: 1, startDate: '', endDate: '', description: '' };
const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const toFormState = (batch) => batch ? { code: batch.code || '', title: batch.title || '', year: batch.year || '', sequence: batch.sequence || 1, startDate: toDateInput(batch.startDate), endDate: toDateInput(batch.endDate), description: batch.description || '' } : { ...BLANK };
const inputCls = (error) => `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-400' : 'border-gray-300'}`;

export default function BatchForm({ initial, onSubmit, onCancel, submitting, uploadProgress, serverErrors = {} }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => toFormState(initial));
  const [file, setFile] = useState(null);
  const [clientErrors, setClientErrors] = useState({});
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const errorFor = (field) => clientErrors[field] || serverErrors[field];
  const validate = () => {
    const errors = {};
    ['code', 'title', 'year', 'sequence', 'startDate', 'endDate'].forEach((field) => { if (!String(form[field]).trim()) errors[field] = t('requiredField'); });
    if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = t('invalidDateRange');
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, year: Number(form.year), sequence: Number(form.sequence) }, file);
  };
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label={t('batchCode')} required error={errorFor('code')}><input className={inputCls(errorFor('code'))} value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="2026/01" /></Field>
      <Field label={t('title')} required error={errorFor('title')}><input className={inputCls(errorFor('title'))} value={form.title} onChange={(e) => setField('title', e.target.value)} /></Field>
      <Field label={t('year')} required error={errorFor('year')}><input type="number" className={inputCls(errorFor('year'))} value={form.year} onChange={(e) => setField('year', e.target.value)} /></Field>
      <Field label={t('sequence')} required error={errorFor('sequence')}><input type="number" min="1" className={inputCls(errorFor('sequence'))} value={form.sequence} onChange={(e) => setField('sequence', e.target.value)} /></Field>
      <Field label={t('startDate')} required error={errorFor('startDate')}><input type="date" className={inputCls(errorFor('startDate'))} value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} /></Field>
      <Field label={t('endDate')} required error={errorFor('endDate')}><input type="date" className={inputCls(errorFor('endDate'))} value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} /></Field>
    </div>
    <Field label={t('description')} error={errorFor('description')}><textarea rows={3} className={inputCls(errorFor('description'))} value={form.description} onChange={(e) => setField('description', e.target.value)} /></Field>
    <ImageUpload value={initial?.groupPhoto} onChange={setFile} progress={uploadProgress} error={errorFor('groupPhoto')} label={t('groupPhoto')} placeholder="BATCH" disabled={submitting} />
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 text-sm rounded-md border border-gray-300">{t('cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white disabled:opacity-50">{submitting ? t('saving') : initial ? t('saveChanges') : t('createBatch')}</button></div>
  </form>;
}
function Field({ label, required, error, children }) { return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>{children}{error && <p className="text-xs text-red-600 mt-1">{error}</p>}</div>; }
