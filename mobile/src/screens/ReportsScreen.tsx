import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { getTraffic } from '../services/traffiqApi';
import { TrafficRecord } from '../types/api';

export default function ReportsScreen() {
  const [trafficData, setTrafficData] = useState<TrafficRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadTraffic() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await getTraffic();
        setTrafficData(response.data);
      } catch (error) {
        setErrorMessage('Failed to load traffic data from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTraffic();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading traffic reports..." />;
  }

  if (errorMessage) {
    return <ErrorState title="Reports" message={errorMessage} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>
        Live traffic observations loaded from the Traffiq FastAPI backend.
      </Text>

      <FlatList
        data={trafficData}
        keyExtractor={(item) => item.traffic_obs_id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.streetName}>{item.street_name}</Text>
            <Text style={styles.cardText}>Speed: {item.avg_speed ?? 'N/A'} km/h</Text>
            <Text style={styles.cardText}>Weather: {item.weather_label ?? 'N/A'}</Text>
            <Text style={styles.timestamp}>{item.event_timestamp}</Text>
          </View>
        )}
        ListEmptyComponent={<EmptyState message="No traffic data available." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  streetName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  timestamp: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});
