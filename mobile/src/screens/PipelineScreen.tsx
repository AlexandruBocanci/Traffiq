import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import {
  getHealthStatus,
  getTopCongestedStreets,
  getTraffic,
  getWeatherImpact,
} from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';

const PIPELINE_STEPS = [
  {
    title: 'Extract',
    description: 'Traffic CSV ingestion and weather API ingestion.',
  },
  {
    title: 'Bronze',
    description: 'Raw traffic and raw weather data loaded into PostgreSQL.',
  },
  {
    title: 'Silver',
    description: 'Cleaned traffic records and enriched traffic-weather layer.',
  },
  {
    title: 'Gold',
    description: 'Street metrics and weather impact analytics for serving.',
  },
  {
    title: 'FastAPI',
    description: 'Backend endpoints expose analytics to the mobile client.',
  },
  {
    title: 'Mobile',
    description: 'React Native app consumes backend data for the portfolio demo.',
  },
];

type PipelineMetrics = {
  apiStatus: string;
  trafficCount: number;
  weatherImpactCount: number;
  topCongestedCount: number;
};

type PipelineScreenProps = {
  onBackToDrive?: () => void;
};

export default function PipelineScreen({ onBackToDrive }: PipelineScreenProps) {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadPipelineContext() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [healthResponse, trafficResponse, weatherResponse, congestedResponse] =
          await Promise.all([
            getHealthStatus(),
            getTraffic(),
            getWeatherImpact(),
            getTopCongestedStreets(),
          ]);

        setMetrics({
          apiStatus: healthResponse.status,
          trafficCount: trafficResponse.count,
          weatherImpactCount: weatherResponse.count,
          topCongestedCount: congestedResponse.count,
        });
      } catch (error) {
        setErrorMessage('Failed to load pipeline status from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPipelineContext();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading pipeline status..." />;
  }

  if (errorMessage) {
    return <ErrorState title="Pipeline" message={errorMessage} />;
  }

  if (!metrics) {
    return (
      <View style={styles.emptyStateWrapper}>
        <EmptyState message="No pipeline status available." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Developer layer</Text>
            <Text style={styles.title}>Pipeline</Text>
          </View>

          {onBackToDrive ? (
            <Pressable onPress={onBackToDrive} style={styles.backButton}>
              <Text style={styles.backButtonText}>Drive</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.subtitle}>
          Temporary project status surface. This will later become account/settings or admin-only.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend status</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>API</Text>
              <Text style={styles.metricValue}>{metrics.apiStatus}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Traffic</Text>
              <Text style={styles.metricValue}>{metrics.trafficCount}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Weather</Text>
              <Text style={styles.metricValue}>{metrics.weatherImpactCount}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Congestion</Text>
              <Text style={styles.metricValue}>{metrics.topCongestedCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline architecture</Text>

          {PIPELINE_STEPS.map((step) => (
            <View key={step.title} style={styles.card}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardText}>{step.description}</Text>
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 54,
    paddingBottom: 42,
    gap: 22,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButtonText: {
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    ...shadows.card,
    width: '48%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyStateWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
