import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import policyService from '../services/policyService.js';

export function usePolicies(params = {}) {
  return useQuery({ queryKey: ['policies', params], queryFn: () => policyService.list(params), keepPreviousData: true });
}

export function usePolicyCategories() {
  return useQuery({ queryKey: ['policy-categories'], queryFn: policyService.categories, staleTime: 10 * 60 * 1000 });
}

const useInvalidatePolicies = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['policies'] });
};

export function useCreatePolicy() {
  const invalidate = useInvalidatePolicies();
  return useMutation({ mutationFn: policyService.create, onSuccess: invalidate });
}
export function useUpdatePolicy() {
  const invalidate = useInvalidatePolicies();
  return useMutation({ mutationFn: ({ id, payload }) => policyService.update(id, payload), onSuccess: invalidate });
}
export function useDeletePolicy() {
  const invalidate = useInvalidatePolicies();
  return useMutation({ mutationFn: policyService.remove, onSuccess: invalidate });
}
