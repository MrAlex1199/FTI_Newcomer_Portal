import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import ImageUpload from '../common/ImageUpload.jsx';

const BLANK = {
  employeeCode: '', firstName: '', lastName: '', nickname: '', position: '', departmentId: '',
  workEmail: '', extension: '', officeLocation: '', bio: '', skills: '', isPublished: true, isActive: true,
};

const toFormState = (employee) => employee ? {
  employeeCode: employee.employeeCode || '', firstName: employee.firstName || '', lastName: employee.lastName || '',
  nickname: employee.nickname || '', position: employee.position || '', departmentId: employee.departmentId?._id || employee.departmentId || '',
  workEmail: employee.workEmail || '', extension: employee.extension || '', officeLocation: employee.officeLocation || '',
  bio: employee.bio || '', skills: (employee.skills || []).join(', '), isPublished: employee.isPublished ?? true, isActive: employee.isActive ?? true,
} : { ...BLANK };
const REQUIRED = ['employeeCode', 'firstName', 'lastName', 'position', 'departmentId'];

export default function EmployeeForm({ initial, departments = [], onSubmit, onCancel, submitting, uploadProgress, serverErrors = {} }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => toFormState(initial));
  const [file, setFile] = useState(null);
  const [clientErrors, setClientErrors] = useState({});
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const validate = () => {
    const errors = {};
    REQUIRED.forEach((field) => { if (!String(form[field]).trim()) errors[field] = t('requiredField'); });
    if (form.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) errors.workEmail = t('validEmail');
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) }, file);
  };
  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  return <form onSubmit={submit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label={t('employeeCode')} required error={errorFor('employeeCode')}><input className={inputCls(errorFor('employeeCode'))} value={form.employeeCode} onChange={(e) => setField('employeeCode', e.target.value)} /></Field>
      <Field label={t('position')} required error={errorFor('position')}><input className={inputCls(errorFor('position'))} value={form.position} onChange={(e) => setField('position', e.target.value)} /></Field>
      <Field label={t('firstName')} required error={errorFor('firstName')}><input className={inputCls(errorFor('firstName'))} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} /></Field>
      <Field label={t('lastName')} required error={errorFor('lastName')}><input className={inputCls(errorFor('lastName'))} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} /></Field>
      <Field label={t('nickname')} error={errorFor('nickname')}><input className={inputCls(errorFor('nickname'))} value={form.nickname} onChange={(e) => setField('nickname', e.target.value)} /></Field>
      <Field label={t('departments')} required error={errorFor('departmentId')}><select className={inputCls(errorFor('departmentId'))} value={form.departmentId} onChange={(e) => setField('departmentId', e.target.value)}><option value="">{t('selectDepartment')}</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></Field>
      <Field label={t('workEmail')} error={errorFor('workEmail')}><input className={inputCls(errorFor('workEmail'))} value={form.workEmail} onChange={(e) => setField('workEmail', e.target.value)} /></Field>
      <Field label={t('extension')} error={errorFor('extension')}><input className={inputCls(errorFor('extension'))} value={form.extension} onChange={(e) => setField('extension', e.target.value)} /></Field>
      <Field label={t('officeLocation')} error={errorFor('officeLocation')}><input className={inputCls(errorFor('officeLocation'))} value={form.officeLocation} onChange={(e) => setField('officeLocation', e.target.value)} /></Field>
      <Field label={t('skills')} error={errorFor('skills')}><input className={inputCls(errorFor('skills'))} value={form.skills} onChange={(e) => setField('skills', e.target.value)} /></Field>
    </div>
    <Field label={t('bio')} error={errorFor('bio')}><textarea rows={3} className={inputCls(errorFor('bio'))} value={form.bio} onChange={(e) => setField('bio', e.target.value)} /></Field>
    <ImageUpload value={initial?.profileImage} onChange={setFile} progress={uploadProgress} error={errorFor('profileImage')} label={t('profilePhoto')} placeholder={initial ? `${initial.firstName?.[0] || ''}${initial.lastName?.[0] || ''}` : 'IMG'} disabled={submitting} />
    <div className="flex items-center gap-6"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isPublished} onChange={(e) => setField('isPublished', e.target.checked)} />{t('publishedVisible')}</label><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />{t('active')}</label></div>
    <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 text-sm rounded-md border border-gray-300">{t('cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white font-medium disabled:opacity-50">{submitting ? t('saving') : initial ? t('saveChanges') : t('createEmployee')}</button></div>
  </form>;
}
function Field({ label, required, error, children }) { return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>{children}{error && <p className="text-xs text-red-600 mt-1">{error}</p>}</div>; }
const inputCls = (hasError) => `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${hasError ? 'border-red-400' : 'border-gray-300'}`;
