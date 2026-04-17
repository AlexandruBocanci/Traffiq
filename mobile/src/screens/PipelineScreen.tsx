import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getHealthStatus,
  getTopCongestedStreets,
  getTraffic,
  getWeatherImpact,
} from '../services/traffiqApi';

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

export default function PipelineScreen() {
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
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.stateText}>Loading pipeline status...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Pipeline</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pipeline</Text>
      <Text style={styles.subtitle}>
        End-to-end Traffiq flow from ingestion to analytics serving in the mobile app.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Backend Status</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Health</Text>
          <Text style={styles.cardText}>Status: {metrics?.apiStatus ?? 'unknown'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Traffic Records</Text>
          <Text style={styles.cardText}>
            Records exposed by `/traffic`: {metrics?.trafficCount ?? 0}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weather Impact Rows</Text>
          <Text style={styles.cardText}>
            Analytics rows exposed by `/weather-impact`: {metrics?.weatherImpactCount ?? 0}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Congestion Analytics</Text>
          <Text style={styles.cardText}>
            Rows exposed by `/streets/top-congested`: {metrics?.topCongestedCount ?? 0}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pipeline Architecture</Text>

        {PIPELINE_STEPS.map((step) => (
          <View key={step.title} style={styles.card}>
            <Text style={styles.cardTitle}>{step.title}</Text>
            <Text style={styles.cardText}>{step.description}</Text>
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
  stateContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateText: {
    color: '#cbd5e1',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
