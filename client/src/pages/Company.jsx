import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { useCompanyInfo, useUpdateCompanyInfo } from '../hooks/useCompanyInfo.js';
import OfficeMap from '../components/content/OfficeMap.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';

const EMPTY = {
  name: '',
  tagline: '',
  overview: '',
  mission: '',
  vision: '',
  history: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  latitude: '',
  longitude: '',
  officePoints: [],
};

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function Company() {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const canManage = hasPermission('knowledge:manage');
  const { data: company, isLoading, isError, error } = useCompanyInfo();
  const updateMutation = useUpdateCompanyInfo();
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const save = async (payload) => {
    setFormError('');
    try {
      await updateMutation.mutateAsync(payload);
      setFormOpen(false);
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('unableLoad')));
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          {t('loadingCompany')}
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {errorMessage(error, t('unableLoad'))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            {t('dashboard')} / {t('companyInfo')}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {company.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{company.tagline}</p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setFormOpen(true);
            }}
            className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition shrink-0"
          >
            {t('editCompany')}
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800">{t('aboutUs')}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {company.overview}
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <InfoSection title={t('mission')} value={company.mission} />
            <InfoSection title={t('vision')} value={company.vision} />
          </div>
          <InfoSection title={t('history')} value={company.history} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">{t('contact')}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <ContactItem label={t('address')} value={company.address} />
            <ContactItem
              label={t('phone')}
              value={company.phone}
              href={company.phone ? `tel:${company.phone}` : ''}
            />
            <ContactItem
              label={t('email')}
              value={company.email}
              href={company.email ? `mailto:${company.email}` : ''}
            />
            <ContactItem
              label={t('website')}
              value={company.website}
              href={company.website}
            />
          </dl>
        </section>
      </div>

      <div className="mt-6">
        <OfficeMap company={company} />
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t('editCompanyTitle')}
        size="lg"
      >
        <CompanyForm
          initial={company}
          onSubmit={save}
          onCancel={() => setFormOpen(false)}
          submitting={updateMutation.isPending}
          formError={formError}
        />
      </Modal>
    </AppShell>
  );
}

function InfoSection({ title, value }) {
  const { t } = useLanguage();
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
        {value || t('informationSoon')}
      </p>
    </section>
  );
}

function ContactItem({ label, value, href }) {
  const { t } = useLanguage();
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400 font-medium">
        {label}
      </dt>
      <dd className="mt-1 text-slate-700 break-words font-medium">
        {href ? (
          <a
            href={href}
            target={label === t('website') ? '_blank' : undefined}
            rel={label === t('website') ? 'noreferrer' : undefined}
            className="text-primary-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          value || t('notProvided')
        )}
      </dd>
    </div>
  );
}

function CompanyForm({ initial, onSubmit, onCancel, submitting, formError }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => toForm(initial));
  const [jsonError, setJsonError] = useState('');

  useEffect(() => setForm(toForm(initial)), [initial]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    let officePoints;
    try {
      officePoints = JSON.parse(form.officePointsJson || '[]');
      setJsonError('');
    } catch {
      setJsonError(t('invalidJson') || 'JSON ไม่ถูกต้อง');
      return;
    }
    onSubmit({
      name: form.name,
      tagline: form.tagline,
      overview: form.overview,
      mission: form.mission,
      vision: form.vision,
      history: form.history,
      address: form.address,
      phone: form.phone,
      email: form.email,
      website: form.website,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      mapProvider: 'openstreetmap',
      officePoints,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {formError}
        </p>
      )}
      {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('companyName')}
          value={form.name}
          onChange={(value) => set('name', value)}
          required
        />
        <Field
          label={t('tagline')}
          value={form.tagline}
          onChange={(value) => set('tagline', value)}
        />
      </div>
      <TextField
        label={t('overview')}
        value={form.overview}
        onChange={(value) => set('overview', value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('mission')}
          value={form.mission}
          onChange={(value) => set('mission', value)}
        />
        <TextField
          label={t('vision')}
          value={form.vision}
          onChange={(value) => set('vision', value)}
        />
      </div>
      <TextField
        label={t('history')}
        value={form.history}
        onChange={(value) => set('history', value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('address')}
          value={form.address}
          onChange={(value) => set('address', value)}
        />
        <Field
          label={t('phone')}
          value={form.phone}
          onChange={(value) => set('phone', value)}
        />
        <Field
          label={t('email')}
          type="email"
          value={form.email}
          onChange={(value) => set('email', value)}
        />
        <Field
          label={t('website')}
          type="url"
          value={form.website}
          onChange={(value) => set('website', value)}
        />
        <Field
          label={t('latitude')}
          type="number"
          value={form.latitude}
          onChange={(value) => set('latitude', value)}
        />
        <Field
          label={t('longitude')}
          type="number"
          value={form.longitude}
          onChange={(value) => set('longitude', value)}
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {t('officePointsJson')}
        </span>
        <textarea
          value={form.officePointsJson}
          onChange={(event) => set('officePointsJson', event.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        <span className="mt-1 block text-xs text-gray-500">
          {t('officePointsHelp')}
        </span>
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? t('saving') : t('saveCompany')}
        </button>
      </div>
    </form>
  );
}

function toForm(company) {
  const value = { ...EMPTY, ...(company || {}) };
  return {
    ...value,
    officePointsJson: JSON.stringify(value.officePoints || [], null, 2),
  };
}

function Field({ label: fieldLabel, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {fieldLabel}
        {required && ' *'}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={type === 'number' ? 'any' : undefined}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  );
}

function TextField({ label: fieldLabel, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {fieldLabel}
      </span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  );
}
