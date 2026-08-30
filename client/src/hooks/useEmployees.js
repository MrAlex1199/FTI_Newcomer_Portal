import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeService from '../services/employeeService.js';
import departmentService from '../services/departmentService.js';

/**
 * TanStack Query layer for employees. The query key includes the params object
 * so each distinct search/filter/page combination is cached separately and
 * refetched only when those inputs change. `keepPreviousData` keeps the old
 * page visible while the next one loads, avoiding a flash of empty table on
 * pagination.
 */
export function useEmployees(params) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.list(params),
    keepPreviousData: true,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
    staleTime: 5 * 60 * 1000, // Departments rarely change; cache for 5 min.
  });
}

/** Invalidate all employee list queries so they refetch after a mutation. */
const useInvalidateEmployees = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['employees'] });
};

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (payload) => employeeService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, payload }) => employeeService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (id) => employeeService.remove(id),
    onSuccess: invalidate,
  });
}
