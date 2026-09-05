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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => knowledgeService.update(variables),
    onSuccess: (_data, variables) => {
      const id = variables.id || (typeof variables === 'string' ? variables : null);
      if (id) queryClient.invalidateQueries({ queryKey: ['knowledge-article', id] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

export function useDeleteKnowledgeArticle() {
  const invalidate = useInvalidateKnowledge();
  return useMutation({ mutationFn: knowledgeService.remove, onSuccess: invalidate });
}

// Article Images
export function useAddArticleImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, file, caption }) => knowledgeService.addImage(articleId, file, caption),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

export function useRemoveArticleImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, imageId }) => knowledgeService.removeImage(articleId, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

export function useReorderArticleImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, imageIds }) => knowledgeService.reorderImages(articleId, imageIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
    },
  });
}

// Comments
export function useArticleComments(articleId, params = {}) {
  return useQuery({
    queryKey: ['knowledge-comments', articleId, params],
    queryFn: () => knowledgeService.listComments(articleId, params),
    enabled: Boolean(articleId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, body }) => knowledgeService.createComment(articleId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-comments', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, commentId }) => knowledgeService.deleteComment(articleId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-comments', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}
