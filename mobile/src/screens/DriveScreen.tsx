import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import SuceavaMap from '../components/SuceavaMap';
import { useAuth } from '../context/AuthContext';
import {
  addRideToHistory,
  getDriveOverview,
  previewRoute,
  saveRoute,
} from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';
import {
  MapEventRecord,
  RideHistoryRecord,
  RoutePreviewResponse,
  RouteReportRecord,
  TopCongestedStreetRecord,
  WeatherImpactRecord,
} from '../types/api';

type DriveScreenProps = {
  onOpenAccount: () => void;
  onOpenHistory: () => void;
  onOpenPipeline: () => void;
};

type DriveState = {
  routes: RouteReportRecord[];
  events: MapEventRecord[];
  rides: RideHistoryRecord[];
  congested: TopCongestedStreetRecord[];
  weather: WeatherImpactRecord[];
};

type PlannedRoute = {
  destination: string;
  origin: string;
};

type RouteOriginMode = 'current' | 'manual';

type CurrentRouteLocation = {
  latitude: number;
  longitude: number;
};

type RouteConditionTone = 'low' | 'moderate' | 'high';

type RouteConditionSummary = {
  alertContext: string;
  congestionContext: string;
  description: string;
  etaContext: string;
  label: string;
  tone: RouteConditionTone;
  weatherContext: string;
};

const SUCEAVA_DESTINATION_SUGGESTIONS = [
  'Iulius Mall Suceava',
  'Universitatea Stefan cel Mare',
  'Cetatea de Scaun',
  'Gara Suceava',
  'Centru',
];

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

function getConditionColor(tone: RouteConditionTone) {
  if (tone === 'high') {
    return colors.red;
  }

  if (tone === 'moderate') {
    return colors.amber;
  }

  return colors.accent;
}

function getRouteConditionTone(
  congestionScore: number | null | undefined,
  alerts: MapEventRecord[]
): RouteConditionTone {
  const hasHighAlert = alerts.some((event) => event.severity === 'high');
  const hasMediumAlert = alerts.some((event) => event.severity === 'medium');

  if (hasHighAlert || (congestionScore !== null && congestionScore !== undefined && congestionScore >= 70)) {
    return 'high';
  }

  if (
    hasMediumAlert ||
    (congestionScore !== null && congestionScore !== undefined && congestionScore >= 40)
  ) {
    return 'moderate';
  }

  return 'low';
}

function getConditionLabel(tone: RouteConditionTone) {
  if (tone === 'high') {
    return 'Heavy traffic expected';
  }

  if (tone === 'moderate') {
    return 'Moderate traffic';
  }

  return 'Light traffic';
}

function buildRouteConditionSummary(
  routePreview: RoutePreviewResponse | null,
  weatherImpact: WeatherImpactRecord | undefined,
  topCongestedSegment: TopCongestedStreetRecord | undefined,
  events: MapEventRecord[]
): RouteConditionSummary | null {
  if (!routePreview) {
    return null;
  }

  const congestionScore =
    topCongestedSegment?.congestion_score ?? weatherImpact?.avg_congestion_score ?? null;
  const cityAlerts = events.slice(0, 3);
  const tone = getRouteConditionTone(congestionScore, cityAlerts);
  const weatherLabel = weatherImpact?.weather_label ?? 'No weather signal';
  const congestedStreet = topCongestedSegment?.street_name ?? 'Suceava city network';

  const descriptions: Record<RouteConditionTone, string> = {
    high:
      'Expect a slower trip. The route estimate is combined with elevated Suceava congestion signals and mapped city alerts.',
    low:
      'No heavy Suceava congestion signal is shown for this preview. Use the ETA as the baseline estimate.',
    moderate:
      'Expect some delay around Suceava. The estimate combines route duration with current city congestion and weather context.',
  };

  return {
    alertContext: cityAlerts.length
      ? `${cityAlerts.length} mapped city alert${cityAlerts.length === 1 ? '' : 's'}`
      : 'No mapped alerts',
    congestionContext:
      congestionScore === null || congestionScore === undefined
        ? `${congestedStreet}: no score`
        : `${congestedStreet}: ${congestionScore}`,
    description: descriptions[tone],
    etaContext: `${formatValue(routePreview.duration_minutes, ' min')} ETA`,
    label: getConditionLabel(tone),
    tone,
    weatherContext: weatherLabel,
  };
}

