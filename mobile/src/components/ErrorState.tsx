import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows } from '../theme/theme';

type ErrorStateProps = {
  actionLabel?: string;
  title: string;
  message: string;
  onAction?: () => void;
};

export default function ErrorState({
  actionLabel,
  title,
  message,
  onAction,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Connection issue</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.redDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 24,
    width: '100%',
  },
  label: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  message: {
    color: '#fca5a5',
    fontSize: 16,
    lineHeight: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
