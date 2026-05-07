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
import { getRidesHistory } from '../services/traffiqApi';
import { RideHistoryRecord } from '../types/api';

export default function HistoryScreen() {
  const [rideHistoryData, setRideHistoryData] = useState<RideHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadRideHistory() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await getRidesHistory();
        setRideHistoryData(response.data);
      } catch (error) {
        setErrorMessage('Failed to load ride history from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRideHistory();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading ride history..." />;
  }

  if (errorMessage) {
    return <ErrorState title="History" message={errorMessage} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>
        Previous analyzed rides loaded from `/rides/history`.
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>History Layer</Text>
        <Text style={styles.heroTitle}>
          {rideHistoryData.length} ride history records available
        </Text>
        <Text style={styles.heroText}>
          Each record is loaded from the Silver ride history layer and served through
          the FastAPI backend.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Ride Checks</Text>

        {rideHistoryData.length === 0 ? (
          <EmptyState message="No ride history data available." />
        ) : (
          rideHistoryData.map((ride) => (
            <View key={ride.ride_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{ride.route_name}</Text>
                <Text style={styles.statusBadge}>{ride.ride_status}</Text>
              </View>
              <Text style={styles.cardText}>
                {ride.origin_name} to {ride.destination_name}
              </Text>
              <Text style={styles.cardText}>
                Distance: {ride.distance_km ?? 'N/A'} km
              </Text>
              <Text style={styles.cardText}>
                Avg speed: {ride.avg_speed ?? 'N/A'} km/h
              </Text>
              <Text style={styles.cardText}>
                Congestion score: {ride.congestion_score ?? 'N/A'}
              </Text>
              <Text style={styles.cardText}>
                Duration: {ride.estimated_duration_minutes ?? 'N/A'} min
              </Text>
              <Text style={styles.metaText}>
                Started: {ride.started_at}
              </Text>
              <Text style={styles.metaText}>
                Ended: {ride.ended_at}
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
  statusBadge: {
    backgroundColor: '#164e63',
    borderRadius: 999,
    color: '#cffafe',
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
    marginTop: 2,
  },
});
