import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import {
  getRoutesHourly,
  getRoutesReport,
} from '../services/traffiqApi';
import {
  RouteHourlyRecord,
  RouteReportRecord,
} from '../types/api';

export default function RoutesScreen() {
  const [routeReportData, setRouteReportData] = useState<RouteReportRecord[]>([]);
  const [routeHourlyData, setRouteHourlyData] = useState<RouteHourlyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadRoutesData() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [routeReportResponse, routeHourlyResponse] = await Promise.all([
          getRoutesReport(),
          getRoutesHourly(),
        ]);

        setRouteReportData(routeReportResponse.data);
        setRouteHourlyData(routeHourlyResponse.data.slice(0, 8));
      } catch (error) {
        setErrorMessage('Failed to load route analytics from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRoutesData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading route analytics..." />;
  }

  if (errorMessage) {
    return <ErrorState title="Routes" message={errorMessage} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Routes</Text>
      <Text style={styles.subtitle}>
        Route-level analytics loaded from `/routes/report` and `/routes/hourly`.
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Route Intelligence</Text>
        <Text style={styles.heroTitle}>
          {routeReportData.length} route summaries available
        </Text>
        <Text style={styles.heroText}>
          Each route combines origin, destination, traffic speed, congestion score, and
          estimated duration from the Gold analytics layer.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Report</Text>

        {routeReportData.length === 0 ? (
          <EmptyState message="No route report data available." />
        ) : (
          routeReportData.map((route) => (
            <View key={route.route_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{route.route_name}</Text>
                <Text style={styles.levelBadge}>{route.congestion_level ?? 'unknown'}</Text>
              </View>
              <Text style={styles.cardText}>
                {route.origin_name} to {route.destination_name}
              </Text>
              <Text style={styles.cardText}>
                Avg speed: {route.avg_speed ?? 'N/A'} km/h
              </Text>
              <Text style={styles.cardText}>
                Congestion score: {route.avg_congestion_score ?? 'N/A'}
              </Text>
              <Text style={styles.cardText}>
                Duration: {route.estimated_duration_minutes ?? 'N/A'} min
              </Text>
              <Text style={styles.metaText}>
                Observations: {route.observation_count} | Speed range: {route.min_speed ?? 'N/A'}-
                {route.max_speed ?? 'N/A'} km/h
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hourly Route Snapshot</Text>

        {routeHourlyData.length === 0 ? (
          <EmptyState message="No hourly route data available." />
        ) : (
          routeHourlyData.map((route, index) => (
            <View
              key={`${route.route_id}-${route.metric_date}-${route.hour_of_day}-${index}`}
              style={styles.compactCard}
            >
              <Text style={styles.cardTitle}>{route.route_name}</Text>
              <Text style={styles.cardText}>
                {route.metric_date} at {route.hour_of_day}:00
              </Text>
              <Text style={styles.cardText}>
                Avg speed: {route.avg_speed ?? 'N/A'} km/h
              </Text>
              <Text style={styles.cardText}>
                Congestion score: {route.avg_congestion_score ?? 'N/A'}
              </Text>
            </View>
          ))
        )}
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
    backgroundColor: '#102a43',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  heroLabel: {
    color: '#7dd3fc',
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
  compactCard: {
    backgroundColor: '#111c2f',
    borderWidth: 1,
    borderColor: '#243b5a',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: '#0f766e',
    borderRadius: 999,
    color: '#ccfbf1',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
