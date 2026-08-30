import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import announcementService from '../services/announcementService.js';

export function useAnnouncements(params = {}) {
  return useQuery({ queryKey: ['announcements', params], queryFn: () => announcementService.list(params), keepPreviousData: true });
}

export function useAnnouncementCategories() {
  return useQuery({ queryKey: ['announcement-categories'], queryFn: announcementService.categories, staleTime: 10 * 60 * 1000 });
}

const useInvalidateAnnouncements = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['announcements'] });
};

export function useCreateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: announcementService.create, onSuccess: invalidate });
}

export function useUpdateAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: announcementService.update, onSuccess: invalidate });
}

export function useDeleteAnnouncement() {
  const invalidate = useInvalidateAnnouncements();
  return useMutation({ mutationFn: announcementService.remove, onSuccess: invalidate });
}
