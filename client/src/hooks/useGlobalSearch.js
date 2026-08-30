import { useQuery } from '@tanstack/react-query';
import searchService from '../services/searchService.js';

export default function useGlobalSearch(query, options = {}) {
  const normalized = query?.trim() || '';
  return useQuery({
    queryKey: ['global-search', normalized, options.limit || 5],
    queryFn: () => searchService.search({ q: normalized, limit: options.limit || 5 }),
    enabled: normalized.length > 0 && options.enabled !== false,
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });
}
