import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { globalSignOut, signInWithEmail } from '../services/cognitoAuth';
import { AuthSession } from '../types/auth';

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_SESSION_KEY = 'traffiq.auth.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

async function saveSession(session: AuthSession) {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

async function loadSession() {
  const rawSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  return JSON.parse(rawSession) as AuthSession;
}

async function clearSession() {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedSession = await loadSession();
        setSession(storedSession);
      } catch (error) {
        await clearSession();
        setSession(null);
      } finally {
        setIsRestoringSession(false);
      }
    }

    restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isRestoringSession,
      async signIn(email: string, password: string) {
        const nextSession = await signInWithEmail(email, password);
        await saveSession(nextSession);
        setSession(nextSession);
      },
      async signOut() {
        const accessToken = session?.tokens.accessToken;

        if (accessToken) {
          try {
            await globalSignOut(accessToken);
          } catch (error) {
            // Local logout must still work if the remote token is already expired.
          }
        }

        await clearSession();
        setSession(null);
      },
    }),
    [isRestoringSession, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
