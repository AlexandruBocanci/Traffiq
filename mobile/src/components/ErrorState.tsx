import { StyleSheet, Text, View } from 'react-native';

type ErrorStateProps = {
  title: string;
  message: string;
};

export default function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  message: {
    color: '#fca5a5',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
