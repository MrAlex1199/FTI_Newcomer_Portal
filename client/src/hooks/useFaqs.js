import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import faqService from '../services/faqService.js';

export function useFaqs(params = {}) {
  return useQuery({ queryKey: ['faqs', params], queryFn: () => faqService.list(params), keepPreviousData: true });
}

export function useFaqCategories() {
  return useQuery({ queryKey: ['faq-categories'], queryFn: faqService.categories, staleTime: 10 * 60 * 1000 });
}

const useInvalidateFaqs = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['faqs'] });
};

export function useCreateFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({ mutationFn: faqService.create, onSuccess: invalidate });
}
export function useUpdateFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({ mutationFn: ({ id, payload }) => faqService.update(id, payload), onSuccess: invalidate });
}
export function useDeleteFaq() {
  const invalidate = useInvalidateFaqs();
  return useMutation({ mutationFn: faqService.remove, onSuccess: invalidate });
}
export function useReorderFaqs() {
  const invalidate = useInvalidateFaqs();
  return useMutation({ mutationFn: ({ category, items }) => faqService.reorder(category, items), onSuccess: invalidate });
}
