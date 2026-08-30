import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import companyService from '../services/companyService.js';

export function useCompanyInfo() {
  return useQuery({ queryKey: ['company-info'], queryFn: companyService.get, staleTime: 5 * 60 * 1000 });
}

export function useUpdateCompanyInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.update,
    onSuccess: (company) => queryClient.setQueryData(['company-info'], company),
  });
}
