import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const HISTORY_FEATURES = [
  {
    title: 'Previous Ride Checks',
    description: 'Reusable ride summaries loaded from the backend history endpoint.',
  },
  {
    title: 'Route Context',
    description: 'Origin, destination, route name, duration, speed, and congestion score.',
  },
  {
    title: 'Portfolio Product Feel',
    description: 'A dedicated history area makes Traffiq feel closer to a real app.',
  },
];

export default function HistoryScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>
        Ride history will connect to `/rides/history` and show previous analyzed trips.
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>History Layer</Text>
        <Text style={styles.heroTitle}>Past route checks become reusable analytical records.</Text>
        <Text style={styles.heroText}>
          This creates a clean destination for the ride history data model built in the
          backend during v2.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planned History Views</Text>

        {HISTORY_FEATURES.map((feature) => (
          <View key={feature.title} style={styles.card}>
            <Text style={styles.cardTitle}>{feature.title}</Text>
            <Text style={styles.cardText}>{feature.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  heroLabel: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
  },
  heroText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
});
