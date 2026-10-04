import { useState, useMemo, useEffect } from 'react';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import {
  useAnnouncementCategories,
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useUpdateAnnouncement,
} from '../hooks/useAnnouncements.js';
import AppShell from '../components/layout/AppShell.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ImageUpload from '../components/common/ImageUpload.jsx';
import { RichTextEditor } from '../components/content/RichText.jsx';

import AnnouncementHero from '../components/announcements/AnnouncementHero.jsx';
import CategoryPills from '../components/announcements/CategoryPills.jsx';
import AnnouncementCard from '../components/announcements/AnnouncementCard.jsx';
import AnnouncementListItem from '../components/announcements/AnnouncementListItem.jsx';
import AnnouncementReaderModal from '../components/announcements/AnnouncementReaderModal.jsx';

const PAGE_SIZE = 9;
const EMPTY_ANNOUNCEMENT = {
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  category: 'news',
  priority: 0,
  targetRoles: [],
  publishAt: '',
  expireAt: '',
  isPinned: false,
  status: 'draft',
};

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const toIso = (value) => (value ? new Date(value).toISOString() : undefined);
const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function Announcements() {
  const { hasPermission } = useAuth();
  const { t, label, currentLanguage } = useLanguage();
  const canManage = hasPermission('announcements:manage');

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // View mode switcher: 'grid' | 'list'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('fti_announcements_view') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('fti_announcements_view', mode);
    } catch (e) {
      console.warn('Failed to save view mode to localStorage', e);
    }
  };

  // Reader & CRUD Modal states
  const [activeReaderAnnouncement, setActiveReaderAnnouncement] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // API parameters
  const params = {
    search,
    category,
    page,
    limit: PAGE_SIZE,
    ...(canManage && status ? { status } : {}),
  };

  const { data, isLoading, isError, error, isFetching } = useAnnouncements(params);
  const { data: catalog } = useAnnouncementCategories();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const categories = catalog?.categories || [];
  const roles = catalog?.roles || [];
  const announcements = data?.data || [];

  // Filter by role client-side if selected
  const visibleAnnouncements = useMemo(() => {
    if (!roleFilter) return announcements;
    return announcements.filter((item) => {
      const targetRoles = item.targetRoles || [];
      return targetRoles.length === 0 || targetRoles.includes(roleFilter);
    });
  }, [announcements, roleFilter]);

  // Determine smart spotlight announcement (Urgent first, then Pinned)
  const spotlightAnnouncement = useMemo(() => {
    if (page !== 1 || search.trim() || category) return null;
    const urgent = announcements.find((a) => a.category === 'urgent' && a.status === 'published');
    if (urgent) return urgent;
    const pinned = announcements.find((a) => a.isPinned && a.status === 'published');
    return pinned || null;
  }, [announcements, page, search, category]);

  const reset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openForm = (item = null) => {
    setEditing(item);
    setServerErrors({});
    setFormError('');
    setUploadProgress(0);
    setFormOpen(true);
  };

  const submit = async (payload, file) => {
    setServerErrors({});
    setFormError('');
    setUploadProgress(0);
    try {
      const input = {
        payload,
        file,
        onUploadProgress: (event) =>
          setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
      };
      if (editing) await updateMutation.mutateAsync({ id: editing._id, ...input });
      else await createMutation.mutateAsync(input);
      setFormOpen(false);
    } catch (requestError) {
      const response = requestError.response?.data;
      setServerErrors(response?.errors || {});
      setFormError(response?.message || t('saveAnnouncementError'));
    }
  };

  const toggle = async (item) => {
    try {
      await updateMutation.mutateAsync({
        id: item._id,
        payload: { status: item.status === 'published' ? 'draft' : 'published' },
      });
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('announcementPublicationError')));
    }
  };

  const remove = async () => {
    try {
      await deleteMutation.mutateAsync(deleting._id);
      setDeleting(null);
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('deleteAnnouncementError')));
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('dashboard')} / {t('announcements')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {t('announcementsTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t('announcementsSubtitle')}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 dark:bg-primary-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-700 dark:hover:bg-primary-600 transition-all active:scale-95 shrink-0"
            >
              <span>+</span>
              <span>{t('addAnnouncement')}</span>
            </button>
          )}
        </div>

        {/* Smart Hero Spotlight (Urgent or Pinned Announcement) */}
        {spotlightAnnouncement && (
          <AnnouncementHero
            spotlightAnnouncement={spotlightAnnouncement}
            onOpenReader={setActiveReaderAnnouncement}
          />
        )}

        {/* Category Pills Navigation */}
        <div className="pt-1">
          <CategoryPills
            categories={categories}
            activeCategory={category}
            onSelectCategory={reset(setCategory)}
          />
        </div>

        {/* Unified Search & Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-2xs">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => reset(setSearch)(e.target.value)}
              placeholder={t('searchAnnouncements')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => reset(setSearch)('')}
                className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Filters and View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Role Filter */}
            {roles.length > 0 && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:outline-hidden"
              >
                <option value="">{t('filterAllRoles')}</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {label(r)}
                  </option>
                ))}
              </select>
            )}

            {/* Admin Status Filter */}
            {canManage && (
              <select
                value={status}
                onChange={(e) => reset(setStatus)(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:outline-hidden"
              >
                <option value="">{t('allAnnouncementStatuses')}</option>
                {['published', 'scheduled', 'draft', 'expired', 'archived'].map((item) => (
                  <option key={item} value={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            )}

            {/* Dual View Switcher (Cards Grid ⊞ vs Compact List ☰) */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                title={t('cardsView')}
                aria-label={t('cardsView')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⊞
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                title={t('listView')}
                aria-label={t('listView')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            {formError}
          </div>
        )}

        {/* Loading state skeleton */}
        {isLoading && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-3'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div
                  className={
                    viewMode === 'grid'
                      ? 'h-48 rounded-xl bg-slate-200 dark:bg-slate-800'
                      : 'h-16 rounded-xl bg-slate-200 dark:bg-slate-800'
                  }
                />
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        )}

        {/* Server Error state */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-8 text-center text-rose-700 dark:text-rose-300">
            <p className="font-bold text-base">{errorMessage(error, t('unableLoad'))}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && visibleAnnouncements.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-12 text-center">
            <span className="text-4xl">📢</span>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
              {t('noAnnouncements')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {currentLanguage === 'th'
                ? 'ไม่มีประกาศที่ตรงกับตัวกรองหรือคำค้นหาของคุณในขณะนี้'
                : 'No announcements match the current filters or search term.'}
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => openForm()}
                className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
              >
                <span>+</span>
                <span>{t('addAnnouncement')}</span>
              </button>
            )}
          </div>
        )}

        {/* Announcement Feed (Cards Grid or Compact List View) */}
        {!isLoading && !isError && visibleAnnouncements.length > 0 && (
          <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleAnnouncements.map((item) => (
                  <AnnouncementCard
                    key={item._id}
                    announcement={item}
                    canManage={canManage}
                    onOpenReader={setActiveReaderAnnouncement}
                    onEdit={openForm}
                    onToggleStatus={toggle}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAnnouncements.map((item) => (
                  <AnnouncementListItem
                    key={item._id}
                    announcement={item}
                    canManage={canManage}
                    onOpenReader={setActiveReaderAnnouncement}
                    onEdit={openForm}
                    onToggleStatus={toggle}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && (
          <div className="pt-2">
            <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />
          </div>
        )}

        {/* Slide-over / Rich Modal Reader */}
        <AnnouncementReaderModal
          announcement={activeReaderAnnouncement}
          isOpen={!!activeReaderAnnouncement}
          onClose={() => setActiveReaderAnnouncement(null)}
        />

        {/* Admin Create / Edit Modal Form */}
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? t('editAnnouncement') : t('createAnnouncement')}
          size="lg"
        >
          <AnnouncementForm
            initial={editing}
            categories={categories}
            roles={roles}
            onSubmit={submit}
            onCancel={() => setFormOpen(false)}
            submitting={createMutation.isPending || updateMutation.isPending}
            uploadProgress={uploadProgress}
            serverErrors={serverErrors}
            formError={formError}
          />
        </Modal>

        {/* Admin Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          title={t('deleteAnnouncement')}
          message={
            deleting ? t('deleteAnnouncementConfirm', { name: deleting.title }) : ''
          }
          confirmLabel={t('delete')}
          loading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}

function AnnouncementForm({
  initial,
  categories,
  roles,
  onSubmit,
  onCancel,
  submitting,
  uploadProgress,
  serverErrors,
  formError,
}) {
  const { t, label } = useLanguage();
  const [form, setForm] = useState(() => toForm(initial));
  const [file, setFile] = useState(null);

  useEffect(() => {
    setForm(toForm(initial));
    setFile(null);
  }, [initial]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleRole = (role) =>
    set(
      'targetRoles',
      form.targetRoles.includes(role)
        ? form.targetRoles.filter((item) => item !== role)
        : [...form.targetRoles, role]
    );

  const submit = (event) => {
    event.preventDefault();
    onSubmit(
      {
        ...form,
        priority: Number(form.priority),
        publishAt: toIso(form.publishAt),
        expireAt: toIso(form.expireAt),
      },
      file
    );
  };

  const fieldError = (field) => serverErrors[field];

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <Field
        label={t('title')}
        value={form.title}
        onChange={(value) => set('title', value)}
        error={fieldError('title')}
        required
      />
      <Field
        label={t('summary')}
        value={form.summary}
        onChange={(value) => set('summary', value)}
        error={fieldError('summary')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t('category')}
          value={form.category}
          onChange={(value) => set('category', value)}
          options={categories}
          labelFor={label}
        />
        <Field
          label={t('priority')}
          type="number"
          value={form.priority}
          onChange={(value) => set('priority', value)}
          error={fieldError('priority')}
        />
      </div>
      <RichTextEditor
        label={t('announcementContent')}
        value={form.content}
        onChange={(value) => set('content', value)}
        error={fieldError('content')}
      />
      <ImageUpload
        value={form.coverImage}
        onChange={setFile}
        progress={uploadProgress}
        error={fieldError('coverImage')}
        label={t('announcementCover')}
        placeholder="ANN"
        disabled={submitting}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('publishAt')}
          type="datetime-local"
          value={form.publishAt}
          onChange={(value) => set('publishAt', value)}
          error={fieldError('publishAt')}
        />
        <Field
          label={t('expireAt')}
          type="datetime-local"
          value={form.expireAt}
          onChange={(value) => set('expireAt', value)}
          error={fieldError('expireAt')}
        />
      </div>
      <SelectField
        label={t('status')}
        value={form.status}
        onChange={(value) => set('status', value)}
        options={['draft', 'published', 'archived']}
        labelFor={label}
      />
      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('targetRoles')}
        </span>
        <div className="flex flex-wrap gap-3">
          {roles.map((role) => (
            <label
              key={role}
              className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form.targetRoles.includes(role)}
                onChange={() => toggleRole(role)}
                className="mr-2 rounded text-primary-600 focus:ring-primary-500"
              />
              {label(role)}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {t('targetRolesHelp')}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPinned}
          onChange={(event) => set('isPinned', event.target.checked)}
          className="rounded text-amber-600 focus:ring-amber-500"
        />
        <span>{t('pinAnnouncement')}</span>
      </label>
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-xs"
        >
          {submitting ? t('saving') : t('saveAnnouncement')}
        </button>
      </div>
    </form>
  );
}

function toForm(announcement) {
  if (!announcement) return { ...EMPTY_ANNOUNCEMENT };
  return {
    ...EMPTY_ANNOUNCEMENT,
    ...announcement,
    publishAt: toLocalInput(announcement.publishAt),
    expireAt: toLocalInput(announcement.expireAt),
    targetRoles: announcement.targetRoles || [],
  };
}

function Field({ label: fieldLabel, value, onChange, error, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {fieldLabel}
        {required && ' *'}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={`w-full rounded-xl border px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden transition-all ${
          error
            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-300 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40'
        }`}
      />
      {error && <span className="text-xs text-rose-600 mt-1 block">{error}</span>}
    </label>
  );
}

function SelectField({ label: fieldLabel, value, onChange, options, labelFor }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {fieldLabel}
      </span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 outline-hidden"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labelFor ? labelFor(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
