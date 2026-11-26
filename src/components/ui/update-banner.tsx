import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppUpdate } from '@/lib/use-app-update';
import { checkDownloaded, install, startDownload, useUpdateDownload } from '@/lib/update-download';

const mb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;

/**
 * Shown only when a newer APK is on the latest release. The app downloads it itself, shows the progress here,
 * and opens Android's installer when it's done.
 */
export function UpdateBanner() {
  const theme = useTheme();
  const update = useAppUpdate();
  const download = useUpdateDownload();

  // Downloaded earlier and the app was closed before installing: offer Install straight away.
  useEffect(() => {
    if (update) checkDownloaded(update);
  }, [update]);

  if (!update) return null;

  // A download for an older release (a newer one came out meanwhile) doesn't count.
  const mine = download.phase !== 'idle' && download.version === update.version ? download : null;

  if (mine?.phase === 'downloading') {
    const pct = mine.progress === null ? null : Math.round(mine.progress * 100);
    const sofar = update.size > 0 ? `${mb(mine.bytes)} of ${mb(update.size)}` : mb(mine.bytes);
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Downloading version ${update.version}`}
        accessibilityValue={pct === null ? undefined : { min: 0, max: 100, now: pct }}
        style={[styles.banner, { backgroundColor: theme.tintBlue }]}
      >
        <Icon name="download" size={20} color="info" />
        <View style={styles.flex}>
          <View style={styles.row}>
            <AppText variant="label">Downloading version {update.version}</AppText>
            {pct !== null ? <AppText variant="data">{pct}%</AppText> : null}
          </View>
          <View style={[styles.track, { backgroundColor: theme.line }]}>
            <View style={[styles.fill, { backgroundColor: theme.primary, width: `${pct ?? 5}%` }]} />
          </View>
          <AppText variant="caption" color="muted">
            {sofar}. Keep the app open until it finishes.
          </AppText>
        </View>
      </View>
    );
  }

  const tap: { icon: IconName; color: ThemeColor; tint: ThemeColor; title: string; hint: string; onPress: () => void } =
    mine?.phase === 'ready'
      ? {
          icon: 'check-circle',
          color: 'success',
          tint: 'tintGreen',
          title: `Version ${update.version} is ready`,
          hint: 'Tap to install',
          onPress: () => void install(update.version),
        }
      : mine?.phase === 'failed'
        ? {
            icon: 'alert-circle',
            color: 'critical',
            tint: 'tintRed',
            title: 'The download stopped',
            hint: 'Check your connection, then tap to try again',
            onPress: () => void startDownload(update),
          }
        : {
            icon: 'download',
            color: 'info',
            tint: 'tintBlue',
            title: `Update available: version ${update.version}`,
            hint: update.size > 0 ? `Tap to download (${mb(update.size)})` : 'Tap to download',
            onPress: () => void startDownload(update),
          };

  return (
    <Pressable
      onPress={tap.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tap.title}. ${tap.hint}`}
      style={({ pressed }) => [styles.banner, { backgroundColor: theme[tap.tint], opacity: pressed ? 0.85 : 1 }]}
    >
      <Icon name={tap.icon} size={20} color={tap.color} />
      <View style={styles.flex}>
        <AppText variant="label">{tap.title}</AppText>
        <AppText variant="caption" color="muted">
          {tap.hint}
        </AppText>
      </View>
      <Icon name="chevron-right" size={20} color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  flex: { flex: 1, gap: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.pill },
});
