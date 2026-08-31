import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { ErrorState, LoadingState } from '../components/common/states.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { useProfile, useUpdateProfile } from '../hooks/useProfile.js';

const EMPTY_FORM = { email: '', firstName: '', lastName: '', nickname: '' };

export default function ProfileSettings() {
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const profileQuery = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!profileQuery.data) return;
    const { user, profile } = profileQuery.data;
    setForm({
      email: user?.email || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      nickname: profile?.nickname || '',
    });
    setPreview(profile?.profileImage || '');
  }, [profileQuery.data]);

  const profile = profileQuery.data?.profile;
  const recordType = profileQuery.data?.recordType;
  const isDirty = useMemo(() => Boolean(file) || Boolean(profileQuery.data && JSON.stringify(form) !== JSON.stringify({
    email: profileQuery.data.user?.email || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    nickname: profile?.nickname || '',
  })), [file, form, profileQuery.data, profile]);

  const set = (field, value) => {
    setSuccess('');
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const chooseFile = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setSuccess('');
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});
    try {
      await update.mutateAsync({ payload: form, file });
      await refreshUser();
      setFile(null);
      setSuccess(t('profileUpdated'));
    } catch (requestError) {
      const response = requestError.response?.data;
      setError(response?.message || t('profileLoadError'));
      setFieldErrors(response?.errors || {});
    }
  };

  if (profileQuery.isLoading) return <AppShell><LoadingState label={t('loadingData')} /></AppShell>;
  if (profileQuery.isError) return <AppShell><ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} /></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm text-gray-500">{t('dashboard')} / {t('profileSettings')}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">{t('profileSettings')}</h1>
          <p className="mt-1 text-gray-500">{t('profileSettingsDesc')}</p>
        </div>

        <form onSubmit={save} className="space-y-6">
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">⚠️ {error}</p>}
          {success && <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">✅ {success}</p>}

          <section className="app-card" aria-labelledby="profile-photo-heading">
            <h2 id="profile-photo-heading" className="text-lg font-semibold text-gray-800">{t('profilePhoto')}</h2>
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {preview ? <img src={preview} alt="" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary-50" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-100 text-3xl text-primary-700" aria-hidden="true">👤</div>}
              <div>
                <label className="btn-ghost cursor-pointer">
                  📷 {t('choosePhoto')}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} className="sr-only" />
                </label>
                <p className="mt-2 text-xs text-gray-500">PNG, JPG, or WebP. The image is resized securely by the server.</p>
              </div>
            </div>
          </section>

          <section className="app-card" aria-labelledby="profile-details-heading">
            <div className="flex items-start gap-3">
              <span className="icon-tile" aria-hidden="true">🪪</span>
              <div>
                <h2 id="profile-details-heading" className="text-lg font-semibold text-gray-800">{t('profile')}</h2>
                <p className="mt-1 text-sm text-gray-500">{recordType ? `${recordType} directory profile` : t('profileNoLinkedRecord')}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField label={t('firstName')} value={form.firstName} onChange={(value) => set('firstName', value)} error={fieldErrors.firstName} />
              <ProfileField label={t('lastName')} value={form.lastName} onChange={(value) => set('lastName', value)} error={fieldErrors.lastName} />
              <ProfileField label={t('nickname')} value={form.nickname} onChange={(value) => set('nickname', value)} error={fieldErrors.nickname} />
              <ProfileField label={t('accountEmail')} type="email" value={form.email} onChange={(value) => set('email', value)} error={fieldErrors.email} help={t('emailHelp')} />
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={update.isPending || !isDirty} className="btn-primary">
              {update.isPending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />{t('saving')}</> : <>💾 {t('saveProfile')}</>}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function ProfileField({ label, value, onChange, error, type = 'text', help }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`field mt-1 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`} />
      {help && !error && <span className="mt-1 block text-xs font-normal text-gray-500">{help}</span>}
      {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
