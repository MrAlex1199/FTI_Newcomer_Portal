import { useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import useGlobalSearch from '../hooks/useGlobalSearch.js';
import useLanguage from '../hooks/useLanguage.js';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const query = params.get('q') || '';
  const { data, isLoading, isError } = useGlobalSearch(query, { limit: 20 });
  const search = (value) => { const next = value.trim(); setParams(next ? { q: next } : {}); };
  return <AppShell><div className="mb-6"><p className="text-sm text-gray-500">{t('dashboard')} / {t('globalSearch')}</p><h1 className="mt-1 text-2xl font-bold text-gray-800">{t('searchResultsTitle')}</h1><p className="mt-1 text-gray-500">{t('searchResultsSubtitle')}</p></div><div className="mb-6 max-w-xl"><SearchBar value={query} onSearch={search} placeholder={t('globalSearchPlaceholder')} ariaLabel={t('globalSearch')} /></div>{!query.trim() && <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">{t('enterSearchTerm')}</div>}{query.trim() && isLoading && <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">{t('searching')}</div>}{query.trim() && isError && <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{t('searchFailed')}</div>}{query.trim() && !isLoading && !isError && data?.total === 0 && <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">{t('noSearchResults')}</div>}{query.trim() && !isLoading && !isError && data?.groups?.length > 0 && <div className="space-y-5">{data.groups.map((group) => <section key={group.type} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-gray-800">{t(`searchType_${group.type}`)}</h2><span className="text-sm text-gray-500">{t('searchResultCount', { count: group.count })}</span></div><div className="mt-3 divide-y divide-gray-100">{group.results.map((item) => <button type="button" key={`${item.entityType}-${item.id}`} onClick={() => navigate(item.url)} className="block w-full py-3 text-left first:pt-0 last:pb-0 hover:bg-gray-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-medium text-primary-700">{item.title}</h3><p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.summary}</p></div><span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{Math.round(item.score * 100)}%</span></div></button>)}</div></section>)}</div>}</AppShell>;
}
