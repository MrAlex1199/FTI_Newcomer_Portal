import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import ImageUpload from '../common/ImageUpload.jsx';

const BLANK = { firstName: '', lastName: '', nickname: '', university: '', faculty: '', major: '', year: '', age: '', departmentId: '', mentorId: '', batchId: '', startDate: '', endDate: '', shortBio: '', projectTitle: '', lessonsLearned: '', adviceForNextBatch: '', isPublished: true, privacyConsent: false };
const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const toFormState = (intern) => intern ? ({ ...BLANK, ...intern, departmentId: intern.departmentId?._id || intern.departmentId || '', mentorId: intern.mentorId?._id || intern.mentorId || '', batchId: intern.batchId?._id || intern.batchId || '', startDate: toDateInput(intern.startDate), endDate: toDateInput(intern.endDate), year: intern.year ?? '', age: intern.age ?? '' }) : { ...BLANK };
const inputCls = (error) => `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-400' : 'border-gray-300'}`;

export default function InternForm({ initial, departments = [], batches = [], employees = [], onSubmit, onCancel, submitting, uploadProgress, serverErrors = {} }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => toFormState(initial));
  const [file, setFile] = useState(null);
  const [clientErrors, setClientErrors] = useState({});
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const errorFor = (field) => clientErrors[field] || serverErrors[field];
  const validate = () => {
    const errors = {};
    ['firstName', 'lastName', 'university', 'departmentId', 'batchId', 'startDate', 'endDate'].forEach((field) => { if (!String(form[field]).trim()) errors[field] = t('requiredField'); });
    if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = t('invalidDateRange');
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    const numeric = (value) => value === '' ? null : Number(value);
    onSubmit({ ...form, year: numeric(form.year), age: numeric(form.age), mentorId: form.mentorId || null, isPublished: Boolean(form.isPublished), privacyConsent: Boolean(form.privacyConsent) }, file);
  };
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label={t('firstName')} required error={errorFor('firstName')}><input className={inputCls(errorFor('firstName'))} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} /></Field>
      <Field label={t('lastName')} required error={errorFor('lastName')}><input className={inputCls(errorFor('lastName'))} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} /></Field>
      <Field label={t('nickname')} error={errorFor('nickname')}><input className={inputCls(errorFor('nickname'))} value={form.nickname} onChange={(e) => setField('nickname', e.target.value)} /></Field>
      <Field label={t('university')} required error={errorFor('university')}><input className={inputCls(errorFor('university'))} value={form.university} onChange={(e) => setField('university', e.target.value)} /></Field>
      <Field label={t('faculty')} error={errorFor('faculty')}><input className={inputCls(errorFor('faculty'))} value={form.faculty} onChange={(e) => setField('faculty', e.target.value)} /></Field>
      <Field label={t('major')} error={errorFor('major')}><input className={inputCls(errorFor('major'))} value={form.major} onChange={(e) => setField('major', e.target.value)} /></Field>
      <Field label={t('studyYear')} error={errorFor('year')}><input type="number" min="1" max="8" className={inputCls(errorFor('year'))} value={form.year} onChange={(e) => setField('year', e.target.value)} /></Field>
      <Field label={t('age')} error={errorFor('age')}><input type="number" min="15" max="80" className={inputCls(errorFor('age'))} value={form.age} onChange={(e) => setField('age', e.target.value)} /></Field>
      <Field label={t('departments')} required error={errorFor('departmentId')}><select className={inputCls(errorFor('departmentId'))} value={form.departmentId} onChange={(e) => setField('departmentId', e.target.value)}><option value="">{t('selectDepartment')}</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></Field>
      <Field label={t('batch')} required error={errorFor('batchId')}><select className={inputCls(errorFor('batchId'))} value={form.batchId} onChange={(e) => { const batch = batches.find((item) => item._id === e.target.value); setField('batchId', e.target.value); if (batch && !initial) setForm((current) => ({ ...current, batchId: batch._id, startDate: toDateInput(batch.startDate), endDate: toDateInput(batch.endDate) })); }}><option value="">{t('selectBatch')}</option>{batches.map((b) => <option key={b._id} value={b._id}>{b.code} — {b.title}</option>)}</select></Field>
      <Field label={t('mentor')} error={errorFor('mentorId')}><select className={inputCls(errorFor('mentorId'))} value={form.mentorId} onChange={(e) => setField('mentorId', e.target.value)}><option value="">{t('noMentor')}</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName} ({employee.employeeCode})</option>)}</select></Field>
      <Field label={t('startDate')} required error={errorFor('startDate')}><input type="date" className={inputCls(errorFor('startDate'))} value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} /></Field>
      <Field label={t('endDate')} required error={errorFor('endDate')}><input type="date" className={inputCls(errorFor('endDate'))} value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} /></Field>
    </div>
    <Field label={t('shortBio')} error={errorFor('shortBio')}><textarea rows={2} className={inputCls(errorFor('shortBio'))} value={form.shortBio} onChange={(e) => setField('shortBio', e.target.value)} /></Field>
    <Field label={t('projectTitle')} error={errorFor('projectTitle')}><input className={inputCls(errorFor('projectTitle'))} value={form.projectTitle} onChange={(e) => setField('projectTitle', e.target.value)} /></Field>
    <ImageUpload value={initial?.profileImage} onChange={setFile} progress={uploadProgress} error={errorFor('profileImage')} label={t('profilePhoto')} placeholder={initial ? `${initial.firstName?.[0] || ''}${initial.lastName?.[0] || ''}` : 'IMG'} disabled={submitting} />
    <div className="flex flex-wrap gap-6 text-sm text-gray-700"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setField('isPublished', e.target.checked)} />{t('published')}</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.privacyConsent} onChange={(e) => setField('privacyConsent', e.target.checked)} />{t('privacyConsent')}</label></div>
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 text-sm rounded-md border border-gray-300">{t('cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white disabled:opacity-50">{submitting ? t('saving') : initial ? t('saveChanges') : t('createIntern')}</button></div>
  </form>;
}
function Field({ label, required, error, children }) { return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>{children}{error && <p className="text-xs text-red-600 mt-1">{error}</p>}</div>; }
