import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PillOption<T extends string> = {
  value: T;
  label: string;
  tone?: 'success' | 'critical';
  /** Shown but not selectable (greyed). */
  disabled?: boolean;
};

type PillSelectProps<T extends string> = {
  options: PillOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Lay the options out as an even grid of this many columns: every option the same width and height,
   *  instead of pills sized by their label. For a short fixed choice that should read as one block. */
  columns?: number;
};

/** A wrapping row of single-select pills -- used for small fixed enums
 *  (time_period, feed_type) and for the performance criteria grid, where
 *  each option's label already carries its point value. */
export function PillSelect<T extends string>({ options, value, onChange, columns }: PillSelectProps<T>) {
  const theme = useTheme();

  const pill = (opt: PillOption<T>) => {
    const active = opt.value === value;
    const textColor = active ? 'onPrimary' : (opt.tone ?? 'inkSoft');
    return (
      <Pressable
        key={opt.value}
        onPress={() => onChange(opt.value)}
        disabled={opt.disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled: !!opt.disabled }}
        style={[
          columns ? styles.cell : styles.pill,
          {
            borderColor: active ? theme.primary : theme.line,
            backgroundColor: active ? theme.primary : theme.surface,
            opacity: opt.disabled ? 0.45 : 1,
          },
        ]}
      >
        <AppText variant="label" color={textColor} style={columns ? styles.centre : undefined} numberOfLines={2}>
          {opt.label}
        </AppText>
      </Pressable>
    );
  };

  if (columns) {
    // Rows of equal cells; a short last row keeps its cells the same width with empty spacers.
    const rows: PillOption<T>[][] = [];
    for (let i = 0; i < options.length; i += columns) rows.push(options.slice(i, i + columns));
    return (
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map(pill)}
            {Array.from({ length: columns - row.length }, (_, k) => (
              <View key={`spacer-${k}`} style={styles.cell} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return <View style={styles.wrap}>{options.map(pill)}</View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  grid: { gap: Spacing.sm },
  gridRow: { flexDirection: 'row', gap: Spacing.sm },
  // Grid cells: equal width, full touch height, the app's one radius (a pill shape stretched wide reads oddly).
  cell: {
    flex: 1,
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.control,
  },
  centre: { textAlign: 'center' },
  pill: {
    minHeight: MinTouchTarget - 8,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
});
