import { useState, useMemo } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

/**
 * Recursive Tree Node for Folders and Articles (Obsidian-Style)
 */
function FolderTreeNode({
  topic,
  level = 0,
  childTopicsMap,
  articlesByTopicMap,
  expandedFolders,
  toggleFolder,
  selectedArticleId,
  selectedTopicId,
  onSelectArticle,
  onSelectTopic,
  canManage,
  onOpenCreateTopic,
  onOpenEditTopic,
  onDeleteTopic,
  onOpenCreateArticle,
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const subtopics = childTopicsMap[topic._id] || [];
  const articles = articlesByTopicMap[topic._id] || [];
  const hasChildren = subtopics.length > 0 || articles.length > 0;
  const isExpanded = expandedFolders.has(topic._id);
  const isSelected = selectedTopicId === topic._id;

  return (
    <div className="select-none">
      {/* Folder Row */}
      <div
        className={`group relative flex items-center justify-between rounded-xl px-2 py-1.5 text-xs transition-all duration-150 ${
          isSelected
            ? 'bg-blue-50/90 text-blue-900 font-semibold shadow-xs'
            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
        }`}
        style={{ paddingLeft: `${Math.max(8, level * 16 + 8)}px` }}
      >
        <div
          className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer"
          onClick={() => {
            toggleFolder(topic._id);
            onSelectTopic(topic);
          }}
        >
          {/* Caret icon */}
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center text-[10px] text-slate-400 transition-transform duration-150 ${
              isExpanded ? 'rotate-90 text-slate-600' : ''
            }`}
          >
            {hasChildren ? '▶' : '•'}
          </span>

          {/* Folder Icon & Name */}
          <span className="shrink-0 text-sm">{topic.icon || (isExpanded ? '📂' : '📁')}</span>
          <span className="truncate font-medium text-xs">{topic.name}</span>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Article count badge */}
          {topic.articleCount > 0 && (
            <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 group-hover:opacity-70">
              {topic.articleCount}
            </span>
          )}

          {canManage && (
            <div className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                title={t('newNote')}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateArticle(topic._id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-blue-600 text-xs"
              >
                +
              </button>
              <button
                type="button"
                title="Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200 text-slate-500 text-xs"
              >
                ⋮
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-6 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenCreateTopic(topic._id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      <span>📁</span>
                      <span>{t('newSubfolder')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenCreateArticle(topic._id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      <span>📄</span>
                      <span>{t('newNote')}</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenEditTopic(topic);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      <span>✏️</span>
                      <span>{t('renameFolder')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDeleteTopic(topic);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600"
                    >
                      <span>🗑️</span>
                      <span>{t('deleteFolder')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children: Subfolders & Articles */}
      {isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {/* Subfolders */}
          {subtopics.map((sub) => (
            <FolderTreeNode
              key={sub._id}
              topic={sub}
              level={level + 1}
              childTopicsMap={childTopicsMap}
              articlesByTopicMap={articlesByTopicMap}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedArticleId={selectedArticleId}
              selectedTopicId={selectedTopicId}
              onSelectArticle={onSelectArticle}
              onSelectTopic={onSelectTopic}
              canManage={canManage}
              onOpenCreateTopic={onOpenCreateTopic}
              onOpenEditTopic={onOpenEditTopic}
              onDeleteTopic={onDeleteTopic}
              onOpenCreateArticle={onOpenCreateArticle}
            />
          ))}

          {/* Articles inside this folder */}
          {articles.map((art) => {
            const isArtActive = selectedArticleId === art._id;
            return (
              <div
                key={art._id}
                onClick={() => onSelectArticle(art)}
                className={`group flex items-center justify-between rounded-xl px-2 py-1.5 text-xs cursor-pointer transition-all duration-150 ${
                  isArtActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={{ paddingLeft: `${Math.max(12, (level + 1) * 16 + 12)}px` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs shrink-0 ${isArtActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    📄
                  </span>
                  <span className="truncate text-xs">{art.title}</span>
                </div>
                {art.status === 'draft' && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                      isArtActive ? 'bg-blue-800 text-blue-200' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    Draft
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ObsidianTree({
  topics = [],
  articles = [],
  selectedArticleId,
  selectedTopicId,
  onSelectArticle,
  onSelectTopic,
  canManage = false,
  onOpenCreateTopic,
  onOpenEditTopic,
  onDeleteTopic,
  onOpenCreateArticle,
  search = '',
  onSearchChange,
}) {
  const { t } = useLanguage();
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());

  // Build Parent -> Children map for topics
  const { rootTopics, childTopicsMap } = useMemo(() => {
    const roots = [];
    const childrenMap = {};

    topics.forEach((t) => {
      const pId = t.parentId?._id || t.parentId;
      if (!pId) {
        roots.push(t);
      } else {
        if (!childrenMap[pId]) childrenMap[pId] = [];
        childrenMap[pId].push(t);
      }
    });

    return { rootTopics: roots, childTopicsMap: childrenMap };
  }, [topics]);

  // Build TopicId -> Articles map
  const { articlesByTopicMap, unassignedArticles } = useMemo(() => {
    const map = {};
    const unassigned = [];
    const topicSlugMap = Object.fromEntries(topics.map((t) => [t.slug, t._id]));

    articles.forEach((art) => {
      let tId = art.topicId?._id || art.topicId;
      if (!tId && art.subcategory && topicSlugMap[art.subcategory]) {
        tId = topicSlugMap[art.subcategory];
      }

      if (tId) {
        if (!map[tId]) map[tId] = [];
        map[tId].push(art);
      } else {
        unassigned.push(art);
      }
    });

    return { articlesByTopicMap: map, unassignedArticles: unassigned };
  }, [articles, topics]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFolders(new Set(topics.map((t) => t._id)));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  // Filtered lists if search query is active
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return articles.filter(
      (a) => a.title?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
    );
  }, [articles, search]);

  return (
    <div className="flex h-full flex-col bg-slate-50/80 border-r border-slate-200/80">
      {/* Header & Quick Action */}
      <div className="p-3 border-b border-slate-200/70 bg-white/50 backdrop-blur-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm font-bold shadow-2xs">
              🧠
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('itKnowledgeBase')}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              title="Expand all"
              className="rounded p-1 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={collapseAll}
              title="Collapse all"
              className="rounded p-1 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ⊟
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          <input
            type="text"
            placeholder={t('searchDocs')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* Manager Action: New Root Folder & New Note */}
        {canManage && (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onOpenCreateTopic(null)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-98"
            >
              <span>📁</span>
              <span>{t('newFolder')}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreateArticle(null)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700 active:scale-98"
            >
              <span>+</span>
              <span>{t('newNote')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tree View Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {/* If searching, show direct matches */}
        {search.trim() ? (
          <div>
            <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">
              ผลการค้นหา ({filteredArticles.length})
            </p>
            {filteredArticles.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">
                ไม่พบเนื้อหาที่ตรงกับคำค้นหา
              </p>
            ) : (
              <div className="space-y-0.5">
                {filteredArticles.map((art) => (
                  <div
                    key={art._id}
                    onClick={() => onSelectArticle(art)}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs cursor-pointer transition ${
                      selectedArticleId === art._id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📄</span>
                    <span className="truncate">{art.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Root Folders Tree */}
            {rootTopics.map((topic) => (
              <FolderTreeNode
                key={topic._id}
                topic={topic}
                level={0}
                childTopicsMap={childTopicsMap}
                articlesByTopicMap={articlesByTopicMap}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectedArticleId={selectedArticleId}
                selectedTopicId={selectedTopicId}
                onSelectArticle={onSelectArticle}
                onSelectTopic={onSelectTopic}
                canManage={canManage}
                onOpenCreateTopic={onOpenCreateTopic}
                onOpenEditTopic={onOpenEditTopic}
                onDeleteTopic={onDeleteTopic}
                onOpenCreateArticle={onOpenCreateArticle}
              />
            ))}

            {/* Unassigned articles (if any) */}
            {unassignedArticles.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  บทความทั่วไป
                </p>
                {unassignedArticles.map((art) => (
                  <div
                    key={art._id}
                    onClick={() => onSelectArticle(art)}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer transition ${
                      selectedArticleId === art._id
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>📄</span>
                    <span className="truncate">{art.title}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
