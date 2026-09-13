import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import useGlobalSearch from '../../hooks/useGlobalSearch.js';
import useLanguage from '../../hooks/useLanguage.js';

const RECENT_KEY = 'fti-recent-searches';
const MAX_RECENT = 5;

function readRecent() {
  try {
    const values = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(values) ? values.filter(Boolean).slice(0, MAX_RECENT) : [];
  } catch { return []; }
}

export default function GlobalSearch({ onSelect, className = '', variant = 'default' }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const { data, isLoading, isError } = useGlobalSearch(query, { limit: 5 });
  const visible = focused && (query.trim() || recent.length > 0);

  // Close popover when clicking outside
  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setFocused(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, []);

  // Global Cmd+K or Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const remember = (value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
  };
  const openResult = (item) => {
    remember(query);
    setFocused(false);
    if (onSelect) onSelect();
    navigate(item.url);
  };
  const viewAll = () => {
    if (!query.trim()) return;
    remember(query);
    setFocused(false);
    if (onSelect) onSelect();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  const chooseRecent = (value) => { setQuery(value); setFocused(true); };

  const isHeader = variant === 'header';

  return (
    <div ref={rootRef} className={`relative ${className || (isHeader ? 'w-full max-w-lg' : 'w-full sm:w-64 lg:w-72')}`}>
      <div className="relative flex items-center w-full">
        {isHeader && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        )}
        <SearchBar
          inputRef={inputRef}
          value={query}
          onSearch={(value) => {
            setQuery(value);
            remember(value);
            if (value.trim()) {
              setFocused(false);
              if (onSelect) onSelect();
              navigate(`/search?q=${encodeURIComponent(value.trim())}`);
            }
          }}
          onFocus={() => setFocused(true)}
          placeholder={t('globalSearchPlaceholder')}
          ariaLabel={t('globalSearch')}
          className={
            isHeader
              ? 'w-full rounded-xl border border-primary-700/60 bg-primary-950/50 py-2 pl-9 pr-14 text-sm text-white placeholder-primary-300/60 shadow-inner backdrop-blur-xs transition-all duration-200 outline-none focus:border-blue-400/80 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-3 focus:ring-blue-400/25'
              : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
          }
        />
        {isHeader && (
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center rounded border border-primary-700/60 bg-primary-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-primary-200/90 shadow-xs">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {visible && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl ring-1 ring-black/5">
          {!query.trim() && (
            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('recentSearches')}</p>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setRecent([]); try { window.localStorage.removeItem(RECENT_KEY); } catch {} }}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {t('clearRecentSearches')}
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {recent.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => chooseRecent(item)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="text-slate-400 text-xs">🕒</span>
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && (
            <div className="max-h-80 overflow-y-auto p-2">
              {isLoading && <p className="p-3 text-sm text-slate-500">{t('searching')}</p>}
              {isError && <p className="p-3 text-sm text-red-600">{t('searchFailed')}</p>}
              {!isLoading && !isError && data?.total === 0 && (
                <p className="p-3 text-sm text-slate-500">{t('noSearchResults')}</p>
              )}
              {data?.groups?.map((group) => (
                <div key={group.type} className="mb-2 last:mb-0">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t(`searchType_${group.type}`)}
                  </p>
                  {group.results.slice(0, 3).map((item) => (
                    <button
                      type="button"
                      key={`${item.entityType}-${item.id}`}
                      onClick={() => openResult(item)}
                      className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-primary-50 transition"
                    >
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.summary}</p>
                    </button>
                  ))}
                </div>
              ))}
              {data?.total > 0 && (
                <button
                  type="button"
                  onClick={viewAll}
                  className="mt-1 w-full border-t border-slate-100 px-2 pt-2.5 pb-1 text-left text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {t('viewAllSearchResults', { count: data.total })}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
