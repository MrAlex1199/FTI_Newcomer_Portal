import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ContentBadge from '../components/content/ContentBadge.jsx';
import { RichTextEditor, RichTextRenderer } from '../components/content/RichText.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import { useDepartments } from '../hooks/useDepartments.js';
import {
  useCreateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useITQuickLinks,
  useKnowledgeArticle,
  useKnowledgeArticles,
  useKnowledgeCategories,
  useUpdateKnowledgeArticle,
  useVoteKnowledgeArticle,
} from '../hooks/useKnowledge.js';

const DEFAULT_TOPICS = ['windows', 'printer', 'network', 'wifi', 'email', 'password', 'office_suite', 'vpn', 'shared_folder', 'browser', 'software_request'];
const EMPTY_ARTICLE = { title: '', slug: '', subcategory: 'windows', summary: '', content: '', coverImage: '', tags: '', targetRoles: [], sortOrder: 0, quickLinkOrder: 0, isQuickLink: false, status: 'draft' };
const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function ItHelp() {
  const { hasPermission } = useAuth();
  const { t, label } = useLanguage();
  const [searchParams] = useSearchParams();
  const canManage = hasPermission('knowledge:manage');
  const [topic, setTopic] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState(() => searchParams.get('article') || null);
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState('');
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300); return () => window.clearTimeout(timer); }, [search]);

  const { data: catalog } = useKnowledgeCategories();
  const topics = catalog?.topics?.length ? catalog.topics : DEFAULT_TOPICS;
  const query = { category: 'it_help', limit: 100, ...(topic ? { subcategory: topic } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(canManage && status ? { status } : {}) };
  const { data, isLoading, isError, error } = useKnowledgeArticles(query);
  const { data: quickLinkData } = useITQuickLinks({ limit: 8 });
  const { data: selected, isLoading: detailLoading } = useKnowledgeArticle(selectedId);
  const { data: departments } = useDepartments();
  const createMutation = useCreateKnowledgeArticle();
  const updateMutation = useUpdateKnowledgeArticle();
  const deleteMutation = useDeleteKnowledgeArticle();
  const voteMutation = useVoteKnowledgeArticle();
  const articles = data?.data || [];
  const quickLinks = quickLinkData?.data || [];
  const itDepartment = useMemo(() => (departments || []).find((item) => item.code === 'IT' || item.name?.toLowerCase().includes('information technology')), [departments]);

  useEffect(() => {
    if (!selectedId && articles[0]) setSelectedId(articles[0]._id);
    if (selectedId && articles.length && !articles.some((item) => item._id === selectedId)) setSelectedId(articles[0]?._id || null);
  }, [articles, selectedId]);

  const save = async (payload) => {
    setFormError('');
    try {
      if (editing) await updateMutation.mutateAsync({ id: editing._id, payload });
      else await createMutation.mutateAsync(payload);
      setFormOpen(false);
      setEditing(null);
    } catch (requestError) { setFormError(errorMessage(requestError, t('saveItHelpError'))); }
  };
  const toggleStatus = async (article) => {
    try { await updateMutation.mutateAsync({ id: article._id, payload: { status: article.status === 'published' ? 'draft' : 'published' } }); }
    catch (requestError) { setFormError(errorMessage(requestError, t('itHelpPublicationError'))); }
  };
  const remove = async () => {
    try { await deleteMutation.mutateAsync(deleting._id); setDeleting(null); setSelectedId(null); }
    catch (requestError) { setFormError(errorMessage(requestError, t('deleteItHelpError'))); }
  };
  const vote = async (value) => {
    if (selectedId) await voteMutation.mutateAsync({ id: selectedId, vote: value });
  };

  return <AppShell>
    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-sm text-gray-500">{t('dashboard')} / {t('itHelp')}</p><h1 className="text-2xl font-bold text-gray-800 mt-1">{t('itHelpTitle')}</h1><p className="text-gray-500 mt-1">{t('itHelpSubtitle')}</p></div>
      {canManage && <button type="button" onClick={() => { setEditing(null); setFormError(''); setFormOpen(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 shrink-0">{t('addItHelp')}</button>}
    </div>
    <div className="flex flex-col gap-3 mb-6 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchItHelp')} aria-label={t('searchItHelp')} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />{canManage && <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">{t('allStatuses')}</option><option value="published">{t('published')}</option><option value="draft">{t('draft')}</option><option value="archived">{t('archived')}</option></select>}</div>
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label={t('itHelpTopics')}><button type="button" onClick={() => setTopic('')} className={`px-3 py-1.5 rounded-full text-sm ${!topic ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{t('allTopics')}</button>{topics.map((item) => <button type="button" key={item} onClick={() => setTopic(item)} className={`px-3 py-1.5 rounded-full text-sm ${topic === item ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{label(item)}</button>)}</div>
    {quickLinks.length > 0 && <section className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4"><h2 className="font-semibold text-gray-800">{t('quickLinks')}</h2><div className="mt-3 flex flex-wrap gap-2">{quickLinks.map((item) => <button type="button" key={item._id} onClick={() => setSelectedId(item._id)} className="rounded-md bg-white px-3 py-2 text-sm text-primary-700 shadow-sm hover:bg-primary-50">{item.title}</button>)}</div></section>}
    {formError && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>}
    {isLoading && <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500">{t('loadingItHelp')}</div>}
    {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">{errorMessage(error, t('unableLoadItHelp'))}</div>}
    {!isLoading && !isError && <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"><section className="space-y-3">{articles.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">{t('noItHelp')}</div> : articles.map((article) => <ArticleCard key={article._id} article={article} selected={selectedId === article._id} canManage={canManage} onSelect={setSelectedId} onEdit={(item) => { setEditing(item); setFormError(''); setFormOpen(true); }} onToggle={toggleStatus} onDelete={setDeleting} />)}</section><ArticleDetail article={selected} loading={detailLoading} canManage={canManage} onVote={vote} voting={voteMutation.isPending} onSelect={setSelectedId} /></div>}
    <ContactIt department={itDepartment} />
    <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('editItHelp') : t('createItHelp')} size="lg"><ItHelpForm initial={editing} topics={topics} roles={catalog?.roles || []} onSubmit={save} onCancel={() => setFormOpen(false)} submitting={createMutation.isPending || updateMutation.isPending} formError={formError} /></Modal>
    <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title={t('deleteItHelp')} message={deleting ? t('deleteConfirm', { name: deleting.title }) : ''} confirmLabel={t('delete')} loading={deleteMutation.isPending} />
  </AppShell>;
}

function ArticleCard({ article, selected, canManage, onSelect, onEdit, onToggle, onDelete }) { const { t } = useLanguage(); return <article className={`rounded-xl border bg-white p-4 shadow-sm ${selected ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-200'}`}><button type="button" onClick={() => onSelect(article._id)} className="block text-left w-full"><div className="flex items-start justify-between gap-2"><h2 className="font-semibold text-gray-800">{article.title}</h2>{canManage && <ContentBadge value={article.status} />}</div>{article.summary && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{article.summary}</p>}<p className="mt-3 text-xs text-primary-600">{article.subcategory}</p></button>{canManage && <div className="mt-3 flex gap-3 border-t border-gray-100 pt-3 text-sm"><button type="button" onClick={() => onEdit(article)} className="text-primary-600 hover:underline">{t('edit')}</button><button type="button" onClick={() => onToggle(article)} className="text-amber-700 hover:underline">{article.status === 'published' ? t('unpublish') : t('publish')}</button><button type="button" onClick={() => onDelete(article)} className="text-red-600 hover:underline">{t('delete')}</button></div>}</article>; }

function ArticleDetail({ article, loading, canManage, onVote, voting, onSelect }) { const { t, label } = useLanguage(); if (loading) return <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500">{t('loadingDetails')}</div>; if (!article) return <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500">{t('selectItHelp')}</div>; return <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-primary-600">{label(article.subcategory)}</p><h2 className="text-xl font-bold text-gray-800 mt-1">{article.title}</h2></div>{canManage && <ContentBadge value={article.status} />}</div>{article.summary && <p className="mt-3 text-gray-600">{article.summary}</p>}<div className="mt-5"><RichTextRenderer content={article.content} /></div><div className="mt-6 border-t border-gray-100 pt-4"><p className="text-sm font-medium text-gray-700">{t('wasHelpful')}</p><div className="mt-2 flex gap-2"><button type="button" disabled={voting} onClick={() => onVote('helpful')} className={`rounded-md px-3 py-1.5 text-sm ${article.currentUserVote === 'helpful' ? 'bg-green-100 text-green-800' : 'border border-gray-200 text-gray-700'}`}>{t('helpful')} ({article.helpfulCount || 0})</button><button type="button" disabled={voting} onClick={() => onVote('not_helpful')} className={`rounded-md px-3 py-1.5 text-sm ${article.currentUserVote === 'not_helpful' ? 'bg-red-100 text-red-800' : 'border border-gray-200 text-gray-700'}`}>{t('notHelpful')} ({article.notHelpfulCount || 0})</button></div></div>{article.relatedArticles?.length > 0 && <div className="mt-6 border-t border-gray-100 pt-4"><h3 className="font-semibold text-gray-800">{t('relatedArticles')}</h3><div className="mt-2 space-y-2">{article.relatedArticles.map((item) => <button type="button" key={item._id} onClick={() => onSelect(item._id)} className="block text-left text-sm text-primary-700 hover:underline">{item.title}</button>)}</div></div>}</article>; }

function ContactIt({ department }) { const { t } = useLanguage(); return <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-800">{t('contactIt')}</h2><p className="text-sm text-gray-500 mt-1">{t('contactItHelp')}</p>{department ? <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-3"><span>{department.location || t('notProvided')}</span><span>{t('extension')}: {department.extension || t('notProvided')}</span><span>{(department.contactTopics || []).join(', ') || t('notProvided')}</span></div> : <p className="mt-3 text-sm text-gray-500">{t('contactItUnavailable')}</p>}</section>; }

function ItHelpForm({ initial, topics, roles, onSubmit, onCancel, submitting, formError }) { const { t, label } = useLanguage(); const [form, setForm] = useState(() => toForm(initial, topics)); useEffect(() => setForm(toForm(initial, topics)), [initial, topics]); const set = (field, value) => setForm((current) => ({ ...current, [field]: value })); const toggleRole = (role) => set('targetRoles', form.targetRoles.includes(role) ? form.targetRoles.filter((item) => item !== role) : [...form.targetRoles, role]); const submit = (event) => { event.preventDefault(); onSubmit({ ...form, category: 'it_help', tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), sortOrder: Number(form.sortOrder), quickLinkOrder: Number(form.quickLinkOrder), targetRoles: form.targetRoles }); }; return <form onSubmit={submit} className="space-y-4">{formError && <p className="text-sm text-red-600">{formError}</p>}<Field label={t('title')} value={form.title} onChange={(value) => set('title', value)} required /><div className="grid gap-4 sm:grid-cols-2"><Field label={t('slug')} value={form.slug} onChange={(value) => set('slug', value)} required /><SelectField label={t('itTopic')} value={form.subcategory} onChange={(value) => set('subcategory', value)} options={topics} /></div><Field label={t('summary')} value={form.summary} onChange={(value) => set('summary', value)} /><RichTextEditor label={t('itHelpContent')} value={form.content} onChange={(value) => set('content', value)} /><Field label={t('coverImageUrl')} value={form.coverImage} onChange={(value) => set('coverImage', value)} /><div className="grid gap-4 sm:grid-cols-2"><Field label={t('tags')} value={form.tags} onChange={(value) => set('tags', value)} /><Field label={t('sortOrder')} type="number" value={form.sortOrder} onChange={(value) => set('sortOrder', value)} /></div><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isQuickLink} onChange={(event) => set('isQuickLink', event.target.checked)} />{t('makeQuickLink')}</label>{form.isQuickLink && <Field label={t('quickLinkOrder')} type="number" value={form.quickLinkOrder} onChange={(value) => set('quickLinkOrder', value)} />}<SelectField label={t('status')} value={form.status} onChange={(value) => set('status', value)} options={['draft', 'published', 'archived']} /><div><span className="block text-sm font-medium text-gray-700 mb-2">{t('targetRoles')}</span><div className="flex flex-wrap gap-3">{roles.map((role) => <label key={role} className="text-sm text-gray-600"><input type="checkbox" checked={form.targetRoles.includes(role)} onChange={() => toggleRole(role)} className="mr-1" />{label(role)}</label>)}</div></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-gray-300">{t('cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white disabled:opacity-50">{submitting ? t('saving') : t('saveArticle')}</button></div></form>; }
function toForm(article, topics) { return article ? { ...EMPTY_ARTICLE, ...article, subcategory: article.subcategory || topics[0], tags: (article.tags || []).join(', '), targetRoles: article.targetRoles || [] } : { ...EMPTY_ARTICLE, subcategory: topics[0] }; }
function Field({ label: fieldLabel, value, onChange, type = 'text', required = false }) { return <label className="block"><span className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}{required && ' *'}</span><input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></label>; }
function SelectField({ label: fieldLabel, value, onChange, options }) { const { label } = useLanguage(); return <label className="block"><span className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</span><select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>; }
