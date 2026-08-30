import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import organizationService from '../services/organizationService.js';

export function useOrganizationTree(params = {}) {
  return useQuery({
    queryKey: ['organization-tree', params],
    queryFn: () => organizationService.getTree(params),
    keepPreviousData: true,
  });
}

export function useUpdateReporting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, managerId }) => organizationService.updateReporting(employeeId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
