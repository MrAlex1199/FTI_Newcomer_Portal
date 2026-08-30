import { useEffect, useState } from 'react';
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
import SearchBar from '../components/common/SearchBar.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ImageUpload, { ImageWithFallback } from '../components/common/ImageUpload.jsx';
import ContentBadge from '../components/content/ContentBadge.jsx';
import { RichTextEditor, RichTextRenderer } from '../components/content/RichText.jsx';

const PAGE_SIZE = 8;
const EMPTY_ANNOUNCEMENT = {
  title: '', summary: '', content: '', coverImage: '', category: 'news', priority: 0,
  targetRoles: [], publishAt: '', expireAt: '', isPinned: false, status: 'draft',
};

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIso = (value) => value ? new Date(value).toISOString() : undefined;
const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function Announcements() {
  const { hasPermission } = useAuth();
  const { t, label, locale } = useLanguage();
  const canManage = hasPermission('announcements:manage');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const params = { search, category, page, limit: PAGE_SIZE, ...(canManage && status ? { status } : {}) };
  const { data, isLoading, isError, error, isFetching } = useAnnouncements(params);
  const { data: catalog } = useAnnouncementCategories();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const categories = catalog?.categories || [];
  const roles = catalog?.roles || [];
  const announcements = data?.data || [];

  const reset = (setter) => (value) => { setter(value); setPage(1); };
  const open = (item = null) => {
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
        onUploadProgress: (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
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
      await updateMutation.mutateAsync({ id: item._id, payload: { status: item.status === 'published' ? 'draft' : 'published' } });
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-500">{t('dashboard')} / {t('announcements')}</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{t('announcementsTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('announcementsSubtitle')}</p>
        </div>
        {canManage && <button type="button" onClick={() => open()} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 shrink-0">{t('addAnnouncement')}</button>}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <SearchBar value={search} onSearch={reset(setSearch)} placeholder={t('searchAnnouncements')} />
        <select value={category} onChange={(event) => reset(setCategory)(event.target.value)} className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
          <option value="">{t('allAnnouncementCategories')}</option>
          {categories.map((item) => <option key={item} value={item}>{label(item)}</option>)}
        </select>
        {canManage && <select value={status} onChange={(event) => reset(setStatus)(event.target.value)} className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
          <option value="">{t('allAnnouncementStatuses')}</option>
          {['published', 'scheduled', 'draft', 'expired', 'archived'].map((item) => <option key={item} value={item}>{label(item)}</option>)}
        </select>}
      </div>

      {formError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>}
      {isLoading && <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">{t('loadingAnnouncements')}</div>}
      {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">{errorMessage(error, t('unableLoad'))}</div>}
      {!isLoading && !isError && announcements.length === 0 && <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">{t('noAnnouncements')}</div>}
      {announcements.length > 0 && <div className={`space-y-4 ${isFetching ? 'opacity-70' : ''}`}>{announcements.map((item) => <AnnouncementCard key={item._id} announcement={item} canManage={canManage} locale={locale} onEdit={open} onToggle={toggle} onDelete={setDeleting} />)}</div>}
      {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('editAnnouncement') : t('createAnnouncement')} size="lg">
        <AnnouncementForm initial={editing} categories={categories} roles={roles} onSubmit={submit} onCancel={() => setFormOpen(false)} submitting={createMutation.isPending || updateMutation.isPending} uploadProgress={uploadProgress} serverErrors={serverErrors} formError={formError} />
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title={t('deleteAnnouncement')} message={deleting ? t('deleteAnnouncementConfirm', { name: deleting.title }) : ''} confirmLabel={t('delete')} loading={deleteMutation.isPending} />
    </AppShell>
  );
}

function AnnouncementCard({ announcement, canManage, locale, onEdit, onToggle, onDelete }) {
  const { t, label } = useLanguage();
  const formattedDate = announcement.publishAt ? new Date(announcement.publishAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const expiry = announcement.expireAt ? new Date(announcement.expireAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const author = announcement.authorId?.username;
  return (
    <article className={`bg-white border rounded-xl overflow-hidden shadow-sm ${announcement.isPinned ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="grid md:grid-cols-[12rem_1fr]">
        {announcement.coverImage ? <ImageWithFallback src={announcement.coverImage} alt="" className="w-full h-40 md:h-full object-cover" fallback="ANN" /> : <div className="h-3 md:h-full bg-gradient-to-br from-primary-500 to-cyan-400" />}
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">{announcement.title}</h2>
                {announcement.isPinned && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">{t('pinned')}</span>}
                {canManage && <ContentBadge value={announcement.displayStatus || announcement.status} />}
              </div>
              <p className="text-sm text-primary-600 mt-1">{label(announcement.category)}</p>
            </div>
            {canManage && <div className="flex gap-3 text-sm shrink-0"><button type="button" onClick={() => onEdit(announcement)} className="text-primary-600 hover:underline">{t('edit')}</button><button type="button" onClick={() => onToggle(announcement)} className="text-amber-700 hover:underline">{announcement.status === 'published' ? t('unpublish') : t('publish')}</button><button type="button" onClick={() => onDelete(announcement)} className="text-red-600 hover:underline">{t('delete')}</button></div>}
          </div>
          {announcement.summary && <p className="text-gray-600 mt-3">{announcement.summary}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-3">
            {formattedDate && <span>{t('publishedAt', { date: formattedDate })}</span>}
            {expiry && <span>{t('expiresAt', { date: expiry })}</span>}
            {author && <span>{t('announcementAuthor', { name: author })}</span>}
          </div>
          <details className="mt-4 border-t border-gray-100 pt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary-700">{t('readAnnouncement')}</summary>
            <div className="mt-3"><RichTextRenderer content={announcement.content} /></div>
          </details>
        </div>
      </div>
    </article>
  );
}

function AnnouncementForm({ initial, categories, roles, onSubmit, onCancel, submitting, uploadProgress, serverErrors, formError }) {
  const { t, label } = useLanguage();
  const [form, setForm] = useState(() => toForm(initial));
  const [file, setFile] = useState(null);
  useEffect(() => { setForm(toForm(initial)); setFile(null); }, [initial]);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleRole = (role) => set('targetRoles', form.targetRoles.includes(role) ? form.targetRoles.filter((item) => item !== role) : [...form.targetRoles, role]);
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, priority: Number(form.priority), publishAt: toIso(form.publishAt), expireAt: toIso(form.expireAt) }, file);
  };
  const fieldError = (field) => serverErrors[field];
  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <Field label={t('title')} value={form.title} onChange={(value) => set('title', value)} error={fieldError('title')} required />
      <Field label={t('summary')} value={form.summary} onChange={(value) => set('summary', value)} error={fieldError('summary')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t('category')} value={form.category} onChange={(value) => set('category', value)} options={categories} labelFor={label} />
        <Field label={t('priority')} type="number" value={form.priority} onChange={(value) => set('priority', value)} error={fieldError('priority')} />
      </div>
      <RichTextEditor label={t('announcementContent')} value={form.content} onChange={(value) => set('content', value)} error={fieldError('content')} />
      <ImageUpload value={form.coverImage} onChange={setFile} progress={uploadProgress} error={fieldError('coverImage')} label={t('announcementCover')} placeholder="ANN" disabled={submitting} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('publishAt')} type="datetime-local" value={form.publishAt} onChange={(value) => set('publishAt', value)} error={fieldError('publishAt')} />
        <Field label={t('expireAt')} type="datetime-local" value={form.expireAt} onChange={(value) => set('expireAt', value)} error={fieldError('expireAt')} />
      </div>
      <SelectField label={t('status')} value={form.status} onChange={(value) => set('status', value)} options={['draft', 'published', 'archived']} labelFor={label} />
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">{t('targetRoles')}</span>
        <div className="flex flex-wrap gap-3">{roles.map((role) => <label key={role} className="text-sm text-gray-600"><input type="checkbox" checked={form.targetRoles.includes(role)} onChange={() => toggleRole(role)} className="mr-1" />{label(role)}</label>)}</div>
        <p className="text-xs text-gray-500 mt-1">{t('targetRolesHelp')}</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isPinned} onChange={(event) => set('isPinned', event.target.checked)} />{t('pinAnnouncement')}</label>
      <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">{t('cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white font-medium disabled:opacity-50">{submitting ? t('saving') : t('saveAnnouncement')}</button></div>
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
  return <label className="block"><span className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}{required && ' *'}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} className={`w-full rounded-md border px-3 py-2 text-sm ${error ? 'border-red-400' : 'border-gray-300'}`} />{error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}</label>;
}

function SelectField({ label: fieldLabel, value, onChange, options, labelFor }) {
  return <label className="block"><span className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{labelFor(option)}</option>)}</select></label>;
}
