import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { initials } from '@/lib/farm';

/** A person's photo, or their initials on a soft brand tint when there is none or it won't load. */
export function Avatar({ name, uri, size = 40 }: { name: string; uri?: string | null; size?: number }) {
  const theme = useTheme();
  const box = { width: size, height: size, borderRadius: Radius.pill };

  // Initials always sit underneath: a photo that fails to load (a dead link, offline with nothing cached)
  // leaves them showing instead of a blank circle.
  return (
    <View style={[styles.fallback, box, { backgroundColor: theme.primarySoft }]}>
      <AppText variant="data" color="primary">
        {initials(name)}
      </AppText>
      {uri ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, box]}
          contentFit="cover"
          accessibilityLabel={`${name}'s photo`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
