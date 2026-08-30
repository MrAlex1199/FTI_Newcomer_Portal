import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import internService from '../services/internService.js';

export function useInterns(params) {
  return useQuery({
    queryKey: ['interns', params],
    queryFn: () => internService.list(params),
    keepPreviousData: true,
  });
}

export function useIntern(id) {
  return useQuery({
    queryKey: ['interns', id],
    queryFn: () => internService.get(id),
    enabled: Boolean(id),
  });
}

const useInvalidateInternData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    queryClient.invalidateQueries({ queryKey: ['intern-batches'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  };
};

export function useCreateIntern() {
  const invalidate = useInvalidateInternData();
  return useMutation({ mutationFn: ({ payload, file, onUploadProgress }) => internService.create(payload, file, onUploadProgress), onSuccess: invalidate });
}
export function useUpdateIntern() {
  const invalidate = useInvalidateInternData();
  return useMutation({ mutationFn: ({ id, payload, file, onUploadProgress }) => internService.update(id, payload, file, onUploadProgress), onSuccess: invalidate });
}
export function useDeleteIntern() {
  const invalidate = useInvalidateInternData();
  return useMutation({ mutationFn: (id) => internService.remove(id), onSuccess: invalidate });
}
