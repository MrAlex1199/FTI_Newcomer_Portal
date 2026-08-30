import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import knowledgeService from '../services/knowledgeService.js';

export function useKnowledgeArticles(params = {}) {
  return useQuery({ queryKey: ['knowledge', params], queryFn: () => knowledgeService.list(params), keepPreviousData: true });
}

export function useKnowledgeCategories() {
  return useQuery({ queryKey: ['knowledge-categories'], queryFn: knowledgeService.categories, staleTime: 10 * 60 * 1000 });
}

export function useKnowledgeArticle(id, options = {}) {
  return useQuery({ queryKey: ['knowledge-article', id], queryFn: () => knowledgeService.get(id), enabled: Boolean(id) && options.enabled !== false });
}

export function useITQuickLinks(params = {}) {
  return useQuery({ queryKey: ['knowledge', 'it-quick-links', params], queryFn: () => knowledgeService.quickLinks(params) });
}

const useInvalidateKnowledge = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['knowledge'] });
};

export function useVoteKnowledgeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vote }) => knowledgeService.vote(id, vote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}
export function useCreateKnowledgeArticle() {
  const invalidate = useInvalidateKnowledge();
  return useMutation({ mutationFn: knowledgeService.create, onSuccess: invalidate });
}
export function useUpdateKnowledgeArticle() {
  const invalidate = useInvalidateKnowledge();
  return useMutation({ mutationFn: ({ id, payload }) => knowledgeService.update(id, payload), onSuccess: invalidate });
}
export function useDeleteKnowledgeArticle() {
  const invalidate = useInvalidateKnowledge();
  return useMutation({ mutationFn: knowledgeService.remove, onSuccess: invalidate });
}
