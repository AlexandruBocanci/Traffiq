import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../context/ThemeContext';
import { radius, ThemeColors } from '../theme/theme';

type EmptyStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title?: string;
};

export default function EmptyState({
  actionLabel,
  message,
  onAction,
  title,
}: EmptyStateProps) {
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 7,
    textAlign: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  });
}
