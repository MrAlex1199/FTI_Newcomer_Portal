import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeService from '../services/employeeService.js';
export { useDepartments } from './useDepartments.js';

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

/** Invalidate all employee list queries and department labels/counts. */
const useInvalidateEmployees = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['departments'] });
  };
};

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ payload, file, onUploadProgress }) => employeeService.create(payload, file, onUploadProgress),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ id, payload, file, onUploadProgress }) => employeeService.update(id, payload, file, onUploadProgress),
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
