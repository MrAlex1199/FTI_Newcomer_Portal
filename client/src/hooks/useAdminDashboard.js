import { useQuery } from '@tanstack/react-query';
import adminDashboardService from '../services/adminDashboardService.js';

export function useAdminDashboardStatistics(params = {}) {
  return useQuery({
    queryKey: ['admin-dashboard-statistics', params],
    queryFn: () => adminDashboardService.statistics(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });
}
