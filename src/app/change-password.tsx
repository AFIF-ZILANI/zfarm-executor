import { useRef, useState } from 'react';
import { Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import { router } from 'expo-router';

import { AuthNotice, AuthShell } from '@/components/auth-shell';
import { Screen } from '@/components/ui/screen';
import { Header } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

const MIN_LENGTH = 8;

/** Forced after a temporary password (the gate in _layout.tsx), voluntary from Settings. */
export default function ChangePasswordScreen() {
  const { changePassword, mustChangePassword, logout } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nextRef = useRef<TextFieldRef>(null);
  const confirmRef = useRef<TextFieldRef>(null);

  const longEnough = next.length >= MIN_LENGTH;
  const matches = confirm.length > 0 && confirm === next;
  const currentMissing = current.length === 0;

  const submit = async () => {
    if (busy) return;
    setTried(true);
    if (currentMissing || !longEnough || !matches) return;
    setBusy(true);
    setError('');
    try {
      await changePassword(current, next);
      if (Platform.OS === 'android') ToastAndroid.show('Password changed', ToastAndroid.SHORT);
      router.replace('/');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 0
            ? "Can't reach the server. You need a connection to change your password."
            : (e.fieldError('new_password') ?? e.message)
          : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <View style={styles.form}>
      {error ? (
        <AuthNotice tone="critical" icon="alert-circle">
          {error}
        </AuthNotice>
      ) : null}

      <TextField
        label={mustChangePassword ? 'Temporary password' : 'Current password'}
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => nextRef.current?.focus()}
        error={tried && currentMissing ? `Enter your ${mustChangePassword ? 'temporary' : 'current'} password.` : undefined}
      />
      <TextField
        ref={nextRef}
        label="New password"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <TextField
        ref={confirmRef}
        label="Type it again"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />

      {/* The two rules as a checklist that ticks itself, instead of an error that waits for a mistake. */}
      <View style={styles.rules}>
        <Rule met={longEnough} failed={tried && !longEnough} text={`At least ${MIN_LENGTH} characters`} />
        <Rule met={matches} failed={tried && !matches} text="Both new passwords match" />
      </View>

      <View style={styles.action}>
        <Button
          label={busy ? 'Saving…' : mustChangePassword ? 'Save and continue' : 'Save password'}
          onPress={() => void submit()}
          loading={busy}
        />
      </View>
    </View>
  );

  if (mustChangePassword) {
    return (
      <AuthShell
        title="Choose your password"
        intro="You signed in with a temporary password. Set one only you know to continue."
        footer={<Button label="Log out" variant="ghost" block onPress={() => void logout()} />}
      >
        {form}
      </AuthShell>
    );
  }

  return (
    <Screen>
      <Header title="Change password" leading="back" />
      <AppText variant="body" color="muted" style={styles.intro}>
        You stay signed in on this phone. Use the new password next time you sign in.
      </AppText>
      {form}
    </Screen>
  );
}

function Rule({ met, failed, text }: { met: boolean; failed: boolean; text: string }) {
  return (
    <View style={styles.rule} accessibilityLabel={`${text}: ${met ? 'done' : 'not yet'}`}>
      <Icon
        name={met ? 'check-circle' : failed ? 'x-circle' : 'circle'}
        size={18}
        color={met ? 'success' : failed ? 'critical' : 'muted'}
      />
      <AppText variant="caption" color={met ? 'ink' : failed ? 'critical' : 'muted'}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  intro: { marginBottom: Spacing.xl },
  rules: { gap: Spacing.sm },
  rule: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  action: { marginTop: Spacing.sm },
});
