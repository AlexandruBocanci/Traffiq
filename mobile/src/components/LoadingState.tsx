import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../context/ThemeContext';
import { radius, shadows, ThemeColors } from '../theme/theme';

type LoadingStateProps = {
  message: string;
};

export default function LoadingState({ message }: LoadingStateProps) {
  const { colors, styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={styles.label}>Traffiq</Text>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 30,
    width: '100%',
  },
  label: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  text: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    textAlign: 'center',
  },
  });
}
