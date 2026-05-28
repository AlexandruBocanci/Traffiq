import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { ThemeMode } from '../types/api';
import { ThemeColors, themes } from '../theme/theme';

type ResolvedThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  colors: ThemeColors;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

type ThemedStyles<T> = {
  colors: ThemeColors;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  styles: T;
};

const THEME_MODE_KEY = 'traffiq.preferences.themeMode.v1';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

function normalizeThemeMode(value: string | null): ThemeMode {
  if (value === 'dark' || value === 'light' || value === 'system') {
    return value;
  }

  return 'system';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    async function restoreThemeMode() {
      const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      setMode(normalizeThemeMode(storedMode));
    }

    restoreThemeMode();
  }, []);

  const resolvedMode: ResolvedThemeMode =
    mode === 'system' ? (systemColorScheme === 'light' ? 'light' : 'dark') : mode;
  const colors = themes[resolvedMode];

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode,
      resolvedMode,
      async setThemeMode(nextMode) {
        setMode(nextMode);
        await AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
      },
    }),
    [colors, mode, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}

export function useThemedStyles<T>(
  createStyles: (colors: ThemeColors) => T
): ThemedStyles<T> {
  const { colors, mode, resolvedMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);

  return {
    colors,
    mode,
    resolvedMode,
    styles,
  };
}
