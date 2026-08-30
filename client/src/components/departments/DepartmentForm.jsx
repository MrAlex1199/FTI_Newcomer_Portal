import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

const BLANK = {
  name: '',
  code: '',
  description: '',
  responsibilities: '',
  contactTopics: '',
  managerId: '',
  location: '',
  extension: '',
  sortOrder: 0,
  isActive: true,
};

const toFormState = (department) => {
  if (!department) return { ...BLANK };
  return {
    name: department.name || '',
    code: department.code || '',
    description: department.description || '',
    responsibilities: (department.responsibilities || []).join(', '),
    contactTopics: (department.contactTopics || []).join(', '),
    managerId: department.managerId?._id || department.managerId || '',
    location: department.location || '',
    extension: department.extension || '',
    sortOrder: department.sortOrder ?? 0,
    isActive: department.isActive ?? true,
  };
};

const listFromText = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const inputCls = (error) => `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-400' : 'border-gray-300'}`;

export default function DepartmentForm({ initial, employees = [], onSubmit, onCancel, submitting, serverErrors = {} }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => toFormState(initial));
  const [clientErrors, setClientErrors] = useState({});

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = t('departmentNameRequired');
    if (!form.code.trim()) errors.code = t('departmentCodeRequired');
    if (form.sortOrder === '' || Number(form.sortOrder) < 0) errors.sortOrder = t('sortOrderNonNegative');
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
      responsibilities: listFromText(form.responsibilities),
      contactTopics: listFromText(form.contactTopics),
      managerId: form.managerId || null,
      sortOrder: Number(form.sortOrder),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('departmentName')} required error={errorFor('name')}>
          <input className={inputCls(errorFor('name'))} value={form.name} onChange={(e) => setField('name', e.target.value)} />
        </Field>
        <Field label={t('code')} required error={errorFor('code')}>
          <input className={inputCls(errorFor('code'))} value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="e.g. IT" />
        </Field>
        <Field label={t('location')} error={errorFor('location')}>
          <input className={inputCls(errorFor('location'))} value={form.location} onChange={(e) => setField('location', e.target.value)} />
        </Field>
        <Field label={t('extension')} error={errorFor('extension')}>
          <input className={inputCls(errorFor('extension'))} value={form.extension} onChange={(e) => setField('extension', e.target.value)} />
        </Field>
        <Field label={t('managerField')} error={errorFor('managerId')}>
          <select
            className={inputCls(errorFor('managerId'))}
            value={form.managerId}
            onChange={(e) => setField('managerId', e.target.value)}
            disabled={!initial}
          >
            <option value="">{t('noManager')}</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.firstName} {employee.lastName} ({employee.employeeCode})
              </option>
            ))}
          </select>
          {!initial && <p className="text-xs text-gray-500 mt-1">{t('assignManagerHelp')}</p>}
        </Field>
        <Field label={t('sortOrder')} error={errorFor('sortOrder')}>
          <input type="number" min="0" className={inputCls(errorFor('sortOrder'))} value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} />
        </Field>
      </div>

      <Field label={t('description')} error={errorFor('description')}>
        <textarea rows={3} className={inputCls(errorFor('description'))} value={form.description} onChange={(e) => setField('description', e.target.value)} />
      </Field>
      <Field label={t('responsibilities')} error={errorFor('responsibilities')}>
        <input className={inputCls(errorFor('responsibilities'))} value={form.responsibilities} onChange={(e) => setField('responsibilities', e.target.value)} />
      </Field>
      <Field label={t('contactTopicsField')} error={errorFor('contactTopics')}>
        <input className={inputCls(errorFor('contactTopics'))} value={form.contactTopics} onChange={(e) => setField('contactTopics', e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
        {t('activeDepartment')}
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{t('cancel')}</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50">
          {submitting ? t('saving') : initial ? t('saveChanges') : t('createDepartment')}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
