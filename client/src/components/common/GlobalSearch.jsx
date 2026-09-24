import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalSearch from '../../hooks/useGlobalSearch.js';
import useLanguage from '../../hooks/useLanguage.js';

const RECENT_KEY = 'fti-recent-searches';
const MAX_RECENT = 5;

function readRecent() {
  try {
    const values = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(values) ? values.filter(Boolean).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

const CATEGORY_META = {
  employee: { icon: '👤', labelKey: 'searchType_employee', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  intern: { icon: '🎓', labelKey: 'searchType_intern', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  department: { icon: '📁', labelKey: 'searchType_department', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  topic: { icon: '🗂️', labelKey: 'searchType_topic', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  knowledge: { icon: '💻', labelKey: 'searchType_knowledge', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  policy: { icon: '📜', labelKey: 'searchType_policy', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  faq: { icon: '❓', labelKey: 'searchType_faq', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  announcement: { icon: '📢', labelKey: 'searchType_announcement', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  company: { icon: '🏢', labelKey: 'searchType_company', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function GlobalSearch({ onSelect, className = '', variant = 'default' }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Input text is separate from debounced search query
  const [inputText, setInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const isComposingRef = useRef(false);

  // Debounce API query to prevent request flooding while keeping UI typing 100% instant
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputText.trim());
      setActiveIndex(-1);
    }, 180);
    return () => clearTimeout(timer);
  }, [inputText]);

  const { data, isLoading, isError } = useGlobalSearch(debouncedQuery, { limit: 5 });

  // Popover is visible when focused and there is a query OR recent searches
  const visible = focused && (inputText.trim().length > 0 || recent.length > 0);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Global Cmd+K or Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Remember a search term into recent searches
  const remember = (value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [
      normalized,
      ...recent.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
    ].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage error */
    }
  };

  // Remove a single item from recent searches
  const removeRecentItem = (itemToRemove, e) => {
    e.stopPropagation();
    const next = recent.filter((item) => item !== itemToRemove);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage error */
    }
  };

  // Clear all recent searches
  const clearAllRecent = () => {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore storage error */
    }
  };

  // Open a specific search result
  const openResult = (item) => {
    remember(inputText || item.title);
    setFocused(false);
    setActiveIndex(-1);
    if (onSelect) onSelect();
    navigate(item.url);
  };

  // Navigate to full search results page (/search?q=...)
  const viewAll = () => {
    const queryToSearch = inputText.trim() || debouncedQuery.trim();
    if (!queryToSearch) return;
    remember(queryToSearch);
    setFocused(false);
    setActiveIndex(-1);
    if (onSelect) onSelect();
    navigate(`/search?q=${encodeURIComponent(queryToSearch)}`);
  };

  // Choose a recent search item
  const chooseRecent = (value) => {
    setInputText(value);
    setDebouncedQuery(value);
    setFocused(true);
    inputRef.current?.focus();
  };

  // Clear search input text
  const handleClear = () => {
    setInputText('');
    setDebouncedQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Flatten active items for keyboard navigation (ArrowDown / ArrowUp)
  const flatItems = useMemo(() => {
    if (!inputText.trim()) {
      return recent.map((item, idx) => ({
        type: 'recent',
        id: `recent_${idx}`,
        value: item,
      }));
    }

    const items = [];
    if (data?.groups) {
      data.groups.forEach((group) => {
        group.results.forEach((item) => {
          items.push({
            type: 'result',
            id: `${item.entityType}-${item.id}`,
            data: item,
          });
        });
      });
    }

    if (data?.total > 0) {
      items.push({
        type: 'view_all',
        id: 'view_all_action',
        total: data.total,
      });
    }

    return items;
  }, [inputText, recent, data]);

  // Scroll highlighted item into view if necessary
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector(`[data-active-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Keyboard navigation handler with Thai IME Composition Guard
  const handleKeyDown = (e) => {
    // 1. If currently in Thai IME composition mode, do not trigger enter
    if (e.nativeEvent.isComposing || isComposingRef.current) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!visible) {
        setFocused(true);
        return;
      }
      setActiveIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visible) return;
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        const selected = flatItems[activeIndex];
        if (selected.type === 'recent') {
          chooseRecent(selected.value);
        } else if (selected.type === 'result') {
          openResult(selected.data);
        } else if (selected.type === 'view_all') {
          viewAll();
        }
      } else {
        viewAll();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const isHeader = variant === 'header';
  const isDrawer = variant === 'drawer';

  return (
    <div
      ref={rootRef}
      className={`relative ${
        className ||
        (isHeader ? 'w-full max-w-lg' : isDrawer ? 'w-full' : 'w-full sm:w-64 lg:w-72')
      }`}
    >
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        {/* Leading Search Icon */}
        <span
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            isHeader || isDrawer
              ? focused
                ? 'text-blue-500'
                : 'text-primary-300'
              : 'text-gray-400'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>

        {/* Core Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          placeholder={t('globalSearchPlaceholder')}
          aria-label={t('globalSearch')}
          className={`w-full transition-all duration-200 outline-none text-sm ${
            isHeader
              ? 'rounded-xl border border-primary-700/60 bg-primary-950/50 py-2 pl-9 pr-14 text-white placeholder-primary-300/60 shadow-inner backdrop-blur-xs focus:border-blue-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-3 focus:ring-blue-400/25'
              : isDrawer
              ? 'rounded-xl border border-primary-700/70 bg-primary-950/60 py-2.5 pl-9 pr-10 text-white placeholder-primary-300/60 shadow-inner focus:border-blue-400 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-blue-400/30'
              : 'rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-10 text-slate-800 placeholder-gray-400 shadow-xs focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
          }`}
        />

        {/* Trailing Controls: Clear Button '✕' or Shortcut '⌘K' */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputText ? (
            <button
              type="button"
              onClick={handleClear}
              title={t('clearSearchInput') || 'Clear search'}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/60 text-[11px] font-bold text-slate-500 hover:bg-slate-300 hover:text-slate-800 active:scale-95 transition"
            >
              ✕
            </button>
          ) : isHeader ? (
            <kbd className="hidden sm:inline-flex items-center rounded border border-primary-700/60 bg-primary-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-primary-200/90 shadow-xs select-none">
              ⌘K
            </kbd>
          ) : null}
        </div>
      </div>

      {/* Live Dropdown Popover */}
      {/* Live Dropdown Popover (100% Solid Opaque Background) */}
      {visible && (
        <div
          ref={dropdownRef}
          style={{ backgroundColor: '#ffffff' }}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl ring-1 ring-black/10 animate-in fade-in-50 slide-in-from-top-1 duration-150"
        >
          {/* Recent Searches Section (When input is empty) */}
          {!inputText.trim() && recent.length > 0 && (
            <div className="bg-white p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span>🕒</span>
                  <span>{t('recentSearches')}</span>
                </span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {t('clearRecentSearches')}
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {recent.map((item, idx) => {
                  const isItemActive = activeIndex === idx;
                  return (
                    <div
                      key={item}
                      data-active-index={idx}
                      onClick={() => chooseRecent(item)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition ${
                        isItemActive ? 'bg-primary-50 text-primary-900 font-semibold ring-1 ring-primary-200' : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-slate-400 text-xs">🔍</span>
                        <span className="truncate font-medium">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentItem(item, e)}
                        title={t('removeRecentSearch') || 'Remove this search'}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-400 text-center">
                {t('navigateWithArrows') || 'Use ↑ ↓ to navigate, Enter to select'}
              </div>
            </div>
          )}

          {/* Live Search Results (When typing) */}
          {inputText.trim().length > 0 && (
            <div style={{ backgroundColor: '#ffffff' }} className="max-h-96 overflow-y-auto bg-white p-2 divide-y divide-slate-100">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2.5 py-7 text-sm font-medium text-slate-600">
                  <svg className="h-4 w-4 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>{t('searching')}</span>
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div className="p-5 text-center text-sm font-medium text-rose-600">
                  {t('searchFailed')}
                </div>
              )}

              {/* Empty Results State */}
              {!isLoading && !isError && data?.total === 0 && (
                <div className="py-8 px-4 text-center">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm font-semibold text-slate-800">{t('noSearchResults')}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('enterSearchTerm')}
                  </p>
                </div>
              )}

              {/* Categorized Results */}
              {!isLoading &&
                data?.groups?.map((group) => {
                  const meta = CATEGORY_META[group.type] || {
                    icon: '📄',
                    labelKey: `searchType_${group.type}`,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <div key={group.type} className="pt-2 pb-1.5 first:pt-1 last:pb-1">
                      {/* Group Category Header */}
                      <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 rounded-lg mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span>{t(meta.labelKey) || group.type}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded-full">
                          {group.count}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="mt-1 space-y-1">
                        {group.results.map((item) => {
                          const itemIndex = flatItems.findIndex(
                            (fi) => fi.type === 'result' && fi.id === `${item.entityType}-${item.id}`
                          );
                          const isItemActive = activeIndex === itemIndex;

                          return (
                            <button
                              key={`${item.entityType}-${item.id}`}
                              type="button"
                              data-active-index={itemIndex}
                              onClick={() => openResult(item)}
                              className={`w-full rounded-xl px-3 py-2.5 text-left transition flex items-start justify-between gap-3 ${
                                isItemActive
                                  ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-300 font-medium'
                                  : 'bg-white hover:bg-slate-50/90 text-slate-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.title}
                                </p>
                                {item.summary && (
                                  <p className="truncate text-xs text-slate-600 mt-0.5 leading-relaxed">
                                    {item.summary}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${meta.badgeClass}`}
                              >
                                {t(meta.labelKey) || item.entityType}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* View All Results Action Button */}
              {!isLoading && data?.total > 0 && (
                <div className="pt-2 pb-1 px-1 bg-white">
                  {(() => {
                    const viewAllIndex = flatItems.findIndex((fi) => fi.type === 'view_all');
                    const isViewAllActive = activeIndex === viewAllIndex;
                    return (
                      <button
                        type="button"
                        data-active-index={viewAllIndex}
                        onClick={viewAll}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                          isViewAllActive
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200/60'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🔍</span>
                          <span>{t('viewAllSearchResults', { count: data.total })}</span>
                        </span>
                        <span className="text-[10px] font-medium opacity-80">
                          {t('pressEnterToSearch') || 'Press Enter ↵'}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
