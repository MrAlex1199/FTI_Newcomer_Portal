import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import departmentService from '../services/departmentService.js';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: ['departments', id],
    queryFn: () => departmentService.get(id),
    enabled: Boolean(id),
  });
}

const useInvalidateDepartmentData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };
};

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: (payload) => departmentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: ({ id, payload }) => departmentService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: (id) => departmentService.remove(id),
    onSuccess: invalidate,
  });
}
