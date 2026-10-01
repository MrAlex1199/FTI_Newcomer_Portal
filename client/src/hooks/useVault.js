import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import vaultService from '../services/vaultService.js';

export function useVaultStatus() {
  return useQuery({
    queryKey: ['vaultStatus'],
    queryFn: () => vaultService.getStatus(),
    staleTime: 30 * 1000,
  });
}

export function useVaultItems(params = {}, pin = '') {
  return useQuery({
    queryKey: ['vaultItems', params, pin ? 'unlocked' : 'locked'],
    queryFn: () => vaultService.getItems(params, pin),
    staleTime: 10 * 1000,
  });
}

const useInvalidateVaultData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['vaultItems'] });
    queryClient.invalidateQueries({ queryKey: ['vaultStatus'] });
  };
};

export function useSetupVaultPin() {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: (payload) => vaultService.setupPin(payload),
    onSuccess: invalidate,
  });
}

export function useVerifyVaultPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin) => vaultService.verifyPin(pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultItems'] });
    },
  });
}

export function useChangeVaultPin() {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: (payload) => vaultService.changePin(payload),
    onSuccess: invalidate,
  });
}

export function useCreateVaultItem(pin = '') {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: (payload) => vaultService.createItem(payload, pin),
    onSuccess: invalidate,
  });
}

export function useUpdateVaultItem(pin = '') {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: ({ id, payload }) => vaultService.updateItem(id, payload, pin),
    onSuccess: invalidate,
  });
}

export function useDeleteVaultItem() {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: (id) => vaultService.deleteItem(id),
    onSuccess: invalidate,
  });
}

export function useToggleVaultFavorite() {
  const invalidate = useInvalidateVaultData();
  return useMutation({
    mutationFn: (id) => vaultService.toggleFavorite(id),
    onSuccess: invalidate,
  });
}
