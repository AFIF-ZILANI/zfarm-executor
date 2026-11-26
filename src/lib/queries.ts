import { useGetAllPages } from '@/lib/api';
import type { BatchHouseBalance, FarmAlert } from '@/lib/types';

// Lists read by more than one screen. A cache key must always mean the same URL: Home and Houses once
// shared ['batch-house-balances','all'] with limit=50 and limit=100, and the bird count flipped between
// screens depending on which loaded last.

/** Every house's balance, every page: the list carries empty balances too, so one page drops live ones. */
export function useAllBalances() {
  return useGetAllPages<BatchHouseBalance>('/batch-house-balances', ['batch-house-balances', 'all']);
}

/** Every active alert, so filter counts (Critical, Warning) cover all of them, not the first page. */
export function useActiveAlerts() {
  return useGetAllPages<FarmAlert>('/alerts?status=ACTIVE', ['alerts', 'active']);
}
