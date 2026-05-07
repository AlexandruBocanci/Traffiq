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
  getMapEvents,
  getTopCongestedStreets,
  getTopSpeedTraffic,
} from '../services/traffiqApi';
import {
  MapEventRecord,
  TopCongestedStreetRecord,
  TrafficRecord,
} from '../types/api';

export default function MapPreviewScreen() {
  const [topSpeedData, setTopSpeedData] = useState<TrafficRecord[]>([]);
  const [topCongestedData, setTopCongestedData] = useState<TopCongestedStreetRecord[]>([]);
  const [mapEventsData, setMapEventsData] = useState<MapEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadMapPreviewData() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [topSpeedResponse, topCongestedResponse, mapEventsResponse] = await Promise.all([
          getTopSpeedTraffic(),
          getTopCongestedStreets(),
          getMapEvents(),
        ]);

        setTopSpeedData(topSpeedResponse.data);
        setTopCongestedData(topCongestedResponse.data);
        setMapEventsData(mapEventsResponse.data);
      } catch (error) {
        setErrorMessage('Failed to load map preview analytics from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMapPreviewData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading map preview analytics..." />;
  }

  if (errorMessage) {
    return <ErrorState title="Map Preview" message={errorMessage} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Map Preview</Text>
      <Text style={styles.subtitle}>
        Traffic analytics and events powered by backend serving endpoints.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traffic Events</Text>

        {mapEventsData.length === 0 ? (
          <EmptyState message="No traffic events available." />
        ) : (
          mapEventsData.map((event) => (
            <View key={event.event_id} style={styles.eventCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{event.street_name}</Text>
                <Text style={styles.eventBadge}>{event.severity}</Text>
              </View>
              <Text style={styles.eventType}>{event.event_type}</Text>
              <Text style={styles.cardText}>{event.event_description}</Text>
              <Text style={styles.metaText}>{event.event_timestamp}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fastest Traffic Segments</Text>

        {topSpeedData.length === 0 ? (
          <EmptyState message="No top-speed traffic data available." />
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
          <EmptyState message="No congestion data available." />
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
  eventCard: {
    backgroundColor: '#1c2437',
    borderWidth: 1,
    borderColor: '#334155',
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
  eventBadge: {
    backgroundColor: '#7f1d1d',
    borderRadius: 999,
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  eventType: {
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
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
});
