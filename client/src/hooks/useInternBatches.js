import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import batchService from '../services/internBatchService.js';

export function useInternBatches(params = {}) {
  return useQuery({
    queryKey: ['intern-batches', params],
    queryFn: () => batchService.list(params),
    keepPreviousData: true,
  });
}

export function useInternBatch(id) {
  return useQuery({
    queryKey: ['intern-batches', id],
    queryFn: () => batchService.get(id),
    enabled: Boolean(id),
  });
}

const useInvalidateBatchData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['intern-batches'] });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  };
};

export function useCreateInternBatch() {
  const invalidate = useInvalidateBatchData();
  return useMutation({ mutationFn: ({ payload, file, onUploadProgress }) => batchService.create(payload, file, onUploadProgress), onSuccess: invalidate });
}
export function useUpdateInternBatch() {
  const invalidate = useInvalidateBatchData();
  return useMutation({ mutationFn: ({ id, payload, file, onUploadProgress }) => batchService.update(id, payload, file, onUploadProgress), onSuccess: invalidate });
}
export function useDeleteInternBatch() {
  const invalidate = useInvalidateBatchData();
  return useMutation({ mutationFn: (id) => batchService.remove(id), onSuccess: invalidate });
}
