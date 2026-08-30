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

export default function GlobalSearch() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const rootRef = useRef(null);
  const { data, isLoading, isError } = useGlobalSearch(query, { limit: 5 });
  const visible = focused && (query.trim() || recent.length > 0);

  useEffect(() => {
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setFocused(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const remember = (value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
  };
  const openResult = (item) => { remember(query); setFocused(false); navigate(item.url); };
  const viewAll = () => { if (!query.trim()) return; remember(query); setFocused(false); navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  const chooseRecent = (value) => { setQuery(value); setFocused(true); };

  return <div ref={rootRef} className="relative w-full sm:w-64 lg:w-72">
    <SearchBar value={query} onSearch={(value) => { setQuery(value); remember(value); }} onFocus={() => setFocused(true)} placeholder={t('globalSearchPlaceholder')} ariaLabel={t('globalSearch')} />
    {visible && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {!query.trim() && <div className="p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('recentSearches')}</p>{recent.length > 0 && <button type="button" onClick={() => { setRecent([]); try { window.localStorage.removeItem(RECENT_KEY); } catch {} }} className="text-xs text-primary-600 hover:underline">{t('clearRecentSearches')}</button>}</div><div className="mt-2 space-y-1">{recent.map((item) => <button type="button" key={item} onClick={() => chooseRecent(item)} className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50">{item}</button>)}</div></div>}
      {query.trim() && <div className="max-h-96 overflow-y-auto p-2">{isLoading && <p className="p-3 text-sm text-gray-500">{t('searching')}</p>}{isError && <p className="p-3 text-sm text-red-600">{t('searchFailed')}</p>}{!isLoading && !isError && data?.total === 0 && <p className="p-3 text-sm text-gray-500">{t('noSearchResults')}</p>}{data?.groups?.map((group) => <div key={group.type} className="mb-2 last:mb-0"><p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{t(`searchType_${group.type}`)}</p>{group.results.slice(0, 3).map((item) => <button type="button" key={`${item.entityType}-${item.id}`} onClick={() => openResult(item)} className="block w-full rounded-md px-2 py-2 text-left hover:bg-primary-50"><p className="truncate text-sm font-medium text-gray-800">{item.title}</p><p className="truncate text-xs text-gray-500">{item.summary}</p></button>)}</div>)}{data?.total > 0 && <button type="button" onClick={viewAll} className="mt-1 w-full border-t border-gray-100 px-2 pt-3 text-left text-sm font-medium text-primary-600 hover:underline">{t('viewAllSearchResults', { count: data.total })}</button>}</div>}
    </div>}
  </div>;
}
