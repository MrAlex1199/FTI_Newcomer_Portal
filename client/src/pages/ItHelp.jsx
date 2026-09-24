import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ObsidianTree from '../components/knowledge/ObsidianTree.jsx';
import KnowledgeReader from '../components/knowledge/KnowledgeReader.jsx';
import ObsidianGraphView from '../components/knowledge/ObsidianGraphView.jsx';
import TopicModal from '../components/knowledge/TopicModal.jsx';
import MarkdownEditorModal from '../components/knowledge/MarkdownEditorModal.jsx';
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
  useKnowledgeTopics,
  useCreateKnowledgeTopic,
  useUpdateKnowledgeTopic,
  useDeleteKnowledgeTopic,
  useSeedMockItKnowledge,
} from '../hooks/useKnowledge.js';

const errorMessage = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message || error?.response?.data?.message || fallback;

export default function ItHelp() {
  const { user, hasPermission } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permission check: Admin, superadmin, knowledge:manage or IT department members
  const canManage =
    hasPermission('knowledge:manage') ||
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.department?.code === 'IT';

  // State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState(() => searchParams.get('article') || null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('notes'); // 'notes' | 'graph'
  const [confirmSeedModalOpen, setConfirmSeedModalOpen] = useState(false);
  const [seedSuccessBanner, setSeedSuccessBanner] = useState(false);

  // Modals state
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicEditing, setTopicEditing] = useState(null);
  const [topicDefaultParentId, setTopicDefaultParentId] = useState(null);

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [articleEditing, setArticleEditing] = useState(null);
  const [articleDefaultTopicId, setArticleDefaultTopicId] = useState(null);

  const [deletingArticle, setDeletingArticle] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [actionError, setActionError] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Data queries
  const { data: topics = [], isLoading: topicsLoading } = useKnowledgeTopics({ category: 'it_help' });
  const { data: catalog } = useKnowledgeCategories();
  const { data: quickLinkData } = useITQuickLinks({ limit: 8 });
  const quickLinks = quickLinkData?.data || [];

  const articlesQuery = {
    category: 'it_help',
    limit: 100,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(canManage && statusFilter ? { status: statusFilter } : {}),
  };
  const { data: articlesData, isLoading: articlesLoading, isError, error } = useKnowledgeArticles(articlesQuery);
  const articles = articlesData?.data || [];

  // Query all IT articles for the Obsidian graph view
  const { data: allArticlesGraphData } = useKnowledgeArticles({ category: 'it_help', limit: 100 });
  const graphArticles = allArticlesGraphData?.data || articles;

  const { data: selectedArticle, isLoading: articleLoading } = useKnowledgeArticle(selectedArticleId);
  const { data: departments } = useDepartments();

  // Mutations
  const createArticleMutation = useCreateKnowledgeArticle();
  const updateArticleMutation = useUpdateKnowledgeArticle();
  const deleteArticleMutation = useDeleteKnowledgeArticle();
  const voteMutation = useVoteKnowledgeArticle();

  const createTopicMutation = useCreateKnowledgeTopic();
  const updateTopicMutation = useUpdateKnowledgeTopic();
  const deleteTopicMutation = useDeleteKnowledgeTopic();
  const seedMockMutation = useSeedMockItKnowledge();

  const itDepartment = useMemo(
    () => (departments || []).find((item) => item.code === 'IT' || item.name?.toLowerCase().includes('information technology')),
    [departments]
  );

  // ── Helper: extract topicId string whether it's a plain string or populated object ──
  const extractTopicId = (topicId) => {
    if (!topicId) return null;
    if (typeof topicId === 'object' && topicId._id) return String(topicId._id);
    return String(topicId);
  };

  // ── Synchronize URL search params → component state (one-way, URL is source of truth on mount) ──
  useEffect(() => {
    const urlArticleId = searchParams.get('article');
    const urlTopicId = searchParams.get('topic');

    if (urlArticleId && urlArticleId !== selectedArticleId) {
      setSelectedArticleId(urlArticleId);
      setActiveViewTab('notes');
    } else if (urlTopicId && urlTopicId !== selectedTopicId) {
      setSelectedTopicId(urlTopicId);
      setActiveViewTab('notes');
      const matched = articles.find(
        (a) => extractTopicId(a.topicId) === String(urlTopicId)
      );
      if (matched) setSelectedArticleId(matched._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);  // Only react to URL changes, NOT to state changes

  // ── Synchronize component state → URL (one-way, state writes to URL) ──
  useEffect(() => {
    if (selectedArticleId && searchParams.get('article') !== selectedArticleId) {
      setSearchParams({ article: selectedArticleId }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArticleId]); // Only react when selectedArticleId changes

  // Auto-select first article if none selected
  useEffect(() => {
    if (!selectedArticleId && !searchParams.get('article') && articles.length > 0) {
      setSelectedArticleId(articles[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles.length]); // Only when articles list changes length

  // When selected article loads, sync its topic ID
  useEffect(() => {
    if (selectedArticle?.topicId) {
      const tid = extractTopicId(selectedArticle.topicId);
      if (tid && tid !== selectedTopicId) {
        setSelectedTopicId(tid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArticle?._id]); // Only when a different article is loaded

  // Compute topic hierarchy breadcrumbs for the selected article
  const topicHierarchy = useMemo(() => {
    if (!selectedArticle?.topicId) return [];
    const topicId = extractTopicId(selectedArticle.topicId);
    const map = new Map(topics.map((t) => [String(t._id), t]));
    const path = [];
    let curr = map.get(String(topicId));
    while (curr) {
      path.unshift(curr);
      curr = curr.parentId ? map.get(String(curr.parentId)) : null;
    }
    return path;
  }, [selectedArticle, topics]);

  const selectedTopic = useMemo(() => {
    if (!selectedTopicId) return null;
    return topics.find((t) => String(t._id) === String(selectedTopicId)) || null;
  }, [topics, selectedTopicId]);

  // Article handlers
  const handleSelectArticle = (article) => {
    setSelectedArticleId(article._id);
    if (article.topicId) {
      const tid = extractTopicId(article.topicId);
      if (tid) setSelectedTopicId(tid);
    }
    // Close mobile drawer on selection
    setSidebarOpenMobile(false);
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopicId(topic._id);
    // Find first article in this topic (handle both populated and string topicId)
    const matchedArticle = articles.find(
      (a) => extractTopicId(a.topicId) === String(topic._id) || a.subcategory === topic.slug
    );
    if (matchedArticle) {
      setSelectedArticleId(matchedArticle._id);
    }
  };

  const handleSaveArticle = async ({ payload, file }) => {
    setActionError('');
    try {
      if (articleEditing) {
        await updateArticleMutation.mutateAsync({ id: articleEditing._id, payload, file });
      } else {
        const created = await createArticleMutation.mutateAsync({ payload, file });
        if (created?._id) setSelectedArticleId(created._id);
      }
      setEditorModalOpen(false);
      setArticleEditing(null);
    } catch (err) {
      setActionError(errorMessage(err, t('saveItHelpError') || 'Failed to save note'));
    }
  };

  const handleToggleArticleStatus = async (article) => {
    try {
      await updateArticleMutation.mutateAsync({
        id: article._id,
        payload: { status: article.status === 'published' ? 'draft' : 'published' },
      });
    } catch (err) {
      setActionError(errorMessage(err, t('itHelpPublicationError') || 'Failed to update publication status'));
    }
  };

  const handleConfirmDeleteArticle = async () => {
    if (!deletingArticle) return;
    try {
      await deleteArticleMutation.mutateAsync(deletingArticle._id);
      setDeletingArticle(null);
      if (selectedArticleId === deletingArticle._id) {
        setSelectedArticleId(null);
      }
    } catch (err) {
      setActionError(errorMessage(err, t('deleteItHelpError') || 'Failed to delete note'));
    }
  };

  const handleVote = async (value) => {
    if (selectedArticleId) {
      await voteMutation.mutateAsync({ id: selectedArticleId, vote: value });
    }
  };

  // Topic / Folder handlers
  const handleSaveTopic = async (payload) => {
    setActionError('');
    try {
      if (topicEditing) {
        await updateTopicMutation.mutateAsync({ id: topicEditing._id, payload });
      } else {
        await createTopicMutation.mutateAsync(payload);
      }
      setTopicModalOpen(false);
      setTopicEditing(null);
    } catch (err) {
      setActionError(errorMessage(err, t('saveTopicError') || 'Failed to save folder'));
    }
  };

  const handleConfirmDeleteTopic = async () => {
    if (!deletingTopic) return;
    try {
      await deleteTopicMutation.mutateAsync(deletingTopic._id);
      setDeletingTopic(null);
      if (selectedTopicId === deletingTopic._id) {
        setSelectedTopicId(null);
      }
    } catch (err) {
      setActionError(errorMessage(err, t('deleteTopicError') || 'Failed to delete folder'));
    }
  };

  const handleSeedMock = async () => {
    try {
      await seedMockMutation.mutateAsync();
      setConfirmSeedModalOpen(false);
      setSeedSuccessBanner(true);
      setTimeout(() => setSeedSuccessBanner(false), 6000);
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to seed mock IT knowledge base'));
    }
  };

  return (
    <AppShell>
      {/* Top Banner / Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-xs text-slate-400">
            {t('dashboard') || 'Dashboard'} / <span className="text-slate-600 font-medium">{t('itKnowledgeBase') || 'IT Knowledge Base'}</span>
          </nav>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t('itKnowledgeBaseTitle') || 'IT & Systems Knowledge Base'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <span>⚡</span>
              <span>Obsidian Vault</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {t('itKnowledgeBaseSubtitle') || 'Centralized technical documentation, troubleshooting workflows, software guides, and IT support.'}
          </p>
        </div>

        {/* Header Right Actions: View Tabs & Manager Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View Switcher: Notes View vs Graph View */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveViewTab('notes')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeViewTab === 'notes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📄</span>
              <span>{t('notesView')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('graph')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeViewTab === 'graph'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🕸️</span>
              <span>{t('graphView')}</span>
              <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] text-blue-700 font-bold">New</span>
            </button>
          </div>

          {/* Action Buttons for Managers */}
          {canManage && (
            <div className="flex items-center gap-2">
              {/* Seed Mock IT Knowledge Button */}
              <button
                type="button"
                onClick={() => setConfirmSeedModalOpen(true)}
                disabled={seedMockMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors disabled:opacity-50"
                title={t('seedMockDataConfirm')}
              >
                <span>⚡</span>
                <span>{seedMockMutation.isPending ? t('seeding') : t('seedMockData')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTopicEditing(null);
                  setTopicDefaultParentId(selectedTopicId || null);
                  setTopicModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <span>📁</span>
                <span>{t('newFolder') || '+ New Folder'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setArticleEditing(null);
                  setArticleDefaultTopicId(selectedTopicId || null);
                  setEditorModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <span>✏️</span>
                <span>{t('newNote') || '+ New Note'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mock Seeding Success Banner */}
      {seedSuccessBanner && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/95 p-3.5 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🎉</span>
            <span className="font-medium">{t('seedMockSuccess')}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeedSuccessBanner(false)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} className="font-bold">✕</button>
        </div>
      )}

      {/* View Switch Rendering: Graph View vs Notes View */}
      {activeViewTab === 'graph' ? (
        <div className="mb-8">
          <ObsidianGraphView
            topics={topics}
            articles={graphArticles}
            onOpenArticle={(articleId) => {
              setSelectedArticleId(articleId);
              setActiveViewTab('notes');
            }}
            initialSelectedArticleId={selectedArticleId}
          />
        </div>
      ) : (
        /* Notes View */
        <>
          {/* Quick Links Strip */}
          {quickLinks.length > 0 && (
            <section className="mb-5 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/90 to-indigo-50/70 p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⭐</span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  {t('quickLinks') || 'Quick Links & Common Help'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => setSelectedArticleId(item._id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedArticleId === item._id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Status Filter for Managers & Search on Mobile Toggle */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Toggle Button for Tree */}
            <button
              type="button"
              onClick={() => setSidebarOpenMobile(!sidebarOpenMobile)}
              className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs"
            >
              <span>📁</span>
              <span>{sidebarOpenMobile ? (t('hideSidebar') || 'Hide Folders') : (t('showSidebar') || 'Browse Folders')}</span>
            </button>

            {/* Manager Status Filter */}
            {canManage && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-medium text-slate-500">{t('status') || 'Status'}:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">{t('allStatuses') || 'All Statuses'}</option>
                  <option value="published">🚀 {t('published') || 'Published'}</option>
                  <option value="draft">📝 {t('draft') || 'Draft'}</option>
                  <option value="archived">📦 {t('archived') || 'Archived'}</option>
                </select>
              </div>
            )}
          </div>

          {/* Loading / Error States */}
          {topicsLoading && articlesLoading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mx-auto mb-3" />
              <p className="text-xs font-medium">{t('loadingItHelp') || 'Loading knowledge base...'}</p>
            </div>
          )}

          {isError && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-xs text-red-700">
              {errorMessage(error, t('unableLoadItHelp') || 'Unable to load knowledge base')}
            </div>
          )}

          {/* Main 2-Pane Obsidian Layout */}
          {!topicsLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Pane: Obsidian Tree (3.5 / 12 columns on large screens) */}
              <div
                className={`lg:col-span-4 xl:col-span-3 transition-all ${
                  sidebarOpenMobile ? 'block' : 'hidden lg:block'
                }`}
              >
                <ObsidianTree
                  topics={topics}
                  articles={articles}
                  selectedArticleId={selectedArticleId}
                  selectedTopicId={selectedTopicId}
                  onSelectArticle={handleSelectArticle}
                  onSelectTopic={handleSelectTopic}
                  canManage={canManage}
                  onOpenCreateTopic={(parentId) => {
                    setTopicEditing(null);
                    setTopicDefaultParentId(parentId || null);
                    setTopicModalOpen(true);
                  }}
                  onOpenEditTopic={(topic) => {
                    setTopicEditing(topic);
                    setTopicModalOpen(true);
                  }}
                  onDeleteTopic={(topic) => setDeletingTopic(topic)}
                  onOpenCreateArticle={(topicId) => {
                    setArticleEditing(null);
                    setArticleDefaultTopicId(topicId || null);
                    setEditorModalOpen(true);
                  }}
                />
              </div>

              {/* Right Pane: Reading & Content Canvas (8.5 / 12 columns) */}
              <div className="lg:col-span-8 xl:col-span-9 min-w-0">
                <KnowledgeReader
                  article={selectedArticle}
                  loading={articleLoading}
                  selectedTopic={selectedTopic}
                  topicHierarchy={topicHierarchy}
                  canManage={canManage}
                  currentUser={user}
                  onEditArticle={(art) => {
                    setArticleEditing(art);
                    setEditorModalOpen(true);
                  }}
                  onToggleStatus={handleToggleArticleStatus}
                  onDeleteArticle={(art) => setDeletingArticle(art)}
                  onVote={handleVote}
                  voting={voteMutation.isPending}
                  onOpenCreateArticle={(topicId) => {
                    setArticleEditing(null);
                    setArticleDefaultTopicId(topicId || null);
                    setEditorModalOpen(true);
                  }}
                  onOpenCreateTopic={(parentId) => {
                    setTopicEditing(null);
                    setTopicDefaultParentId(parentId || null);
                    setTopicModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* IT Helpdesk Contact Card */}
      <ContactItCard department={itDepartment} />

      {/* Modals & Dialogs */}
      {/* 1. Topic / Folder Modal */}
      <TopicModal
        open={topicModalOpen}
        onClose={() => {
          setTopicModalOpen(false);
          setTopicEditing(null);
        }}
        initial={topicEditing}
        defaultParentId={topicDefaultParentId}
        topics={topics}
        onSubmit={handleSaveTopic}
        submitting={createTopicMutation.isPending || updateTopicMutation.isPending}
        formError={actionError}
      />

      {/* 2. Note / Markdown Editor Modal */}
      <MarkdownEditorModal
        open={editorModalOpen}
        onClose={() => {
          setEditorModalOpen(false);
          setArticleEditing(null);
        }}
        initial={articleEditing}
        defaultTopicId={articleDefaultTopicId}
        topics={topics}
        roles={catalog?.roles || []}
        onSubmit={handleSaveArticle}
        submitting={createArticleMutation.isPending || updateArticleMutation.isPending}
        formError={actionError}
      />

      {/* 3. Delete Article Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingArticle}
        onClose={() => setDeletingArticle(null)}
        onConfirm={handleConfirmDeleteArticle}
        title={t('deleteItHelp') || 'Delete Note'}
        message={deletingArticle ? (t('deleteConfirm', { name: deletingArticle.title }) || `Are you sure you want to delete "${deletingArticle.title}"?`) : ''}
        confirmLabel={t('delete') || 'Delete'}
        loading={deleteArticleMutation.isPending}
      />

      {/* 4. Delete Topic / Folder Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingTopic}
        onClose={() => setDeletingTopic(null)}
        onConfirm={handleConfirmDeleteTopic}
        title={t('deleteTopic') || 'Delete Folder'}
        message={
          deletingTopic
            ? `${t('deleteTopicConfirm') || 'Are you sure you want to delete folder'} "${deletingTopic.name}"? ${
                deletingTopic.articleCount > 0 ? `(${deletingTopic.articleCount} notes will become unassigned)` : ''
              }`
            : ''
        }
        confirmLabel={t('delete') || 'Delete'}
        loading={deleteTopicMutation.isPending}
      />

      {/* 5. Seed Mock IT Data Confirm Dialog */}
      <ConfirmDialog
        open={confirmSeedModalOpen}
        onClose={() => setConfirmSeedModalOpen(false)}
        onConfirm={handleSeedMock}
        title={t('seedMockData') || 'Seed Mock IT Knowledge Base'}
        message={t('seedMockDataConfirm') || 'Populate the knowledge base with 8 realistic IT categories and 21 interlinked articles?'}
        confirmLabel={seedMockMutation.isPending ? (t('seeding') || 'Seeding...') : (t('seedMockData') || 'Seed Mock Data')}
        loading={seedMockMutation.isPending}
        danger={false}
      />
    </AppShell>
  );
}

function ContactItCard({ department }) {
  const { t } = useLanguage();

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
          🎧
        </div>
        <div>
          <h2 className="font-bold text-sm text-slate-800">
            {t('contactIt') || 'Direct IT Helpdesk & Support'}
          </h2>
          <p className="text-xs text-slate-500">
            {t('contactItHelp') || 'Need hands-on hardware assistance, account unlocking, or emergency support? Contact the IT team directly.'}
          </p>
        </div>
      </div>

      {department ? (
        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-slate-400">📍 {t('location') || 'Location'}:</span>
            <span className="font-semibold text-slate-800">{department.location || t('notProvided')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-slate-400">📞 {t('extension') || 'Ext'}:</span>
            <span className="font-semibold text-blue-600 font-mono">{department.extension || t('notProvided')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-slate-400">🏷️ {t('topics') || 'Topics'}:</span>
            <span className="font-medium text-slate-800">{(department.contactTopics || []).join(', ') || t('notProvided')}</span>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          {t('contactItUnavailable') || 'IT Department details are currently unavailable.'}
        </p>
      )}
    </section>
  );
}
