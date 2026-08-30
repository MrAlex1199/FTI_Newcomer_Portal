import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import adminUserService from '../services/adminUserService.js';

export function useAdminUsers(params = {}) {
  return useQuery({ queryKey: ['admin-users', params], queryFn: () => adminUserService.list(params), keepPreviousData: true });
}

const useInvalidateUsers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });
};

export function useCreateAdminUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: adminUserService.create, onSuccess: invalidate });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: ({ id, payload }) => adminUserService.update(id, payload), onSuccess: invalidate });
}

export function useResetAdminUserPassword() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: adminUserService.resetPassword, onSuccess: invalidate });
}

export function useBulkDeactivateAdminUsers() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: adminUserService.bulkDeactivate, onSuccess: invalidate });
}
