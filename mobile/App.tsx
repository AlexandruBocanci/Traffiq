import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function ThemedAppShell() {
  const { colors, resolvedMode } = useTheme();

  return (
    <>
      <StatusBar
        backgroundColor={colors.background}
        style={resolvedMode === 'dark' ? 'light' : 'dark'}
        translucent
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemedAppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
