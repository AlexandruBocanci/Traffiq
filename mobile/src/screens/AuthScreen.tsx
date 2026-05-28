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
import { useThemedStyles } from '../context/ThemeContext';
import {
  confirmEmailSignUp,
  confirmPasswordReset,
  CognitoRequestError,
  isUserAlreadyConfirmedError,
  isUsernameExistsError,
  requestPasswordReset,
  resendEmailConfirmationCode,
  signUpWithEmail,
} from '../services/cognitoAuth';
import { radius, shadows, ThemeColors } from '../theme/theme';
import { AuthMode } from '../types/auth';

type AuthScreenProps = {
  initialMode?: AuthMode;
  onInputFocus?: () => void;
};

function getModeTitle(mode: AuthMode) {
  if (mode === 'register') {
    return 'Creează cont';
  }

  if (mode === 'confirm') {
    return 'Confirmă emailul';
  }

  if (mode === 'forgot') {
    return 'Resetează parola';
  }

  if (mode === 'reset') {
    return 'Parolă nouă';
  }

  return 'Autentificare';
}

function getPrimaryLabel(mode: AuthMode) {
  if (mode === 'register') {
    return 'Creează cont';
  }

  if (mode === 'confirm') {
    return 'Confirmă contul';
  }

  if (mode === 'forgot') {
    return 'Trimite codul';
  }

  if (mode === 'reset') {
    return 'Actualizează parola';
  }

  return 'Autentificare';
}

function getHelperText(mode: AuthMode) {
  if (mode === 'register') {
    return 'Folosește un email valid și o parolă puternică. Vei primi un cod de confirmare.';
  }

  if (mode === 'confirm') {
    return 'Introdu codul primit pe email.';
  }

  if (mode === 'forgot') {
    return 'Introdu emailul contului și vei primi un cod de resetare.';
  }

  if (mode === 'reset') {
    return 'Folosește codul primit pe email și alege o parolă nouă.';
  }

  return 'Autentifică-te pentru rute salvate, istoric și preferințe.';
}

function getFriendlyAuthError(error: unknown) {
  if (error instanceof CognitoRequestError) {
    if (error.code === 'NotAuthorizedException') {
      return 'Emailul sau parola este greșită.';
    }

    if (error.code === 'UserNotConfirmedException') {
      return 'Confirmă emailul înainte de autentificare.';
    }

    if (error.code === 'CodeMismatchException') {
      return 'Codul de confirmare nu este corect.';
    }

    if (error.code === 'ExpiredCodeException') {
      return 'Codul a expirat. Cere un cod nou și încearcă din nou.';
    }

    if (error.code === 'InvalidPasswordException') {
      return 'Folosește o parolă mai puternică.';
    }

    if (error.code === 'LimitExceededException') {
      return 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.';
    }

    if (error.code === 'UsernameExistsException') {
      return 'Există deja un cont pentru acest email.';
    }
  }

  return 'Autentificarea nu a putut fi finalizată. Verifică datele și încearcă din nou.';
}

export default function AuthScreen({
  initialMode = 'login',
  onInputFocus,
}: AuthScreenProps) {
  const { colors, styles } = useThemedStyles(createStyles);
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
          setMessage('Codul de confirmare a fost trimis. Verifică Inbox și Spam.');
        } catch (registerError) {
          if (!isUsernameExistsError(registerError)) {
            throw registerError;
          }

          try {
            await resendEmailConfirmationCode(email);
            setMessage(
              'Contul există, dar nu este confirmat. Am trimis un cod nou.'
            );
          } catch (resendError) {
            if (isUserAlreadyConfirmedError(resendError)) {
              setMessage('Contul este deja confirmat. Autentifică-te cu parola.');
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
        setMessage('Cont confirmat. Te poți autentifica.');
        setMode('login');
        setCode('');
        return;
      }

      if (mode === 'forgot') {
        await requestPasswordReset(email);
        setMessage('Codul de resetare a fost trimis pe email.');
        setMode('reset');
        return;
      }

      await confirmPasswordReset(email, code, password);
      setMessage('Parola a fost actualizată. Te poți autentifica.');
      setMode('login');
      setCode('');
      setPassword('');
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
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
      setMessage('Codul de confirmare a fost retrimis.');
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsResendingCode(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Cont Traffiq</Text>
      <Text style={styles.title}>{getModeTitle(mode)}</Text>
      <Text style={styles.helper}>{getHelperText(mode)}</Text>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          onFocus={onInputFocus}
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
            onFocus={onInputFocus}
            placeholder="Cod de confirmare"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={code}
          />
        ) : null}

        {needsPassword ? (
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            onFocus={onInputFocus}
            placeholder={mode === 'reset' ? 'Parolă nouă' : 'Parolă'}
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
            <Text style={styles.secondaryButtonText}>Retrimite codul</Text>
          )}
        </Pressable>
      ) : null}

      <View style={styles.links}>
        {mode !== 'login' ? (
          <Pressable onPress={() => switchMode('login')}>
            <Text style={styles.linkText}>Înapoi la autentificare</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => switchMode('register')}>
              <Text style={styles.linkText}>Creează cont</Text>
            </Pressable>
            <Pressable onPress={() => switchMode('forgot')}>
              <Text style={styles.linkText}>Ai uitat parola?</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
