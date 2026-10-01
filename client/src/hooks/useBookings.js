import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import bookingService from '../services/bookingService.js';

export function useBookingResources(params = {}) {
  return useQuery({
    queryKey: ['bookingResources', params],
    queryFn: () => bookingService.getResources(params),
    staleTime: 60 * 1000,
  });
}

export function useBookings(params = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingService.getBookings(params),
    staleTime: 30 * 1000,
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: ['bookingStats'],
    queryFn: () => bookingService.getStats(),
    staleTime: 30 * 1000,
  });
}

const useInvalidateBookingData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['bookingResources'] });
    queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
  };
};

export function useCreateBooking() {
  const invalidate = useInvalidateBookingData();
  return useMutation({
    mutationFn: (payload) => bookingService.createBooking(payload),
    onSuccess: invalidate,
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateBookingData();
  return useMutation({
    mutationFn: ({ id, payload }) => bookingService.cancelBooking(id, payload),
    onSuccess: invalidate,
  });
}

export function useCreateResource() {
  const invalidate = useInvalidateBookingData();
  return useMutation({
    mutationFn: (payload) => bookingService.createResource(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateResource() {
  const invalidate = useInvalidateBookingData();
  return useMutation({
    mutationFn: ({ id, payload }) => bookingService.updateResource(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteResource() {
  const invalidate = useInvalidateBookingData();
  return useMutation({
    mutationFn: (id) => bookingService.deleteResource(id),
    onSuccess: invalidate,
  });
}
