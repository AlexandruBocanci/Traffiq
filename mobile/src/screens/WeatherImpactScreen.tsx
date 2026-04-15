import { StyleSheet, Text, View } from 'react-native';

export default function WeatherImpactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Impact</Text>
      <Text style={styles.description}>
        This screen will show how weather conditions affect traffic metrics in Traffiq.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
});
