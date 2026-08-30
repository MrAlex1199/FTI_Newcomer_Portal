import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import feedbackService from '../services/feedbackService.js';

export function useFeedback(params = {}) {
  return useQuery({ queryKey: ['feedback', params], queryFn: () => feedbackService.list(params), keepPreviousData: true });
}

const useInvalidateFeedback = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['feedback'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-statistics'] });
  };
};

export function useSubmitFeedback() {
  return useMutation({ mutationFn: feedbackService.submit });
}

export function useUpdateFeedbackStatus() {
  const invalidate = useInvalidateFeedback();
  return useMutation({ mutationFn: feedbackService.updateStatus, onSuccess: invalidate });
}
