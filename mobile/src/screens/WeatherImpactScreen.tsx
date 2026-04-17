import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getWeatherImpact } from '../services/traffiqApi';
import { WeatherImpactRecord } from '../types/api';

export default function WeatherImpactScreen() {
  const [weatherData, setWeatherData] = useState<WeatherImpactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadWeatherImpact() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await getWeatherImpact();
        setWeatherData(response.data);
      } catch (error) {
        setErrorMessage('Failed to load weather impact data from the backend.');
      } finally {
        setIsLoading(false);
      }
    }

    loadWeatherImpact();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.stateText}>Loading weather impact...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Weather Impact</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Impact</Text>
      <Text style={styles.subtitle}>
        Aggregated weather-driven traffic metrics loaded from the Traffiq backend.
      </Text>

      <FlatList
        data={weatherData}
        keyExtractor={(item, index) =>
          `${item.metric_date}-${item.weather_label}-${index}`
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.weatherLabel}>{item.weather_label}</Text>
            <Text style={styles.cardText}>Date: {item.metric_date}</Text>
            <Text style={styles.cardText}>
              Avg speed: {item.avg_speed ?? 'N/A'} km/h
            </Text>
            <Text style={styles.cardText}>
              Avg congestion: {item.avg_congestion_score ?? 'N/A'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No weather impact data available.</Text>
          </View>
        }
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
  weatherLabel: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 14,
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
});
