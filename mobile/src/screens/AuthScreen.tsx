import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import {
  confirmEmailSignUp,
  confirmPasswordReset,
  isUserAlreadyConfirmedError,
  isUsernameExistsError,
  requestPasswordReset,
  resendEmailConfirmationCode,
  signUpWithEmail,
} from '../services/cognitoAuth';
import { colors, radius, shadows } from '../theme/theme';
import { AuthMode } from '../types/auth';

type AuthScreenProps = {
  initialMode?: AuthMode;
};

function getModeTitle(mode: AuthMode) {
  if (mode === 'register') {
    return 'Create account';
  }

  if (mode === 'confirm') {
    return 'Confirm email';
  }

  if (mode === 'forgot') {
    return 'Reset password';
  }

  if (mode === 'reset') {
    return 'Set new password';
  }

  return 'Sign in';
}

function getPrimaryLabel(mode: AuthMode) {
  if (mode === 'register') {
    return 'Create account';
  }

  if (mode === 'confirm') {
    return 'Confirm account';
  }

  if (mode === 'forgot') {
    return 'Send reset code';
  }

  if (mode === 'reset') {
    return 'Update password';
  }

  return 'Sign in';
}

function getHelperText(mode: AuthMode) {
  if (mode === 'register') {
    return 'Use an email address and a strong password. Cognito will send a confirmation code.';
  }

  if (mode === 'confirm') {
    return 'Enter the verification code sent by Cognito to your email address.';
  }

  if (mode === 'forgot') {
    return 'Enter your account email and Cognito will send a password reset code.';
  }

  if (mode === 'reset') {
    return 'Use the reset code from your email and choose a new password.';
  }

  return 'Sign in to access saved routes, ride history, and preferences.';
}

export default function AuthScreen({ initialMode = 'login' }: AuthScreenProps) {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const needsPassword = mode === 'login' || mode === 'register' || mode === 'reset';
  const needsCode = mode === 'confirm' || mode === 'reset';

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage('');
    setErrorMessage('');
    setCode('');

    if (nextMode !== 'reset') {
      setPassword('');
    }
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setMessage('');
      setErrorMessage('');

      if (mode === 'login') {
        await signIn(email, password);
        return;
      }

      if (mode === 'register') {
        try {
          await signUpWithEmail(email, password);
          setMessage('Confirmation code sent. Check your inbox and spam folder.');
        } catch (registerError) {
          if (!isUsernameExistsError(registerError)) {
            throw registerError;
          }

          try {
            await resendEmailConfirmationCode(email);
            setMessage(
              'Account already exists but is not confirmed. We sent a new confirmation code. Check your inbox and spam folder.'
            );
          } catch (resendError) {
            if (isUserAlreadyConfirmedError(resendError)) {
              setMessage('Account already confirmed. Sign in with your password.');
              setMode('login');
              setPassword('');
              return;
            }

            throw resendError;
          }
        }

        setMode('confirm');
        setPassword('');
        return;
      }

      if (mode === 'confirm') {
        await confirmEmailSignUp(email, code);
        setMessage('Account confirmed. You can now sign in.');
        setMode('login');
        setCode('');
        return;
      }

      if (mode === 'forgot') {
        await requestPasswordReset(email);
        setMessage('Password reset code sent. Check your email.');
        setMode('reset');
        return;
      }

      await confirmPasswordReset(email, code, password);
      setMessage('Password updated. You can now sign in.');
      setMode('login');
      setCode('');
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmationCode() {
    try {
      setIsResendingCode(true);
      setMessage('');
      setErrorMessage('');

      await resendEmailConfirmationCode(email);
      setMessage('Confirmation code resent. Check your inbox and spam folder.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not resend code.');
    } finally {
      setIsResendingCode(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Traffiq account</Text>
      <Text style={styles.title}>{getModeTitle(mode)}</Text>
      <Text style={styles.helper}>{getHelperText(mode)}</Text>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
        />

        {needsCode ? (
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setCode}
            placeholder="Confirmation code"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={code}
          />
        ) : null}

        {needsPassword ? (
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder={mode === 'reset' ? 'New password' : 'Password'}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        ) : null}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.primaryButton, isSubmitting ? styles.disabledButton : null]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={styles.primaryButtonText}>{getPrimaryLabel(mode)}</Text>
        )}
      </Pressable>

      {mode === 'confirm' ? (
        <Pressable
          disabled={isResendingCode || isSubmitting}
          onPress={handleResendConfirmationCode}
          style={[styles.secondaryButton, isResendingCode ? styles.disabledButton : null]}
        >
          {isResendingCode ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.secondaryButtonText}>Resend confirmation code</Text>
          )}
        </Pressable>
      ) : null}

      <View style={styles.links}>
        {mode !== 'login' ? (
          <Pressable onPress={() => switchMode('login')}>
            <Text style={styles.linkText}>Back to sign in</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => switchMode('register')}>
              <Text style={styles.linkText}>Create account</Text>
            </Pressable>
            <Pressable onPress={() => switchMode('forgot')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  message: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  links: {
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },
});
