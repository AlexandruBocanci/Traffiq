import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const MODULES = [
  {
    title: 'Reports',
    description: 'Traffic reports backed by FastAPI endpoints.',
  },
  {
    title: 'Weather Impact',
    description: 'Weather-aware traffic analytics for Traffiq v1.',
  },
  {
    title: 'Map Preview',
    description: 'Analytical traffic preview, not live navigation.',
  },
  {
    title: 'Pipeline',
    description: 'ETL visibility for the portfolio demo flow.',
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Traffiq v1</Text>
          <Text style={styles.title}>Mobile foundation</Text>
          <Text style={styles.subtitle}>
            Backend-driven traffic intelligence app connected to the Traffiq API.
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FastAPI</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PostgreSQL</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Bronze / Silver / Gold</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>v1 modules</Text>

          {MODULES.map((module) => (
            <View key={module.title} style={styles.card}>
              <Text style={styles.cardTitle}>{module.title}</Text>
              <Text style={styles.cardDescription}>{module.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  hero: {
    marginTop: 16,
    gap: 10,
  },
  kicker: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    gap: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
});