export default function DriveScreen({
  onOpenAccount,
  onOpenHistory,
  onOpenPipeline,
}: DriveScreenProps) {
  const { isAuthenticated, session } = useAuth();
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
  const [routeOriginMode, setRouteOriginMode] = useState<RouteOriginMode>('current');
  const [manualRouteOrigin, setManualRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreviewResponse | null>(null);
  const [isRoutePreviewLoading, setIsRoutePreviewLoading] = useState(false);
  const [routePreviewError, setRoutePreviewError] = useState('');
  const [isAddingRideHistory, setIsAddingRideHistory] = useState(false);
  const [rideHistoryMessage, setRideHistoryMessage] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [savedRouteMessage, setSavedRouteMessage] = useState('');
  const [currentLocationMessage, setCurrentLocationMessage] = useState('');
  const [currentRouteLocation, setCurrentRouteLocation] =
    useState<CurrentRouteLocation | null>(null);

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

  async function getCurrentRouteLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentRouteLocation(location);

      return location;
    } catch {
      return null;
    }
  }

  async function handleSelectCurrentLocation() {
    setRouteOriginMode('current');
    setCurrentLocationMessage('');
    setRoutePreviewError('');

    const location = currentRouteLocation ?? (await getCurrentRouteLocation());

    if (!location) {
      setCurrentLocationMessage(
        'Aplicatia nu poate determina locatia curenta. Permite accesul la locatie sau introdu manual punctul de plecare.'
      );
      return;
    }

    setRouteOriginMode('current');
    setCurrentLocationMessage('Locatia curenta este disponibila.');
  }

  async function handlePreviewRoute() {
    const normalizedOrigin =
      routeOriginMode === 'current' ? 'Current location' : manualRouteOrigin.trim();
    const normalizedDestination = routeDestination.trim();

    if (!normalizedDestination) {
      return;
    }

    if (routeOriginMode === 'manual' && !normalizedOrigin) {
      setRoutePreviewError('Introdu punctul de plecare sau alege locatia curenta.');
      return;
    }

    try {
      setIsRoutePreviewLoading(true);
      setRoutePreviewError('');

      const liveOrigin = routeOriginMode === 'current'
        ? currentRouteLocation ?? (await getCurrentRouteLocation())
        : null;

      if (routeOriginMode === 'current' && !liveOrigin) {
        setCurrentLocationMessage(
          'Aplicatia nu poate determina locatia curenta. Introdu manual punctul de plecare.'
        );
        setIsRoutePreviewLoading(false);
        return;
      }

      const preview = await previewRoute(normalizedOrigin, normalizedDestination, {
        originLatitude: liveOrigin?.latitude,
        originLongitude: liveOrigin?.longitude,
      });

      setPlannedRoute({
        destination: preview.destination.name,
        origin: preview.origin.name,
      });
      setRoutePreview(preview);
      setSavedRouteMessage('');
      setRideHistoryMessage('');
      setIsRouteSheetVisible(false);
    } catch {
      setRoutePreview(null);
      setRoutePreviewError(
        'Could not calculate this Suceava route. Choose one of the supported suggestions.'
      );
    } finally {
      setIsRoutePreviewLoading(false);
    }
  }

  async function handleSaveRoute() {
    if (!routePreview) {
      return;
    }

    if (!isAuthenticated || !session?.tokens.accessToken) {
      onOpenAccount();
      return;
    }

    try {
      setIsSavingRoute(true);
      setSavedRouteMessage('');
      await saveRoute(routePreview, session.tokens.accessToken);
      setSavedRouteMessage('Route saved to your account.');
    } catch {
      setSavedRouteMessage('Could not save this route. Try again.');
    } finally {
      setIsSavingRoute(false);
    }
  }

  async function handleAddRideHistory() {
    if (!routePreview) {
      return;
    }

    if (!isAuthenticated || !session?.tokens.accessToken) {
      onOpenAccount();
      return;
    }

    try {
      setIsAddingRideHistory(true);
      setRideHistoryMessage('');
      await addRideToHistory(
        routePreview,
        session.tokens.accessToken,
        topCongestedSegment?.congestion_score ?? weatherImpact?.avg_congestion_score
      );
      setRideHistoryMessage('Ride added to your personal history.');
    } catch {
      setRideHistoryMessage('Could not add this ride to history. Try again.');
    } finally {
      setIsAddingRideHistory(false);
    }
  }

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
  const routeCondition = buildRouteConditionSummary(
    routePreview,
    weatherImpact,
    topCongestedSegment,
    data.events
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Traffiq</Text>
            <Text style={styles.title}>Where are you going?</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Open account"
              onPress={onOpenAccount}
              style={styles.accountButton}
            >
              <Text style={styles.accountButtonText}>A</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Open ride history"
              onPress={onOpenHistory}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>H</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Open pipeline status"
              onPress={onOpenPipeline}
              style={styles.settingsButton}
            >
              <View style={styles.settingsLine} />
              <View style={styles.settingsLineShort} />
            </Pressable>
          </View>
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
            <Text style={styles.destinationText}>
              {plannedRoute ? plannedRoute.destination : 'Where to?'}
            </Text>
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

        <SuceavaMap
          congestionLabel={topCongestedSegment?.street_name ?? 'City network'}
          congestionScore={formatValue(topCongestedSegment?.congestion_score)}
          events={data.events}
          routePreview={routePreview}
        />

        {plannedRoute ? (
          <View style={styles.routeDraftCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.routeDraftTextWrap}>
                <Text style={styles.routeDraftLabel}>Route preview ready</Text>
                <Text style={styles.routeDraftTitle}>
                  {plannedRoute.origin} to {plannedRoute.destination}
                </Text>
              </View>
              <View style={styles.routeDraftActions}>
                <Pressable
                  accessibilityLabel="Save planned route"
                  disabled={!routePreview || isSavingRoute}
                  onPress={handleSaveRoute}
                  style={[
                    styles.routeDraftSaveButton,
                    (!routePreview || isSavingRoute) && styles.routeDraftButtonDisabled,
                  ]}
                >
                  <Text style={styles.routeDraftSaveText}>
                    {isSavingRoute ? 'Saving' : isAuthenticated ? 'Save' : 'Sign in'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Add planned route to ride history"
                  disabled={!routePreview || isAddingRideHistory}
                  onPress={handleAddRideHistory}
                  style={[
                    styles.routeDraftSecondaryButton,
                    (!routePreview || isAddingRideHistory) && styles.routeDraftButtonDisabled,
                  ]}
                >
                  <Text style={styles.routeDraftSecondaryText}>
                    {isAddingRideHistory ? 'Adding' : 'History'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Edit planned route"
                  onPress={() => setIsRouteSheetVisible(true)}
                  style={styles.routeDraftEditButton}
                >
                  <Text style={styles.routeDraftEditText}>Edit</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.cardText}>
              {routePreview
                ? `${formatValue(routePreview.duration_minutes, ' min')} ETA · ${formatValue(
                    routePreview.distance_km,
                    ' km'
                  )} · ${routePreview.provider}`
                : 'Route calculation is waiting for a provider response.'}
            </Text>

            {routePreview ? (
              <View style={styles.routeSummaryGrid}>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>From</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.origin.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>To</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.destination.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Distance</Text>
                  <Text style={styles.routeSummaryValue}>
                    {formatValue(routePreview.distance_km, ' km')}
                  </Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>ETA</Text>
                  <Text style={styles.routeSummaryValue}>
                    {formatValue(routePreview.duration_minutes, ' min')}
                  </Text>
                </View>
              </View>
            ) : null}

            {savedRouteMessage ? (
              <Text
                style={[
                  styles.savedRouteMessage,
                  savedRouteMessage.startsWith('Could not') && styles.savedRouteMessageError,
                ]}
              >
                {savedRouteMessage}
              </Text>
            ) : null}

            {rideHistoryMessage ? (
              <Text
                style={[
                  styles.savedRouteMessage,
                  rideHistoryMessage.startsWith('Could not') &&
                    styles.savedRouteMessageError,
                ]}
              >
                {rideHistoryMessage}
              </Text>
            ) : null}

            {routeCondition ? (
              <View style={styles.conditionPanel}>
                <View style={styles.conditionHeader}>
                  <View
                    style={[
                      styles.conditionIndicator,
                      { backgroundColor: getConditionColor(routeCondition.tone) },
                    ]}
                  />
                  <View style={styles.conditionTitleWrap}>
                    <Text style={styles.conditionLabel}>Route condition</Text>
                    <Text style={styles.conditionTitle}>{routeCondition.label}</Text>
                  </View>
                </View>

                <Text style={styles.conditionDescription}>{routeCondition.description}</Text>

                <View style={styles.conditionMetrics}>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>ETA</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.etaContext}</Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Weather</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.weatherContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Congestion</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.congestionContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Alerts</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.alertContext}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

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
          onPress={onOpenHistory}
          style={styles.recentRideCard}
        >
          <View>
            <Text style={styles.recentRideLabel}>Recent ride</Text>
            <Text style={styles.recentRideTitle}>{recentRide?.route_name ?? 'Ride history'}</Text>
            <Text style={styles.recentRideText}>
              {recentRide
                ? `${formatValue(recentRide.estimated_duration_minutes, ' min')} · ${formatValue(
                    recentRide.congestion_score
                  )} traffic`
                : 'Sign in to view personal rides'}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetBackdrop}
        >
          <Pressable
            accessibilityLabel="Close route planner"
            onPress={() => setIsRouteSheetVisible(false)}
            style={styles.sheetDismissArea}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Where to?</Text>

            <Text style={styles.sheetText}>
              Choose a Suceava destination. Current location uses your phone GPS when
              permission is granted.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>From</Text>
              <View style={styles.originChoiceRow}>
                <Pressable
                  onPress={handleSelectCurrentLocation}
                  style={[
                    styles.originChoiceButton,
                    routeOriginMode === 'current' && styles.originChoiceButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.originChoiceTitle,
                      routeOriginMode === 'current' && styles.originChoiceTitleActive,
                    ]}
                  >
                    Current location
                  </Text>
                  <Text
                    style={[
                      styles.originChoiceText,
                      routeOriginMode === 'current' && styles.originChoiceTextActive,
                    ]}
                  >
                    Phone GPS
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setRouteOriginMode('manual');
                    setCurrentLocationMessage('');
                  }}
                  style={[
                    styles.originChoiceButton,
                    routeOriginMode === 'manual' && styles.originChoiceButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.originChoiceTitle,
                      routeOriginMode === 'manual' && styles.originChoiceTitleActive,
                    ]}
                  >
                    Type location
                  </Text>
                  <Text
                    style={[
                      styles.originChoiceText,
                      routeOriginMode === 'manual' && styles.originChoiceTextActive,
                    ]}
                  >
                    Supported places
                  </Text>
                </Pressable>
              </View>

              {routeOriginMode === 'manual' ? (
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setManualRouteOrigin}
                  placeholder="Example: Centru"
                  placeholderTextColor={colors.textMuted}
                  style={styles.routeInput}
                  value={manualRouteOrigin}
                />
              ) : null}

              {currentLocationMessage ? (
                <Text
                  style={[
                    styles.locationMessage,
                    currentRouteLocation && routeOriginMode === 'current'
                      ? styles.locationMessageSuccess
                      : styles.locationMessageError,
                  ]}
                >
                  {currentLocationMessage}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To</Text>
              <TextInput
                autoCapitalize="words"
                autoFocus
                onChangeText={setRouteDestination}
                placeholder="Search destination in Suceava"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.routeInput}
                value={routeDestination}
              />
            </View>

            <View style={styles.suggestionSection}>
              <Text style={styles.inputLabel}>Populare in Suceava</Text>
              <View style={styles.suggestionGrid}>
                {SUCEAVA_DESTINATION_SUGGESTIONS.map((destination) => (
                  <Pressable
                    key={destination}
                    onPress={() => setRouteDestination(destination)}
                    style={[
                      styles.suggestionChip,
                      routeDestination === destination && styles.suggestionChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        routeDestination === destination && styles.suggestionChipTextActive,
                      ]}
                    >
                      {destination}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              disabled={!routeDestination.trim() || isRoutePreviewLoading}
              onPress={handlePreviewRoute}
              style={[
                styles.previewRouteButton,
                (!routeDestination.trim() || isRoutePreviewLoading) &&
                  styles.previewRouteButtonDisabled,
              ]}
            >
              <Text style={styles.previewRouteButtonText}>
                {isRoutePreviewLoading ? 'Calculating route...' : 'Preview route'}
              </Text>
            </Pressable>

            {routePreviewError ? (
              <Text style={styles.routePreviewError}>{routePreviewError}</Text>
            ) : null}

            {data.routes.slice(0, 3).map((route) => (
              <Pressable
                key={route.route_id}
                onPress={() => {
                  setRouteOriginMode('manual');
                  setManualRouteOrigin(route.origin_name);
                  setCurrentLocationMessage('');
                  setRouteDestination(route.destination_name);
                }}
                style={styles.sheetRouteRow}
              >
                <Text style={styles.sheetRouteName}>{route.route_name}</Text>
                <Text style={styles.sheetRouteMeta}>
                  {formatValue(route.estimated_duration_minutes, 'm')} · {route.congestion_level}
                </Text>
              </Pressable>
            ))}
          </View>
        </KeyboardAvoidingView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
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
    gap: 5,
    width: 46,
  },
  accountButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  accountButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
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
  routeDraftCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  routeDraftTextWrap: {
    flex: 1,
  },
  routeDraftActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  routeDraftLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeDraftTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 4,
  },
  routeDraftEditButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  routeDraftSaveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  routeDraftSecondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  routeDraftButtonDisabled: {
    opacity: 0.5,
  },
  routeDraftEditText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeDraftSaveText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeDraftSecondaryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  savedRouteMessage: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  savedRouteMessageError: {
    color: colors.red,
  },
  routeSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  routeSummaryItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 66,
    padding: 12,
  },
  routeSummaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeSummaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 5,
  },
  conditionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
    padding: 14,
  },
  conditionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  conditionIndicator: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  conditionTitleWrap: {
    flex: 1,
  },
  conditionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  conditionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  conditionDescription: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  conditionMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionMetric: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 62,
    padding: 10,
  },
  conditionMetricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  conditionMetricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 5,
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
  sheetDismissArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: -1,
    maxHeight: '88%',
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
  inputGroup: {
    gap: 7,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  routeInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  originChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  originChoiceButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 64,
    padding: 12,
  },
  originChoiceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  originChoiceTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  originChoiceTitleActive: {
    color: colors.primaryText,
  },
  originChoiceText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  originChoiceTextActive: {
    color: colors.primaryText,
  },
  locationMessage: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  locationMessageError: {
    color: colors.red,
  },
  locationMessageSuccess: {
    color: colors.accent,
  },
  suggestionSection: {
    gap: 8,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  suggestionChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  suggestionChipTextActive: {
    color: colors.primaryText,
  },
  previewRouteButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
  },
  previewRouteButtonDisabled: {
    opacity: 0.45,
  },
  previewRouteButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routePreviewError: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
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

