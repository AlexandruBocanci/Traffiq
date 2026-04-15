import { StyleSheet, Text, View } from 'react-native';

export default function MapPreviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Preview</Text>
      <Text style={styles.description}>
        This screen will present an analytical map-style preview for traffic insights.
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
