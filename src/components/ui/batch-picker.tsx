import { PickerField } from '@/components/ui/picker-field';
import { useGetData, type Paginated } from '@/lib/api';
import type { Batch } from '@/lib/types';

type BatchPickerProps = {
  value: Batch | null;
  onChange: (batch: Batch) => void;
  error?: string;
};

/** Used by Transfer (C16) and Feeding program (C17) -- the two Manager
 *  screens that act on a batch directly rather than resolving one from a
 *  house. */
export function BatchPicker({ value, onChange, error }: BatchPickerProps) {
  const { data, isLoading, isError, refetch } = useGetData<Paginated<Batch>>('/batches?status=RUNNING&limit=100', [
    'batches',
    'running',
  ]);

  return (
    <PickerField
      label="Batch"
      value={value}
      options={data?.results ?? []}
      getKey={(b) => b.id}
      getLabel={(b) => b.batch_code}
      getSubLabel={(b) => b.breed}
      onChange={onChange}
      loading={isLoading}
      onRetry={isError && !data ? () => void refetch() : undefined}
      error={error}
      emptyLabel="No running batches."
    />
  );
}
