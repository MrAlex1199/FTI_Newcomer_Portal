import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import profileService from '../services/profileService.js';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.get,
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.update,
    onSuccess: (data) => queryClient.setQueryData(['profile'], data),
  });
}
