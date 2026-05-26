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
import { useAuth } from '../context/AuthContext';
import { getRidesHistory } from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';
import { RideHistoryRecord } from '../types/api';

type HistoryScreenProps = {
  onBackToDrive: () => void;
  onOpenAccount: () => void;
};

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return `${value}${suffix}`;
}

export default function HistoryScreen({
  onBackToDrive,
  onOpenAccount,
}: HistoryScreenProps) {
  const { getAccessToken, isAuthenticated, isRestoringSession, session } = useAuth();
  const [rides, setRides] = useState<RideHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadHistory() {
      if (!isAuthenticated || !session?.tokens.accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');

        const accessToken = await getAccessToken();

        if (!accessToken) {
          setErrorMessage('Your session expired. Please sign in again.');
          return;
        }

        const response = await getRidesHistory(accessToken);
        setRides(response.data);
      } catch (error) {
        setErrorMessage('Could not load personal ride history.');
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [isAuthenticated, session?.tokens.accessToken]);

  if (isRestoringSession) {
    return <LoadingState message="Checking account session..." />;
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <Text style={styles.eyebrow}>Personal feature</Text>
          <Text style={styles.title}>Ride history</Text>
          <Text style={styles.guestText}>
            Sign in to view personal ride history. Public traffic data remains available
            without an account.
          </Text>

          <Pressable onPress={onOpenAccount} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>

          <Pressable onPress={onBackToDrive} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Continue as guest</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading ride history..." />;
  }

  if (errorMessage) {
    return (
      <ErrorState
        actionLabel="Back to Drive"
        message={errorMessage}
        onAction={onBackToDrive}
        title="History"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Personal</Text>
            <Text style={styles.title}>Ride history</Text>
          </View>

          <Pressable onPress={onBackToDrive} style={styles.backButton}>
            <Text style={styles.backButtonText}>Drive</Text>
          </Pressable>
        </View>

        {rides.length === 0 ? (
          <EmptyState
            actionLabel="Plan a route"
            message="Preview a route from Drive, then add it to your personal history."
            onAction={onBackToDrive}
            title="No rides recorded yet"
          />
        ) : (
          rides.map((ride) => (
            <View key={ride.ride_id} style={styles.rideCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.rideTitle}>{ride.route_name}</Text>
                <Text style={styles.statusBadge}>{ride.ride_status}</Text>
              </View>
              <Text style={styles.routeText}>
                {ride.origin_name} to {ride.destination_name}
              </Text>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatValue(ride.estimated_duration_minutes, 'm')}
                  </Text>
                  <Text style={styles.metricLabel}>ETA</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatValue(ride.avg_speed, ' km/h')}
                  </Text>
                  <Text style={styles.metricLabel}>Speed</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatValue(ride.congestion_score)}
                  </Text>
                  <Text style={styles.metricLabel}>Traffic</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
    gap: 18,
  },
  guestContainer: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: spacing.screenX,
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
  guestText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryActionText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
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
  rideCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  cardTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rideTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  routeText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
