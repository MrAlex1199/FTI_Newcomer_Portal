import { useState } from 'react';

/**
 * Shared create/edit form. `initial` prefills for edit (undefined = create).
 * `serverErrors` is the { field: message } map the API returns on a 400, so
 * per-field server validation is shown inline alongside client checks.
 *
 * On submit it emits a payload of only the writable fields; the parent decides
 * whether that's a create or update call.
 */
const BLANK = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  nickname: '',
  position: '',
  departmentId: '',
  workEmail: '',
  extension: '',
  officeLocation: '',
  bio: '',
  skills: '',
  isPublished: true,
  isActive: true,
};

const toFormState = (employee) => {
  if (!employee) return { ...BLANK };
  return {
    employeeCode: employee.employeeCode || '',
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    nickname: employee.nickname || '',
    position: employee.position || '',
    departmentId: employee.departmentId?._id || employee.departmentId || '',
    workEmail: employee.workEmail || '',
    extension: employee.extension || '',
    officeLocation: employee.officeLocation || '',
    bio: employee.bio || '',
    skills: (employee.skills || []).join(', '),
    isPublished: employee.isPublished ?? true,
    isActive: employee.isActive ?? true,
  };
};

const REQUIRED = ['employeeCode', 'firstName', 'lastName', 'position', 'departmentId'];

export default function EmployeeForm({ initial, departments = [], onSubmit, onCancel, submitting, serverErrors = {} }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [clientErrors, setClientErrors] = useState({});

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const validate = () => {
    const errs = {};
    for (const field of REQUIRED) {
      if (!String(form[field]).trim()) errs[field] = 'This field is required';
    }
    if (form.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) {
      errs.workEmail = 'Please enter a valid email';
    }
    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      // Comma string -> trimmed array; empty -> [].
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSubmit(payload);
  };

  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee code" required error={errorFor('employeeCode')}>
          <input
            className={inputCls(errorFor('employeeCode'))}
            value={form.employeeCode}
            onChange={(e) => setField('employeeCode', e.target.value)}
          />
        </Field>
        <Field label="Position" required error={errorFor('position')}>
          <input
            className={inputCls(errorFor('position'))}
            value={form.position}
            onChange={(e) => setField('position', e.target.value)}
          />
        </Field>
        <Field label="First name" required error={errorFor('firstName')}>
          <input
            className={inputCls(errorFor('firstName'))}
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
          />
        </Field>
        <Field label="Last name" required error={errorFor('lastName')}>
          <input
            className={inputCls(errorFor('lastName'))}
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
          />
        </Field>
        <Field label="Nickname" error={errorFor('nickname')}>
          <input
            className={inputCls(errorFor('nickname'))}
            value={form.nickname}
            onChange={(e) => setField('nickname', e.target.value)}
          />
        </Field>
        <Field label="Department" required error={errorFor('departmentId')}>
          <select
            className={inputCls(errorFor('departmentId'))}
            value={form.departmentId}
            onChange={(e) => setField('departmentId', e.target.value)}
          >
            <option value="">Select a department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work email" error={errorFor('workEmail')}>
          <input
            className={inputCls(errorFor('workEmail'))}
            value={form.workEmail}
            onChange={(e) => setField('workEmail', e.target.value)}
          />
        </Field>
        <Field label="Extension" error={errorFor('extension')}>
          <input
            className={inputCls(errorFor('extension'))}
            value={form.extension}
            onChange={(e) => setField('extension', e.target.value)}
          />
        </Field>
        <Field label="Office location" error={errorFor('officeLocation')}>
          <input
            className={inputCls(errorFor('officeLocation'))}
            value={form.officeLocation}
            onChange={(e) => setField('officeLocation', e.target.value)}
          />
        </Field>
        <Field label="Skills (comma separated)" error={errorFor('skills')}>
          <input
            className={inputCls(errorFor('skills'))}
            value={form.skills}
            onChange={(e) => setField('skills', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Bio" error={errorFor('bio')}>
        <textarea
          rows={3}
          className={inputCls(errorFor('bio'))}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setField('isPublished', e.target.checked)}
          />
          Published (visible in directory)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
          />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : initial ? 'Save changes' : 'Create employee'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`;
