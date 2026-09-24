import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import floorPlanService from '../services/floorPlanService.js';

export function useFloorPlans(params = {}) {
  return useQuery({
    queryKey: ['floor-plans', params],
    queryFn: () => floorPlanService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCampusAssets(query = '') {
  return useQuery({
    queryKey: ['campus-assets', query],
    queryFn: () => floorPlanService.searchCampusAssets(query),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDuplicateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sourcePlanId }) =>
      floorPlanService.duplicateLayout(id, sourcePlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useFloorPlan(id) {
  return useQuery({
    queryKey: ['floor-plan', id],
    queryFn: () => floorPlanService.getById(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: floorPlanService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useUpdateFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => floorPlanService.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
      queryClient.setQueryData(['floor-plan', updated._id], updated);
    },
  });
}

export function useDeleteFloorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: floorPlanService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}

export function useMoveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: floorPlanService.moveAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor-plans'] });
    },
  });
}
