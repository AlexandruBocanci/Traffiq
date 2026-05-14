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
import { getDriveOverview } from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';
import {
  MapEventRecord,
  RideHistoryRecord,
  RouteReportRecord,
  TopCongestedStreetRecord,
  WeatherImpactRecord,
} from '../types/api';

type DriveScreenProps = {
  onOpenPipeline: () => void;
};

type DriveState = {
  routes: RouteReportRecord[];
  events: MapEventRecord[];
  rides: RideHistoryRecord[];
  congested: TopCongestedStreetRecord[];
  weather: WeatherImpactRecord[];
};

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  return `${value}${suffix}`;
}

function getSeverityColor(severity: string) {
  if (severity === 'high') {
    return colors.red;
  }

  if (severity === 'medium') {
    return colors.amber;
  }

  return colors.accent;
}

export default function DriveScreen({ onOpenPipeline }: DriveScreenProps) {
  const [data, setData] = useState<DriveState>({
    routes: [],
    events: [],
    rides: [],
    congested: [],
    weather: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRouteSheetVisible, setIsRouteSheetVisible] = useState(false);
  const [isRideSheetVisible, setIsRideSheetVisible] = useState(false);

  useEffect(() => {
    async function loadDriveData() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const driveOverview = await getDriveOverview();

        setData(driveOverview);
      } catch (error) {
        setErrorMessage('Could not connect to the Traffiq backend from the mobile app.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDriveData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading Traffiq mobility data..." />;
  }

  if (errorMessage) {
    return <ErrorState title="Drive" message={errorMessage} />;
  }

  const primaryRoute = data.routes[0];
  const primaryEvent = data.events[0];
  const topCongestedSegment = data.congested[0];
  const weatherImpact = data.weather[0];
  const recentRide = data.rides[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Traffiq</Text>
            <Text style={styles.title}>Where are you going?</Text>
          </View>

          <Pressable
            accessibilityLabel="Open pipeline status"
            onPress={onOpenPipeline}
            style={styles.settingsButton}
          >
            <View style={styles.settingsLine} />
            <View style={styles.settingsLineShort} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setIsRouteSheetVisible(true)}
          style={styles.destinationButton}
        >
          <View style={styles.searchIcon}>
            <View style={styles.searchDot} />
          </View>
          <View style={styles.destinationTextWrap}>
            <Text style={styles.destinationLabel}>Plan a route</Text>
            <Text style={styles.destinationText}>Where to?</Text>
          </View>
          <Text style={styles.destinationArrow}>›</Text>
        </Pressable>

        <View style={styles.weatherStrip}>
          <View>
            <Text style={styles.weatherLabel}>Weather impact</Text>
            <Text style={styles.weatherTitle}>{weatherImpact?.weather_label ?? 'No data'}</Text>
          </View>
          <View style={styles.weatherMetric}>
            <Text style={styles.weatherMetricValue}>
              {formatValue(weatherImpact?.avg_congestion_score)}
            </Text>
            <Text style={styles.weatherMetricLabel}>congestion</Text>
          </View>
        </View>

        <View style={styles.mapPanel}>
          <View style={styles.waterAreaLeft} />
          <View style={styles.waterAreaRight} />
          <View style={styles.parkArea} />
          <View style={[styles.mapStreet, styles.streetOne]} />
          <View style={[styles.mapStreet, styles.streetTwo]} />
          <View style={[styles.mapStreet, styles.streetThree]} />
          <View style={[styles.mapStreet, styles.streetFour]} />
          <View style={[styles.mapStreet, styles.streetFive]} />
          <View style={[styles.avenue, styles.avenueOne]} />
          <View style={[styles.avenue, styles.avenueTwo]} />
          <View style={[styles.avenue, styles.avenueThree]} />
          <View style={styles.highwayBadge}>
            <Text style={styles.highwayBadgeText}>H</Text>
          </View>
          <View style={styles.highwayBadgeBottom}>
            <Text style={styles.highwayBadgeText}>H</Text>
          </View>
          <View style={styles.routeLineShadow} />
          <View style={styles.routeLine} />
          <View style={[styles.mapPin, styles.mapPinStart]} />
          <View style={[styles.mapPin, styles.mapPinEnd]} />
          <View style={styles.destinationFlag}>
            <Text style={styles.destinationFlagText}>◆</Text>
          </View>
          <View style={styles.mapOverlay}>
            <Text style={styles.mapLabel}>Traffic layer</Text>
            <Text style={styles.mapTitle}>
              {topCongestedSegment?.street_name ?? 'City network'}
            </Text>
            <Text style={styles.mapText}>
              Congestion score {formatValue(topCongestedSegment?.congestion_score)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended route</Text>
            <Text style={styles.sectionAction}>Live model</Text>
          </View>

          {!primaryRoute ? (
            <EmptyState message="No route recommendation available." />
          ) : (
            <View style={styles.recommendationCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.recommendationTitle}>{primaryRoute.route_name}</Text>
                <Text style={styles.levelBadge}>{primaryRoute.congestion_level ?? 'unknown'}</Text>
              </View>
              <Text style={styles.cardText}>
                {primaryRoute.origin_name} to {primaryRoute.destination_name}
              </Text>

              <View style={styles.tripStats}>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {formatValue(primaryRoute.estimated_duration_minutes, 'm')}
                  </Text>
                  <Text style={styles.tripLabel}>ETA</Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {formatValue(primaryRoute.avg_speed, ' km/h')}
                  </Text>
                  <Text style={styles.tripLabel}>Speed</Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {formatValue(primaryRoute.avg_congestion_score)}
                  </Text>
                  <Text style={styles.tripLabel}>Traffic</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Traffic alerts</Text>
            <Text style={styles.sectionAction}>Events</Text>
          </View>

          {!primaryEvent ? (
            <EmptyState message="No traffic alerts available." />
          ) : (
            data.events.slice(0, 3).map((event) => (
              <View key={event.event_id} style={styles.alertCard}>
                <View
                  style={[
                    styles.alertIndicator,
                    { backgroundColor: getSeverityColor(event.severity) },
                  ]}
                />
                <View style={styles.alertContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.alertTitle}>{event.street_name}</Text>
                    <Text style={styles.alertSeverity}>{event.severity}</Text>
                  </View>
                  <Text style={styles.alertType}>{event.event_type}</Text>
                  <Text style={styles.cardText}>{event.event_description}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={() => setIsRideSheetVisible(true)}
          style={styles.recentRideCard}
        >
          <View>
            <Text style={styles.recentRideLabel}>Recent ride</Text>
            <Text style={styles.recentRideTitle}>{recentRide?.route_name ?? 'No ride history'}</Text>
            <Text style={styles.recentRideText}>
              {recentRide
                ? `${formatValue(recentRide.estimated_duration_minutes, ' min')} · ${formatValue(
                    recentRide.congestion_score
                  )} traffic`
                : 'Tap to view last rides'}
            </Text>
          </View>
          <Text style={styles.recentRideArrow}>›</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isRouteSheetVisible}
        onRequestClose={() => setIsRouteSheetVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setIsRouteSheetVisible(false)}
        >
          <Pressable style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Where to?</Text>

            {data.routes.slice(0, 5).map((route) => (
              <View key={route.route_id} style={styles.sheetRouteRow}>
                <Text style={styles.sheetRouteName}>{route.route_name}</Text>
                <Text style={styles.sheetRouteMeta}>
                  {formatValue(route.estimated_duration_minutes, 'm')} · {route.congestion_level}
                </Text>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isRideSheetVisible}
        onRequestClose={() => setIsRideSheetVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setIsRideSheetVisible(false)}
        >
          <Pressable style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Last 5 rides</Text>

            {data.rides.slice(0, 5).map((ride) => (
              <View key={ride.ride_id} style={styles.sheetRouteRow}>
                <Text style={styles.sheetRouteName}>{ride.route_name}</Text>
                <Text style={styles.sheetRouteMeta}>
                  {formatValue(ride.estimated_duration_minutes, ' min')} ·{' '}
                  {formatValue(ride.congestion_score)} traffic
                </Text>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  header: {
    alignItems: 'flex-start',
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
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginTop: 2,
    gap: 5,
    width: 46,
  },
  settingsLine: {
    backgroundColor: colors.text,
    borderRadius: 999,
    height: 2,
    width: 18,
  },
  settingsLineShort: {
    backgroundColor: colors.textMuted,
    borderRadius: 999,
    height: 2,
    width: 12,
  },
  destinationButton: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  searchIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  searchDot: {
    backgroundColor: colors.primaryText,
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  destinationTextWrap: {
    flex: 1,
  },
  destinationLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  destinationText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  destinationArrow: {
    color: colors.textMuted,
    fontSize: 30,
    fontWeight: '300',
  },
  weatherStrip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  weatherLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weatherTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
    textTransform: 'capitalize',
  },
  weatherMetric: {
    alignItems: 'flex-end',
  },
  weatherMetricValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  weatherMetricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mapPanel: {
    ...shadows.card,
    backgroundColor: '#E8EFE7',
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 250,
    overflow: 'hidden',
  },
  waterAreaLeft: {
    backgroundColor: '#B9D9D8',
    borderRadius: 44,
    height: 310,
    left: -78,
    position: 'absolute',
    top: -24,
    transform: [{ rotate: '-8deg' }],
    width: 98,
  },
  waterAreaRight: {
    backgroundColor: '#B9D9D8',
    borderRadius: 54,
    height: 290,
    position: 'absolute',
    right: -72,
    top: -20,
    transform: [{ rotate: '7deg' }],
    width: 100,
  },
  parkArea: {
    backgroundColor: '#B8D9A9',
    borderRadius: 18,
    height: 118,
    position: 'absolute',
    right: 52,
    top: 46,
    transform: [{ rotate: '-8deg' }],
    width: 70,
  },
  mapStreet: {
    backgroundColor: '#F9FBF7',
    borderColor: '#C8D0C5',
    borderWidth: 1,
    height: 8,
    position: 'absolute',
  },
  streetOne: {
    left: 8,
    top: 52,
    transform: [{ rotate: '-14deg' }],
    width: '112%',
  },
  streetTwo: {
    left: 2,
    top: 88,
    transform: [{ rotate: '-14deg' }],
    width: '116%',
  },
  streetThree: {
    left: -10,
    top: 126,
    transform: [{ rotate: '-14deg' }],
    width: '122%',
  },
  streetFour: {
    left: -18,
    top: 165,
    transform: [{ rotate: '-14deg' }],
    width: '124%',
  },
  streetFive: {
    left: -24,
    top: 204,
    transform: [{ rotate: '-14deg' }],
    width: '128%',
  },
  avenue: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8D0C5',
    borderWidth: 1,
    height: 290,
    position: 'absolute',
    top: -22,
    width: 9,
  },
  avenueOne: {
    left: 76,
    transform: [{ rotate: '19deg' }],
  },
  avenueTwo: {
    left: 142,
    transform: [{ rotate: '19deg' }],
  },
  avenueThree: {
    left: 205,
    transform: [{ rotate: '19deg' }],
  },
  highwayBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#7C8A7A',
    borderRadius: 5,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    left: 138,
    position: 'absolute',
    top: 24,
    width: 22,
  },
  highwayBadgeBottom: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#7C8A7A',
    borderRadius: 5,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    left: 91,
    position: 'absolute',
    top: 171,
    width: 22,
  },
  highwayBadgeText: {
    color: '#2F3A2F',
    fontSize: 10,
    fontWeight: '900',
  },
  routeLineShadow: {
    backgroundColor: 'rgba(88, 28, 135, 0.18)',
    borderRadius: 999,
    height: 142,
    left: 126,
    position: 'absolute',
    top: 42,
    transform: [{ rotate: '19deg' }],
    width: 15,
  },
  routeLine: {
    backgroundColor: '#6D28D9',
    borderRadius: 999,
    height: 138,
    left: 130,
    position: 'absolute',
    top: 44,
    transform: [{ rotate: '19deg' }],
    width: 8,
  },
  mapPin: {
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 3,
    height: 20,
    position: 'absolute',
    width: 20,
  },
  mapPinStart: {
    backgroundColor: '#06B6D4',
    left: 106,
    top: 180,
  },
  mapPinEnd: {
    backgroundColor: '#6D28D9',
    left: 148,
    top: 39,
  },
  destinationFlag: {
    left: 165,
    position: 'absolute',
    top: 23,
  },
  destinationFlagText: {
    color: '#111827',
    fontSize: 20,
  },
  mapOverlay: {
    backgroundColor: 'rgba(9, 11, 10, 0.82)',
    borderColor: 'rgba(248, 250, 248, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: 14,
    left: 14,
    padding: 12,
    position: 'absolute',
    right: 14,
  },
  mapLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mapTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  mapText: {
    color: colors.textSoft,
    fontSize: 14,
    marginTop: 3,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recommendationCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  cardTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  recommendationTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
  },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  tripStat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  tripValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  tripLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  alertCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  alertIndicator: {
    borderRadius: 999,
    width: 5,
  },
  alertContent: {
    flex: 1,
    gap: 5,
  },
  alertTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  alertSeverity: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  alertType: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  recentRideCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  recentRideLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recentRideTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },
  recentRideText: {
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 4,
  },
  recentRideArrow: {
    color: colors.textMuted,
    fontSize: 32,
    fontWeight: '300',
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: -1,
    padding: 20,
    paddingBottom: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    width: 44,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  sheetText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  sheetRouteRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
  },
  sheetRouteName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  sheetRouteMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 5,
    textTransform: 'capitalize',
  },
});

