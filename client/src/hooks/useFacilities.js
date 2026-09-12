import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import facilityService from '../services/facilityService.js';

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: () => facilityService.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => facilityService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => facilityService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => facilityService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useAddFacilityFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => facilityService.addFloor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}
