import { Pressable, View, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useQueryClient } from '@tanstack/react-query';

import { useGetData, type Paginated } from '@/lib/api';
import { pickLiveBalance } from '@/lib/batch-balance';
import { formatBatchCode } from '@/lib/format';
import { dayOfCycle } from '@/lib/farm';
import { humanise } from '@/lib/profile-format';
import type { BatchHouseBalance } from '@/lib/types';

const ALL_BALANCES_KEY = ['batch-house-balances', 'all'];

/**
 * GET /batch-house-balances?house_id=X is the batch lookup for every form
 * needing a batch_id — it doubles as the live count display. One request
 * serves both. docs/layout/07-log-mortality.md.
 *
 * Reads a few rows, not one: the server lists a house's balances newest-updated
 * first with no quantity filter, so a zero row can sort ahead of the live batch;
 * `pickLiveBalance` takes the first row with birds in it.
 */
export function useResolvedBatch(houseId: string | undefined) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetData<Paginated<BatchHouseBalance>>(
    `/batch-house-balances?house_id=${houseId ?? ''}&limit=20`,
    ['batch-house-balances', houseId ?? 'none'],
    {
      enabled: !!houseId,
      // Offline, a house not opened before had nothing cached, and the form said "No batch in this house":
      // no logging in a shed without signal. The farm-wide list Home and Houses keep cached already holds
      // this house's rows, so start from those (dated as that list, so it still refetches when it can).
      initialData: () => {
        const all = queryClient.getQueryData<Paginated<BatchHouseBalance>>(ALL_BALANCES_KEY);
        const rows = all?.results.filter((b) => b.house_id === houseId);
        return all && rows?.length ? { ...all, results: rows, total: rows.length } : undefined;
      },
      initialDataUpdatedAt: () => queryClient.getQueryState(ALL_BALANCES_KEY)?.dataUpdatedAt,
    },
  );
  return {
    balance: pickLiveBalance(data?.results),
    isLoading: !!houseId && isLoading,
    failed: !!houseId && isError && !data,
    retry: () => void refetch(),
  };
}

/**
 * The house picker's companion block — read-only, not a field. It exists so
 * the worker can check they're logging against the right flock before
 * writing, which is the most valuable thing on a log form.
 * docs/layout/07-log-mortality.md §3.
 */
export function BatchResolver({ houseId }: { houseId: string | undefined }) {
  const theme = useTheme();
  const { balance, isLoading, failed, retry } = useResolvedBatch(houseId);

  if (!houseId) {
    return (
      <View style={[styles.block, { backgroundColor: theme.surfaceAlt }]}>
        <AppText variant="caption" color="muted">
          Pick a house to see its flock.
        </AppText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.block, { backgroundColor: theme.surfaceAlt }]}>
        <Skeleton width="60%" height={18} />
      </View>
    );
  }

  // Not knowing is not the same as "no batch": say the lookup failed and offer another go.
  if (failed) {
    return (
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Couldn't load this house's flock. Tap to try again."
        style={[styles.block, styles.row, { backgroundColor: theme.tintAmber }]}
      >
        <Icon name="wifi-off" size={20} color="warning" />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{"Couldn't load this house's flock"}</AppText>
          <AppText variant="caption" color="muted">
            Check your connection, then tap to try again.
          </AppText>
        </View>
        <Icon name="refresh-cw" size={20} color="muted" />
      </Pressable>
    );
  }

  if (!balance) {
    return (
      <View style={[styles.block, styles.row, { backgroundColor: theme.tintRed }]}>
        <Icon name="alert-circle" size={20} color="critical" />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">No batch in this house</AppText>
          <AppText variant="caption" color="muted">
            Nothing can be logged here.
          </AppText>
        </View>
      </View>
    );
  }

  const batch = balance.batch;

  // Quiet on purpose: this is a check ("am I on the right flock?"), not a result.
  return (
    <View style={[styles.block, styles.row, { backgroundColor: theme.surfaceAlt }]}>
      <View style={styles.flex}>
        <AppText variant="label">{formatBatchCode(batch?.batch_code, balance.batch_id)}</AppText>
        {batch ? (
          <AppText variant="caption" color="muted">
            {humanise(batch.breed)} · day {dayOfCycle(batch.starting_date)}
          </AppText>
        ) : null}
      </View>
      <View style={styles.birds}>
        <AppText variant="figure">{balance.quantity.toLocaleString()}</AppText>
        <AppText variant="caption" color="muted">
          live birds
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: {
    minHeight: 60,
    justifyContent: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.control,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  birds: { alignItems: 'flex-end' },
});
