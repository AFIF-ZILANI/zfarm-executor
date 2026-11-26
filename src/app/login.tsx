import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthNotice, AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

type Problem =
  | { kind: 'unreachable' }
  | { kind: 'rejected'; message: string }
  /** The server's 400 for a malformed address: said on the Email field, not as "Validation failed". */
  | { kind: 'bad-email' }
  | null;

/** The gate in _layout.tsx sends anyone without a session here, and away again once there is one. */
export default function LoginScreen() {
  const { login, expired } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Field hints appear only after a tap on Sign in: a grey, dead button never says what it's waiting for.
  const [tried, setTried] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextFieldRef>(null);

  const emailMissing = email.trim().length === 0;
  const passwordMissing = password.length === 0;

  const submit = async () => {
    if (busy) return;
    setTried(true);
    if (emailMissing || passwordMissing) return;
    setBusy(true);
    setProblem(null);
    try {
      await login(email.trim(), password);
      // The gate navigates on its own once the session lands.
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) setProblem({ kind: 'unreachable' });
      else if (e instanceof ApiError && e.status === 400 && e.fieldError('email')) setProblem({ kind: 'bad-email' });
      else if (e instanceof ApiError && e.status === 401)
        setProblem({ kind: 'rejected', message: "That email and password don't match. Check both and try again." });
      else setProblem({ kind: 'rejected', message: e instanceof ApiError ? e.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      intro="Use the email and password your manager gave you."
      footer={
        <AppText variant="caption" color="muted" style={styles.centre}>
          Forgot your password? Ask your manager to reset it.
        </AppText>
      }
    >
      <View style={styles.form}>
        {problem?.kind === 'unreachable' ? (
          <AuthNotice tone="critical" icon="wifi-off">
            {"Can't reach the server. Check your internet connection and try again."}
          </AuthNotice>
        ) : problem?.kind === 'rejected' ? (
          <AuthNotice tone="critical" icon="alert-circle">
            {problem.message}
          </AuthNotice>
        ) : expired ? (
          <AuthNotice tone="warning" icon="clock">
            {"You were signed out. Sign in again: anything you recorded and haven't synced is still on this phone."}
          </AuthNotice>
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setProblem(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={
            tried && emailMissing
              ? 'Enter your email.'
              : problem?.kind === 'bad-email'
                ? "That isn't a full email address. Check it and try again."
                : undefined
          }
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setProblem(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          error={tried && passwordMissing ? 'Enter your password.' : undefined}
        />
        <View style={styles.action}>
          <Button label={busy ? 'Signing in…' : 'Sign in'} onPress={() => void submit()} loading={busy} />
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  action: { marginTop: Spacing.sm },
  centre: { textAlign: 'center' },
});
