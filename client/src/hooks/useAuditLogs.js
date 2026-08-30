import { useQuery } from '@tanstack/react-query';
import auditLogService from '../services/auditLogService.js';

export function useAuditLogs(params = {}) {
  return useQuery({ queryKey: ['audit-logs', params], queryFn: () => auditLogService.list(params), keepPreviousData: true });
}
