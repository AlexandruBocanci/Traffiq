import { useEffect, useState } from 'react';
import {
  Modal,
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
import { useThemedStyles } from '../context/ThemeContext';
import { deleteRideHistory, getRidesHistory } from '../services/traffiqApi';
import { radius, shadows, spacing, ThemeColors } from '../theme/theme';
import { RideHistoryRecord } from '../types/api';

type HistoryScreenProps = {
  onBackToDrive: () => void;
  onOpenAccount: () => void;
};

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value}${suffix}`;
}

function formatTrafficValue(ride: RideHistoryRecord) {
  if (ride.traffic_data_source !== 'tomtom_snapshot') {
    return '—';
  }

  return formatValue(ride.congestion_score);
}

function formatRouteName(value: string) {
  return value.replace(/\s+to\s+/i, ' către ');
}

function formatRideStatus(status: string) {
  if (status === 'completed') {
    return 'Finalizată';
  }

  return status;
}

export default function HistoryScreen({
  onBackToDrive,
  onOpenAccount,
}: HistoryScreenProps) {
  const { styles } = useThemedStyles(createStyles);
  const { getAccessToken, isAuthenticated, isRestoringSession, session } = useAuth();
  const [rides, setRides] = useState<RideHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [deletingRideId, setDeletingRideId] = useState<number | null>(null);
  const [ridePendingDelete, setRidePendingDelete] = useState<RideHistoryRecord | null>(
    null
  );

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
          setErrorMessage('Sesiunea a expirat. Autentifică-te din nou.');
          return;
        }

        const response = await getRidesHistory(accessToken);
        setRides(response.data);
      } catch (error) {
        setErrorMessage('Istoricul curselor nu a putut fi încărcat.');
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [getAccessToken, isAuthenticated, session?.tokens.accessToken]);

  function requestDeleteRide(ride: RideHistoryRecord) {
    if (!session?.tokens.accessToken) {
      setActionErrorMessage('Sesiunea a expirat. Autentifică-te din nou.');
      return;
    }

    setRidePendingDelete(ride);
  }

  async function confirmDeleteRide() {
    if (!ridePendingDelete) {
      return;
    }

    try {
      setDeletingRideId(ridePendingDelete.ride_id);
      setActionErrorMessage('');

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setActionErrorMessage('Sesiunea a expirat. Autentifică-te din nou.');
        return;
      }

      await deleteRideHistory(ridePendingDelete.ride_id, accessToken);
      setRides((currentRides) =>
        currentRides.filter(
          (currentRide) => currentRide.ride_id !== ridePendingDelete.ride_id
        )
      );
      setRidePendingDelete(null);
    } catch {
      setActionErrorMessage('Cursa nu a putut fi ștearsă. Încearcă din nou.');
    } finally {
      setDeletingRideId(null);
    }
  }

  if (isRestoringSession) {
    return <LoadingState message="Se verifică sesiunea..." />;
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <Text style={styles.eyebrow}>Cont necesar</Text>
          <Text style={styles.title}>Istoric curse</Text>
          <Text style={styles.guestText}>
            Autentifică-te ca să vezi cursele salvate pe contul tău. Harta și
            informațiile publice despre trafic pot fi folosite și fără cont.
          </Text>

          <Pressable onPress={onOpenAccount} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Autentificare</Text>
          </Pressable>

          <Pressable onPress={onBackToDrive} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Continuă fără cont</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingState message="Se încarcă istoricul..." />;
  }

  if (errorMessage) {
    return (
      <ErrorState
        actionLabel="Înapoi acasă"
        message={errorMessage}
        onAction={onBackToDrive}
        title="Istoric"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Personal</Text>
            <Text style={styles.title}>Istoric curse</Text>
          </View>

          <Pressable onPress={onBackToDrive} style={styles.backButton}>
            <Text style={styles.backButtonText}>Acasă</Text>
          </Pressable>
        </View>

        {actionErrorMessage ? (
          <Text style={styles.errorText}>{actionErrorMessage}</Text>
        ) : null}

        {rides.length === 0 ? (
          <EmptyState
            actionLabel="Alege destinația"
            message="Pornește o cursă ca să apară aici."
            onAction={onBackToDrive}
            title="Nu ai curse salvate"
          />
        ) : (
          rides.map((ride) => (
            <View key={ride.ride_id} style={styles.rideCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.rideTitle}>{formatRouteName(ride.route_name)}</Text>
                <Text style={styles.statusBadge}>{formatRideStatus(ride.ride_status)}</Text>
              </View>
              <Text style={styles.routeText}>
                {ride.origin_name} către {ride.destination_name}
              </Text>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatValue(ride.estimated_duration_minutes, 'm')}
                  </Text>
                  <Text style={styles.metricLabel}>Durată</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatValue(ride.avg_speed, ' km/h')}
                  </Text>
                  <Text style={styles.metricLabel}>Viteză</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>
                    {formatTrafficValue(ride)}
                  </Text>
                  <Text style={styles.metricLabel}>Trafic</Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel={`Șterge cursa ${formatRouteName(ride.route_name)}`}
                disabled={deletingRideId === ride.ride_id}
                onPress={() => requestDeleteRide(ride)}
                style={[
                  styles.deleteRideButton,
                  deletingRideId === ride.ride_id && styles.actionDisabled,
                ]}
              >
                <Text style={styles.deleteRideButtonText}>
                  {deletingRideId === ride.ride_id ? 'Se șterge...' : 'Șterge cursa'}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={!!ridePendingDelete}
        onRequestClose={() => {
          if (deletingRideId === null) {
            setRidePendingDelete(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Închide confirmarea de ștergere"
            disabled={deletingRideId !== null}
            onPress={() => setRidePendingDelete(null)}
            style={styles.modalDismissArea}
          />
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogEyebrow}>Ștergere cursă</Text>
            <Text style={styles.deleteDialogTitle}>Elimini această cursă?</Text>
            <Text style={styles.deleteDialogText}>
              {ridePendingDelete
                ? `${formatRouteName(
                    ridePendingDelete.route_name
                  )} va fi ștearsă din istoricul tău.`
                : ''}
            </Text>

            <View style={styles.deleteDialogActions}>
              <Pressable
                disabled={deletingRideId !== null}
                onPress={() => setRidePendingDelete(null)}
                style={[
                  styles.cancelDialogButton,
                  deletingRideId !== null && styles.actionDisabled,
                ]}
              >
                <Text style={styles.cancelDialogButtonText}>Anulează</Text>
              </Pressable>
              <Pressable
                disabled={deletingRideId !== null}
                onPress={confirmDeleteRide}
                style={[
                  styles.confirmDeleteButton,
                  deletingRideId !== null && styles.actionDisabled,
                ]}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {deletingRideId !== null ? 'Se șterge...' : 'Șterge'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    paddingTop: spacing.screenTop,
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
    letterSpacing: 0,
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
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderColor: 'rgba(34, 197, 94, 0.44)',
    borderRadius: 999,
    borderWidth: 1,
    color: colors.accent,
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
  errorText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteRideButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.red,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  deleteRideButtonText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screenX,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  deleteDialog: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    width: '100%',
  },
  deleteDialogEyebrow: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  deleteDialogTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  deleteDialogText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  deleteDialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelDialogButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cancelDialogButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: colors.red,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  confirmDeleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionDisabled: {
    opacity: 0.55,
  },
  });
}
