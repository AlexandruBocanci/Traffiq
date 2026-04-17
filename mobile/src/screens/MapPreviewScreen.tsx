import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getTopCongestedStreets,
  getTopSpeedTraffic,
} from '../services/traffiqApi';
import { TopCongestedStreetRecord, TrafficRecord } from '../types/api';

export default function MapPreviewScreen() {
  const [topSpeedData, setTopSpeedData] = useState<TrafficRecord[]>([]);
  const [topCongestedData, setTopCongestedData] = useState<TopCongestedStreetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadMapPreviewData() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [topSpeedResponse, topCongestedResponse] = await Promise.all([
          getTopSpeedTraffic(),
          getTopCongestedStreets(),
        ]);

        setTopSpeedData(topSpeedResponse.data);
        setTopCongestedData(topCongestedResponse.data);
      } catch (error) {
        setErrorMessage('Failed to load map preview analytics from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMapPreviewData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.stateText}>Loading map preview analytics...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Map Preview</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Map Preview</Text>
      <Text style={styles.subtitle}>
        Traffic analytics preview powered by top-speed and top-congested backend endpoints.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fastest Traffic Segments</Text>

        {topSpeedData.length === 0 ? (
          <Text style={styles.emptyText}>No top-speed traffic data available.</Text>
        ) : (
          topSpeedData.map((item) => (
            <View key={item.traffic_obs_id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.street_name}</Text>
              <Text style={styles.cardText}>Speed: {item.avg_speed ?? 'N/A'} km/h</Text>
              <Text style={styles.cardText}>Weather: {item.weather_label ?? 'N/A'}</Text>
              <Text style={styles.metaText}>{item.event_timestamp}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Congested Streets</Text>

        {topCongestedData.length === 0 ? (
          <Text style={styles.emptyText}>No congestion data available.</Text>
        ) : (
          topCongestedData.map((item, index) => (
            <View
              key={`${item.metric_date}-${item.street_name}-${item.hour_of_day}-${index}`}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.street_name}</Text>
              <Text style={styles.cardText}>Hour: {item.hour_of_day}:00</Text>
              <Text style={styles.cardText}>Avg speed: {item.avg_speed ?? 'N/A'} km/h</Text>
              <Text style={styles.cardText}>
                Congestion score: {item.congestion_score ?? 'N/A'}
              </Text>
              <Text style={styles.metaText}>{item.metric_date}</Text>
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
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 15,
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
