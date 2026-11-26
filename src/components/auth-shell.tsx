import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Constants from 'expo-constants';

import { AppText } from '@/components/ui/text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const MARK = {
  light: require('../../assets/brand/ios/splash/SplashLogo-light.png'),
  dark: require('../../assets/brand/ios/splash/SplashLogo-dark.png'),
};

/**
 * The frame for the signed-out screens (sign in, and the forced password change after a temporary one): the
 * brand at the top, the form on the page itself (no card around it), and a quiet footer with the version.
 * Same Z and the same black/white as the app icon and splash, so opening the app reads as one thing.
 */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  /** Under the form, above the version line: help text or a secondary action. */
  footer?: ReactNode;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.ground }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={[styles.mark, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Image source={MARK[scheme]} style={styles.markImage} contentFit="contain" accessibilityIgnoresInvertColors />
            </View>
            <View>
              <AppText variant="h2">ZFarm Executor</AppText>
              <AppText variant="caption" color="muted">
                ZeroD Farms
              </AppText>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.heading}>
              <AppText variant="h1">{title}</AppText>
              {intro ? (
                <AppText variant="body" color="muted">
                  {intro}
                </AppText>
              ) : null}
            </View>
            {children}
          </View>

          <View style={styles.footer}>
            {footer}
            <AppText variant="caption" color="muted" style={styles.centre}>
              Version {Constants.expoConfig?.version ?? ''}
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** One message above the submit button: why the last try failed, or what happened to the session. */
export function AuthNotice({ tone, icon, children }: { tone: 'critical' | 'warning'; icon: IconName; children: ReactNode }) {
  const theme = useTheme();
  const fill: ThemeColor = tone === 'critical' ? 'tintRed' : 'tintAmber';
  return (
    <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme[fill] }]}>
      <Icon name={icon} size={20} color={tone} />
      <AppText variant="label" style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, paddingBottom: Spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mark: {
    width: 52,
    height: 52,
    borderRadius: Radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markImage: { width: 34, height: 34 },
  // The form sits a little above the middle, where the thumb and the eye meet.
  body: { flex: 1, justifyContent: 'center', gap: Spacing.xxl, paddingVertical: Spacing.xxxl },
  heading: { gap: Spacing.sm },
  footer: { gap: Spacing.md, alignItems: 'center' },
  centre: { textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radius.control,
    padding: Spacing.md,
  },
});
