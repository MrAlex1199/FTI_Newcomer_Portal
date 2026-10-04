import { useState, useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import {
  useCreateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useKnowledgeArticles,
  useKnowledgeCategories,
  useUpdateKnowledgeArticle,
} from '../hooks/useKnowledge.js';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { RichTextEditor } from '../components/content/RichText.jsx';

import OnboardingHero from '../components/gettingStarted/OnboardingHero.jsx';
import MilestoneTabs from '../components/gettingStarted/MilestoneTabs.jsx';
import InteractiveChecklist, {
  DEFAULT_ONBOARDING_TASKS,
} from '../components/gettingStarted/InteractiveChecklist.jsx';
import GuideCard from '../components/gettingStarted/GuideCard.jsx';
import GuideReaderModal from '../components/gettingStarted/GuideReaderModal.jsx';

const DEFAULT_SECTIONS = ['first_day', 'first_week', 'before_leaving'];
const EMPTY_ARTICLE = {
  title: '',
  slug: '',
  subcategory: 'first_day',
  summary: '',
  content: '',
  coverImage: '',
  tags: '',
  targetRoles: [],
  sortOrder: 0,
  status: 'draft',
};

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function GettingStarted() {
  const { user, hasPermission } = useAuth();
  const { t, label, currentLanguage } = useLanguage();
  const canManage = hasPermission('knowledge:manage');
  const userId = user?._id || user?.id || 'guest';

  // Active Milestone phase & filters
  const [section, setSection] = useState('first_day');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader & CRUD modal states
  const [activeReaderArticle, setActiveReaderArticle] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState('');

  // Dual-layer progress state persisted in localStorage
  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`fti_onboarding_tasks_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readArticleIds, setReadArticleIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`fti_onboarding_read_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage updated when state changes
  useEffect(() => {
    try {
      localStorage.setItem(`fti_onboarding_tasks_${userId}`, JSON.stringify(completedTaskIds));
    } catch (e) {
      console.warn('Failed to save onboarding tasks to localStorage', e);
    }
  }, [completedTaskIds, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(`fti_onboarding_read_${userId}`, JSON.stringify(readArticleIds));
    } catch (e) {
      console.warn('Failed to save read articles to localStorage', e);
    }
  }, [readArticleIds, userId]);

  // Data fetching
  const { data, isLoading, isError, error } = useKnowledgeArticles({
    category: 'getting_started',
    limit: 100,
    ...(canManage && statusFilter ? { status: statusFilter } : {}),
  });

  const { data: catalog } = useKnowledgeCategories();
  const createMutation = useCreateKnowledgeArticle();
  const updateMutation = useUpdateKnowledgeArticle();
  const deleteMutation = useDeleteKnowledgeArticle();

  const sections = catalog?.sections?.length ? catalog.sections : DEFAULT_SECTIONS;
  const articles = data?.data || [];

  // Dual-Layer Progress Calculations
  const progressStats = useMemo(() => {
    // 1. Tasks count
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    const taskSet = new Set(completedTaskIds);

    Object.values(DEFAULT_ONBOARDING_TASKS).forEach((phaseTaskList) => {
      totalTasksCount += phaseTaskList.length;
      phaseTaskList.forEach((tk) => {
        if (taskSet.has(tk.id)) completedTasksCount += 1;
      });
    });

    // 2. Articles count (published articles or all articles for user)
    const validArticles = articles.filter((a) => !canManage || a.status === 'published');
    const totalArticlesCount = validArticles.length;
    const readSet = new Set(readArticleIds);
    const readArticlesCount = validArticles.filter((a) => readSet.has(a._id)).length;

    const totalItems = totalTasksCount + totalArticlesCount;
    const completedItems = completedTasksCount + readArticlesCount;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      completed: completedItems,
      total: totalItems,
      percentage,
    };
  }, [completedTaskIds, readArticleIds, articles, canManage]);

  // Per-phase stats for MilestoneTabs
  const phaseStats = useMemo(() => {
    const stats = {};
    const taskSet = new Set(completedTaskIds);
    const readSet = new Set(readArticleIds);

    sections.forEach((secKey) => {
      const phaseTasks = DEFAULT_ONBOARDING_TASKS[secKey] || [];
      const phaseArticles = articles.filter((a) => a.subcategory === secKey);

      const taskDone = phaseTasks.filter((t) => taskSet.has(t.id)).length;
      const articleDone = phaseArticles.filter((a) => readSet.has(a._id)).length;

      const total = phaseTasks.length + phaseArticles.length;
      const completed = taskDone + articleDone;

      stats[secKey] = {
        completed,
        total,
        isAllDone: total > 0 && completed === total,
      };
    });

    return stats;
  }, [sections, completedTaskIds, readArticleIds, articles]);

  // Toggle checklist task
  const handleToggleTask = (taskId) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Toggle article understood / read status
  const handleToggleRead = (articleId) => {
    setReadArticleIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  // Filtered articles for current section
  const visibleArticles = useMemo(() => {
    return articles.filter((article) => {
      // 1. Must match current milestone subcategory
      if (article.subcategory !== section) return false;

      // 2. Role filter
      if (roleFilter) {
        const roles = article.targetRoles || [];
        if (roles.length > 0 && !roles.includes(roleFilter)) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = article.title?.toLowerCase().includes(q);
        const summaryMatch = article.summary?.toLowerCase().includes(q);
        const tagsMatch = article.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!titleMatch && !summaryMatch && !tagsMatch) return false;
      }

      return true;
    });
  }, [articles, section, roleFilter, searchQuery]);

  // Admin CRUD actions
  const save = async (payload) => {
    setFormError('');
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('saveGuideError')));
    }
  };

  const toggleStatus = async (article) => {
    try {
      await updateMutation.mutateAsync({
        id: article._id,
        payload: { status: article.status === 'published' ? 'draft' : 'published' },
      });
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('guidePublicationError')));
    }
  };

  const remove = async () => {
    try {
      await deleteMutation.mutateAsync(deleting._id);
      setDeleting(null);
    } catch (requestError) {
      setFormError(errorMessage(requestError, t('deleteGuideError')));
    }
  };

  const readSet = useMemo(() => new Set(readArticleIds), [readArticleIds]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Onboarding Hero Hub with Dynamic Greeting, Circular SVG Progress, and 4 Quick Launchpads */}
        <OnboardingHero progress={progressStats} />

        {/* Milestone Stepper Tabs */}
        <MilestoneTabs
          sections={sections}
          activeSection={section}
          onSelectSection={setSection}
          phaseStats={phaseStats}
        />

        {/* Interactive Action Checklist for Selected Milestone */}
        <InteractiveChecklist
          section={section}
          completedTaskIds={completedTaskIds}
          onToggleTask={handleToggleTask}
        />

        {/* Guides Section Header & Search / Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 pb-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {label(section)} {currentLanguage === 'th' ? '— คู่มือ & แนวทางปฏิบัติ' : '— Guides & Resources'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {currentLanguage === 'th'
                ? 'อ่านเอกสารแนะนำเพื่อทำความเข้าใจกระบวนการทำงานและข้อกำหนดต่าง ๆ'
                : 'Essential reading materials and guidelines for this stage'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchGuides')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Role Target Filter */}
            {catalog?.roles?.length > 0 && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:outline-hidden"
              >
                <option value="">{t('filterAllRoles')}</option>
                {catalog.roles.map((role) => (
                  <option key={role} value={role}>
                    {label(role)}
                  </option>
                ))}
              </select>
            )}

            {/* Admin Status Filter */}
            {canManage && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:border-primary-500 focus:outline-hidden"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="published">{t('published')}</option>
                <option value="draft">{t('draft')}</option>
                <option value="archived">{t('archived')}</option>
              </select>
            )}

            {/* Admin Add Guide Button */}
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormError('');
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 dark:bg-primary-500 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-700 dark:hover:bg-primary-600 active:scale-95 transition-all shrink-0"
              >
                <span>+</span>
                <span>{t('addGuide')}</span>
              </button>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-8 text-center text-rose-700 dark:text-rose-300">
            <p className="font-bold text-base">{errorMessage(error, t('unableLoad'))}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && visibleArticles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-12 text-center">
            <span className="text-4xl">📚</span>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
              {t('noSectionArticles')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {currentLanguage === 'th'
                ? 'ยังไม่มีบทความในส่วนนี้ หรือไม่มีข้อมูลที่ตรงกับตัวกรองการค้นหา'
                : 'No guide articles found matching your criteria.'}
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditing({ ...EMPTY_ARTICLE, subcategory: section });
                  setFormError('');
                  setFormOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
              >
                <span>+</span>
                <span>{t('addGuide')}</span>
              </button>
            )}
          </div>
        )}

        {/* Promax 4-tier Guide Cards Grid */}
        {!isLoading && !isError && visibleArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleArticles.map((article) => (
              <GuideCard
                key={article._id}
                article={article}
                isRead={readSet.has(article._id)}
                onToggleRead={handleToggleRead}
                onOpenReader={setActiveReaderArticle}
                canManage={canManage}
                onEdit={(item) => {
                  setEditing(item);
                  setFormError('');
                  setFormOpen(true);
                }}
                onToggleStatus={toggleStatus}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}

        {/* Slide-over / Rich Modal Reader */}
        <GuideReaderModal
          article={activeReaderArticle}
          isOpen={!!activeReaderArticle}
          isRead={activeReaderArticle ? readSet.has(activeReaderArticle._id) : false}
          onToggleRead={handleToggleRead}
          onClose={() => setActiveReaderArticle(null)}
        />

        {/* Admin Create / Edit Modal */}
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing?._id ? t('editGuide') : t('createGuide')}
          size="lg"
        >
          <ArticleForm
            initial={editing}
            sections={sections}
            roles={catalog?.roles || []}
            onSubmit={save}
            onCancel={() => setFormOpen(false)}
            submitting={createMutation.isPending || updateMutation.isPending}
            formError={formError}
          />
        </Modal>

        {/* Admin Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          title={t('deleteGuide')}
          message={deleting ? t('deleteConfirm', { name: deleting.title }) : ''}
          confirmLabel={t('delete')}
          loading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}

function ArticleForm({
  initial,
  sections,
  roles,
  onSubmit,
  onCancel,
  submitting,
  formError,
}) {
  const { t, label } = useLanguage();
  const [form, setForm] = useState(() => toForm(initial, sections));

  useEffect(() => setForm(toForm(initial, sections)), [initial, sections]);

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
    onSubmit({
      ...form,
      category: 'getting_started',
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      sortOrder: Number(form.sortOrder),
      targetRoles: form.targetRoles,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <Field
        label={t('title')}
        value={form.title}
        onChange={(value) => set('title', value)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('slug')}
          value={form.slug}
          onChange={(value) => set('slug', value)}
          required
        />
        <SelectField
          label={t('section')}
          value={form.subcategory}
          onChange={(value) => set('subcategory', value)}
          options={sections}
        />
      </div>
      <Field
        label={t('summary')}
        value={form.summary}
        onChange={(value) => set('summary', value)}
      />
      <RichTextEditor
        label={t('guideContent')}
        value={form.content}
        onChange={(value) => set('content', value)}
      />
      <Field
        label={t('coverImageUrl')}
        value={form.coverImage}
        onChange={(value) => set('coverImage', value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('tags')}
          value={form.tags}
          onChange={(value) => set('tags', value)}
        />
        <Field
          label={t('sortOrder')}
          type="number"
          value={form.sortOrder}
          onChange={(value) => set('sortOrder', value)}
        />
      </div>
      <SelectField
        label={t('status')}
        value={form.status}
        onChange={(value) => set('status', value)}
        options={['draft', 'published', 'archived']}
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
      </div>
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
          {submitting ? t('saving') : t('saveArticle')}
        </button>
      </div>
    </form>
  );
}

function toForm(article, sections) {
  return article
    ? {
        ...EMPTY_ARTICLE,
        ...article,
        subcategory: article.subcategory || sections[0],
        tags: (article.tags || []).join(', '),
        targetRoles: article.targetRoles || [],
      }
    : { ...EMPTY_ARTICLE, subcategory: sections[0] };
}

function Field({ label: fieldLabel, value, onChange, type = 'text', required = false }) {
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
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/40 outline-hidden transition-all"
      />
    </label>
  );
}

function SelectField({ label: fieldLabel, value, onChange, options }) {
  const { label } = useLanguage();
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
            {label(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
