import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * "Now" for a screen, held in state (new Date() during render is impure) and moved forward whenever the
 * screen comes into view or the app comes back to the front. Tab screens stay mounted for days, so a
 * one-off `useState(() => new Date())` left Home saying "Today Nov 17" on Nov 26.
 * Returns the setter too, for a pull-to-refresh that wants to move it on by hand.
 */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(useCallback(() => setNow(new Date()), []));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => sub.remove();
  }, []);

  return [now, setNow] as const;
}
