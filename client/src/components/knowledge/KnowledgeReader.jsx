import { useState, useMemo } from 'react';
import MarkdownRenderer, { extractHeadings } from './MarkdownRenderer.jsx';
import ContentBadge from '../content/ContentBadge.jsx';
import ImageGallery from '../content/ImageGallery.jsx';
import CommentSection from '../content/CommentSection.jsx';
import useLanguage from '../../hooks/useLanguage.js';

export default function KnowledgeReader({
  article,
  loading = false,
  selectedTopic = null,
  topicHierarchy = [],
  canManage = false,
  currentUser = null,
  onEditArticle,
  onToggleStatus,
  onDeleteArticle,
  onVote,
  voting = false,
  onOpenCreateArticle,
  onOpenCreateTopic,
}) {
  const { t, label } = useLanguage();
  const [tocOpen, setTocOpen] = useState(false);

  // Extract headings from markdown content
  const headings = useMemo(() => {
    return extractHeadings(article?.content || '');
  }, [article?.content]);

  // Scroll smoothly to a heading
  const scrollToHeading = (id) => {
    setTocOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mb-4" />
        <p className="text-sm font-medium text-slate-500">{t('loadingDetails') || 'Loading note...'}</p>
      </div>
    );
  }

  // Empty canvas state
  if (!article) {
    return (
      <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl text-blue-600 shadow-inner mb-4">
          {selectedTopic?.icon || '📖'}
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          {selectedTopic ? selectedTopic.name : (t('selectItHelp') || 'Select a note to view')}
        </h3>
        <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
          {selectedTopic?.description || (t('selectItHelpSubtitle') || 'Browse topics and articles from the sidebar, or create a new note.')}
        </p>

        {canManage && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenCreateArticle(selectedTopic?._id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <span>+</span>
              <span>{t('newNote') || 'New Note'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreateTopic(selectedTopic?._id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span>📁</span>
              <span>{t('newSubfolder') || 'New Folder'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const topic = article.topicId && typeof article.topicId === 'object' ? article.topicId : selectedTopic;

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
      {/* Top Header: Breadcrumbs & Actions */}
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        {/* Breadcrumb Trail */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-400">IT Help</span>
          {topicHierarchy.map((item) => (
            <span key={item._id} className="flex items-center gap-1.5">
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-600">
                {item.icon} {item.name}
              </span>
            </span>
          ))}
          {topic && !topicHierarchy.some((h) => h._id === topic._id) && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-600">
                {topic.icon || '📁'} {topic.name}
              </span>
            </span>
          )}
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900 truncate max-w-[180px]">
            {article.title}
          </span>
        </nav>

        {/* Action Controls & TOC dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Table of Contents dropdown */}
          {headings.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setTocOpen(!tocOpen)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>📑</span>
                <span>{t('tableOfContents') || 'TOC'}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {tocOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTocOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                      {t('onThisPage') || 'On This Page'}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {headings.map((h, hidx) => (
                        <button
                          key={hidx}
                          type="button"
                          onClick={() => scrollToHeading(h.id)}
                          className="w-full text-left rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate"
                          style={{ paddingLeft: `${h.level * 10 + 4}px` }}
                        >
                          {h.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Manage controls (Edit, Status, Delete) */}
          {canManage && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEditArticle(article)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ✏️ {t('edit') || 'Edit'}
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus(article)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  article.status === 'published'
                    ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {article.status === 'published' ? (t('unpublish') || 'Draft') : (t('publish') || 'Publish')}
              </button>
              <button
                type="button"
                onClick={() => onDeleteArticle(article)}
                className="rounded-xl border border-red-200 bg-red-50/60 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                title={t('delete') || 'Delete'}
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
          <img
            src={article.coverImage}
            alt={article.title}
            className="max-h-80 w-full object-cover"
          />
        </div>
      )}

      {/* Note Title and Meta Bar */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {canManage && <ContentBadge value={article.status} />}
          {article.isQuickLink && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              ⭐ {t('quickLinks') || 'Quick Link'}
            </span>
          )}
          {article.subcategory && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {label(article.subcategory)}
            </span>
          )}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.map((tag, tidx) => (
                <span
                  key={tidx}
                  className="rounded-md bg-blue-50/70 border border-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
          {article.title}
        </h1>

        {article.summary && (
          <p className="mt-3 text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-300 pl-3">
            {article.summary}
          </p>
        )}
      </div>

      {/* Main Markdown Body */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <MarkdownRenderer content={article.content} />
      </div>

      {/* Attached Infographics & Diagrams */}
      {article.images && article.images.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <ImageGallery
            articleId={article._id}
            images={article.images || []}
            canManage={canManage}
          />
        </div>
      )}

      {/* Helpfulness / Voting Section */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('wasHelpful') || 'Was this note helpful?'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t('feedbackHelpsUs') || 'Your feedback helps improve our IT documentation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={voting}
            onClick={() => onVote('helpful')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              article.currentUserVote === 'helpful'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>👍</span>
            <span>{t('helpful') || 'Helpful'}</span>
            <span className="font-mono text-[11px] opacity-80">({article.helpfulCount || 0})</span>
          </button>
          <button
            type="button"
            disabled={voting}
            onClick={() => onVote('not_helpful')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              article.currentUserVote === 'not_helpful'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>👎</span>
            <span>{t('notHelpful') || 'Not Helpful'}</span>
            <span className="font-mono text-[11px] opacity-80">({article.notHelpfulCount || 0})</span>
          </button>
        </div>
      </div>

      {/* Related Articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t('relatedArticles') || 'Related Notes'}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {article.relatedArticles.map((rel) => (
              <button
                key={rel._id}
                type="button"
                onClick={() => onEditArticle && onEditArticle(rel)} // or select
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <span className="text-base">📄</span>
                <span className="text-xs font-semibold text-slate-800 truncate">{rel.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments & Discussion */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <CommentSection
          articleId={article._id}
          currentUser={currentUser}
          canManage={canManage}
        />
      </div>
    </article>
  );
}
