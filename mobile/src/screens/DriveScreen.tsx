import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppState,
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
import TrafficProfileChart from '../components/TrafficProfileChart';
import type { SavedRouteUseRequest } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { searchSuceavaLocations } from '../data/suceavaLocations';
import {
  addRideToHistory,
  getDriveOverview,
  getTrafficProfile,
  getUserPreferences,
  previewRoute,
  requestMobilityRefresh,
  saveRoute,
} from '../services/traffiqApi';
import {
  getCachedDriveOverview,
  getCachedRoutePreview,
  saveCachedDriveOverview,
  saveCachedRoutePreview,
} from '../services/mobileCache';
import { radius, shadows, spacing, ThemeColors } from '../theme/theme';
import {
  DistanceUnit,
  MapEventRecord,
  RideHistoryRecord,
  RoutePreviewResponse,
  RouteReportRecord,
  TrafficProfileResponse,
  TopCongestedStreetRecord,
  WeatherImpactRecord,
} from '../types/api';

type DriveScreenProps = {
  onOpenAccount: () => void;
  onOpenHistory: () => void;
  savedRouteUseRequest?: SavedRouteUseRequest | null;
};

type DriveState = {
  routes: RouteReportRecord[];
  events: MapEventRecord[];
  rides: RideHistoryRecord[];
  congested: TopCongestedStreetRecord[];
  weather: WeatherImpactRecord[];
  trafficSource: 'tomtom';
  trafficScope: string;
  trafficObservedAt: string | null;
};

type PlannedRoute = {
  destination: string;
  origin: string;
};

type RouteOriginMode = 'current' | 'manual';

type CurrentRouteLocation = {
  headingDegrees?: number | null;
  latitude: number;
  longitude: number;
};

type DriveGpsStatus = 'inactive' | 'starting' | 'tracking' | 'denied' | 'unavailable';

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

type WeatherImpactPresentation = {
  emoji: string;
  label: string;
  scoreLabel: string;
  scoreTone: string;
  userText: string;
};

type CityTrafficSummary = {
  averageFreeFlowSpeed: number | null;
  averageScore: number | null;
  averageSpeed: number | null;
  label: string;
  monitoredCorridors: number;
  tone: RouteConditionTone;
};

const MOBILITY_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function formatValue(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value}${suffix}`;
}

function getSeverityColor(severity: string, colors: ThemeColors) {
  if (severity === 'high') {
    return colors.red;
  }

  if (severity === 'medium') {
    return colors.amber;
  }

  return colors.accent;
}

function formatDistance(valueKm: number | null | undefined, unit: DistanceUnit) {
  if (valueKm === null || valueKm === undefined) {
    return '—';
  }

  if (unit === 'mi') {
    return `${Math.round(valueKm * 0.621371 * 100) / 100} mi`;
  }

  return `${valueKm} km`;
}

function formatRideTraffic(ride: RideHistoryRecord) {
  return ride.traffic_data_source === 'tomtom_snapshot'
    ? `${formatValue(ride.congestion_score)} trafic`
    : 'trafic neverificat';
}

function formatRouteName(value: string) {
  return value.replace(/\s+to\s+/i, ' către ');
}

function formatTrafficAlertDescription(description: string) {
  const normalized = description.trim().toLowerCase();

  if (normalized.includes('stationary traffic')) {
    return 'Trafic blocat sau foarte lent pe acest segment.';
  }

  if (normalized.includes('slow traffic')) {
    return 'Trafic lent pe acest segment.';
  }

  if (normalized.includes('queuing traffic')) {
    return 'Coloană de mașini în zonă.';
  }

  return description;
}

function formatTrafficAlertType(type: string) {
  const normalized = type.trim().toLowerCase();

  if (normalized.includes('stationary')) {
    return 'Trafic blocat';
  }

  if (normalized.includes('slow')) {
    return 'Trafic lent';
  }

  if (normalized.includes('queuing')) {
    return 'Coloană';
  }

  if (normalized.includes('accident')) {
    return 'Accident';
  }

  return type;
}

function formatLocationCategory(category: string) {
  const labels: Record<string, string> = {
    Area: 'Zonă',
    Education: 'Educație',
    Healthcare: 'Sănătate',
    Institution: 'Instituție',
    Landmark: 'Reper',
    Leisure: 'Timp liber',
    Park: 'Parc',
    Shopping: 'Cumpărături',
    Sport: 'Sport',
    Street: 'Stradă',
    Transport: 'Transport',
  };

  return labels[category] ?? category;
}

function formatCacheTimestamp(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

function roundValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return Math.round(value).toString();
}

function formatWeatherLabel(weatherLabel: string | null | undefined) {
  const normalized = weatherLabel?.toLowerCase() ?? '';

  if (normalized.includes('rain')) {
    return 'Ploaie';
  }

  if (normalized.includes('snow')) {
    return 'Ninsoare';
  }

  if (normalized.includes('fog')) {
    return 'Ceață';
  }

  if (normalized.includes('cloud')) {
    return 'Înnorat';
  }

  if (normalized.includes('clear')) {
    return 'Senin';
  }

  return weatherLabel ?? 'Fără date meteo';
}

function getWeatherEmoji(weatherLabel: string | null | undefined) {
  const normalized = weatherLabel?.toLowerCase() ?? '';

  if (normalized.includes('rain')) {
    return '🌧️';
  }

  if (normalized.includes('snow')) {
    return '❄️';
  }

  if (normalized.includes('fog')) {
    return '🌫️';
  }

  if (normalized.includes('cloud')) {
    return '☁️';
  }

  if (normalized.includes('clear')) {
    return '☀️';
  }

  return '🌤️';
}

function getWeatherImpactPresentation(
  weatherImpact: WeatherImpactRecord | undefined
): WeatherImpactPresentation {
  const weatherLabel = formatWeatherLabel(weatherImpact?.weather_label);
  const score = weatherImpact?.avg_congestion_score;
  const roundedScore = roundValue(score);

  if (score === null || score === undefined) {
    return {
      emoji: getWeatherEmoji(weatherLabel),
      label: weatherLabel,
      scoreLabel: 'Indisponibil',
      scoreTone: 'Fără estimare',
      userText: 'Nu avem încă suficiente date meteo pentru o estimare sigură.',
    };
  }

  if (score >= 70) {
    return {
      emoji: getWeatherEmoji(weatherLabel),
      label: weatherLabel,
      scoreLabel: `${roundedScore}/100`,
      scoreTone: 'Atenție sporită',
      userText: 'Condițiile pot încetini deplasarea prin oraș.',
    };
  }

  if (score >= 40) {
    return {
      emoji: getWeatherEmoji(weatherLabel),
      label: weatherLabel,
      scoreLabel: `${roundedScore}/100`,
      scoreTone: 'Posibile întârzieri',
      userText: 'Pe zonele aglomerate pot apărea întârzieri scurte.',
    };
  }

  return {
    emoji: getWeatherEmoji(weatherLabel),
    label: weatherLabel,
    scoreLabel: `${roundedScore}/100`,
    scoreTone: 'Condiții bune',
    userText: 'Vremea nu pare să încetinească traficul în mod semnificativ.',
  };
}

function getConditionColor(tone: RouteConditionTone, colors: ThemeColors) {
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
    return 'Trafic aglomerat';
  }

  if (tone === 'moderate') {
    return 'Trafic moderat';
  }

  return 'Trafic lejer';
}

function buildCityTrafficSummary(
  congestedSegments: TopCongestedStreetRecord[]
): CityTrafficSummary | null {
  if (congestedSegments.length === 0) {
    return null;
  }

  const scoreValues = congestedSegments
    .map((segment) => segment.congestion_score)
    .filter((value): value is number => value !== null && value !== undefined);

  if (scoreValues.length === 0) {
    return null;
  }

  const averageScore =
    scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length;
  const speedValues = congestedSegments
    .map((segment) => segment.avg_speed)
    .filter((value): value is number => value !== null && value !== undefined);
  const freeFlowValues = congestedSegments
    .map((segment) => segment.free_flow_speed_kmh)
    .filter((value): value is number => value !== null && value !== undefined);
  const averageSpeed =
    speedValues.length > 0
      ? speedValues.reduce((sum, value) => sum + value, 0) / speedValues.length
      : null;
  const averageFreeFlowSpeed =
    freeFlowValues.length > 0
      ? freeFlowValues.reduce((sum, value) => sum + value, 0) / freeFlowValues.length
      : null;
  const tone = getRouteConditionTone(averageScore, []);

  return {
    averageFreeFlowSpeed:
      averageFreeFlowSpeed === null ? null : Math.round(averageFreeFlowSpeed),
    averageScore: Math.round(averageScore),
    averageSpeed: averageSpeed === null ? null : Math.round(averageSpeed),
    label: getConditionLabel(tone),
    monitoredCorridors: congestedSegments.length,
    tone,
  };
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
  const weatherLabel = formatWeatherLabel(weatherImpact?.weather_label);
  const congestedStreet = topCongestedSegment?.street_name ?? 'Coridoare monitorizate';

  const descriptions: Record<RouteConditionTone, string> = {
    high:
      'Cursa poate dura mai mult decât de obicei din cauza traficului și a alertelor active.',
    low:
      'Nu sunt semnale importante de trafic dificil pe zonele monitorizate.',
    moderate:
      'Pot apărea întârzieri ușoare pe unele zone din Suceava.',
  };

  return {
    alertContext: cityAlerts.length
      ? `${cityAlerts.length} alerte active`
      : 'Fără alerte active',
    congestionContext:
      congestionScore === null || congestionScore === undefined
        ? `${congestedStreet}: indisponibil`
        : `${congestedStreet}: ${congestionScore}`,
    description: descriptions[tone],
    etaContext: `${formatValue(routePreview.duration_minutes, ' min')}`,
    label: getConditionLabel(tone),
    tone,
    weatherContext: weatherLabel,
  };
}

export default function DriveScreen({
  onOpenAccount,
  onOpenHistory,
  savedRouteUseRequest = null,
}: DriveScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, resolvedMode, setThemeMode } = useTheme();
  const { styles } = useThemedStyles(createStyles);
  const { getAccessToken, isAuthenticated, session } = useAuth();
  const [data, setData] = useState<DriveState>({
    routes: [],
    events: [],
    rides: [],
    congested: [],
    weather: [],
    trafficSource: 'tomtom',
    trafficScope: 'Trei coridoare monitorizate în Suceava',
    trafficObservedAt: null,
  });
  const [trafficProfile, setTrafficProfile] = useState<TrafficProfileResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDriveDataCached, setIsDriveDataCached] = useState(false);
  const [driveCacheSavedAt, setDriveCacheSavedAt] = useState<string | null>(null);
  const [isRouteSheetVisible, setIsRouteSheetVisible] = useState(false);
  const [isRouteConfirmationVisible, setIsRouteConfirmationVisible] = useState(false);
  const [isMapExpandedVisible, setIsMapExpandedVisible] = useState(false);
  const [isExpandedRoutePromptVisible, setIsExpandedRoutePromptVisible] = useState(true);
  const [isDriveActive, setIsDriveActive] = useState(false);
  const [driveGpsStatus, setDriveGpsStatus] = useState<DriveGpsStatus>('inactive');
  const [liveDriveLocation, setLiveDriveLocation] =
    useState<CurrentRouteLocation | null>(null);
  const [liveDriveSpeedKmh, setLiveDriveSpeedKmh] = useState<number | null>(null);
  const [liveDriveHeadingDegrees, setLiveDriveHeadingDegrees] = useState<number | null>(null);
  const [isMapFollowingLocation, setIsMapFollowingLocation] = useState(true);
  const [isRideSheetVisible, setIsRideSheetVisible] = useState(false);
  const [routeOriginMode, setRouteOriginMode] = useState<RouteOriginMode>('current');
  const [manualRouteOrigin, setManualRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreviewResponse | null>(null);
  const [routePreviewCacheSavedAt, setRoutePreviewCacheSavedAt] =
    useState<string | null>(null);
  const [isRoutePreviewLoading, setIsRoutePreviewLoading] = useState(false);
  const [routePreviewError, setRoutePreviewError] = useState('');
  const [routePreviewCacheMessage, setRoutePreviewCacheMessage] = useState('');
  const [isAddingRideHistory, setIsAddingRideHistory] = useState(false);
  const [rideHistoryMessage, setRideHistoryMessage] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [isCurrentRouteSaved, setIsCurrentRouteSaved] = useState(false);
  const [savedRouteMessage, setSavedRouteMessage] = useState('');
  const [currentLocationMessage, setCurrentLocationMessage] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [currentRouteLocation, setCurrentRouteLocation] =
    useState<CurrentRouteLocation | null>(null);
  const isLiveMapTrackingEnabled = isMapExpandedVisible || isDriveActive;

  async function loadDriveData(showLoadingState = true) {
    try {
      if (showLoadingState) {
        setIsLoading(true);
      }
      setErrorMessage('');

      const [driveOverview, trafficProfileResponse] = await Promise.all([
        getDriveOverview(),
        getTrafficProfile().catch(() => null),
      ]);

      if (driveOverview.traffic_source !== 'tomtom') {
        throw new Error('Backend-ul nu servește încă snapshot-ul TomTom real.');
      }

      setData({
        ...driveOverview,
        trafficSource: driveOverview.traffic_source ?? 'tomtom',
        trafficScope:
          driveOverview.traffic_scope ?? 'Trei coridoare monitorizate în Suceava',
        trafficObservedAt: driveOverview.traffic_observed_at ?? null,
      });
      setTrafficProfile(trafficProfileResponse);
      setIsDriveDataCached(false);
      setDriveCacheSavedAt(null);

      try {
        await saveCachedDriveOverview(driveOverview);
      } catch {
        // Cache writes should not block the live Drive experience.
      }
    } catch (error) {
      const cachedDriveOverview = await getCachedDriveOverview();

      if (
        cachedDriveOverview &&
        cachedDriveOverview.data.traffic_source === 'tomtom'
      ) {
        setData({
          ...cachedDriveOverview.data,
          trafficSource: cachedDriveOverview.data.traffic_source ?? 'tomtom',
          trafficScope:
            cachedDriveOverview.data.traffic_scope ?? 'Trei coridoare monitorizate în Suceava',
          trafficObservedAt: cachedDriveOverview.data.traffic_observed_at ?? null,
        });
        try {
          setTrafficProfile(await getTrafficProfile());
        } catch {
          setTrafficProfile(null);
        }
        setIsDriveDataCached(true);
        setDriveCacheSavedAt(cachedDriveOverview.savedAt);
        setErrorMessage('');
        return;
      }

      setErrorMessage(
        'Traffiq nu poate încărca datele de mobilitate acum. Încearcă din nou.'
      );
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  }

  async function refreshAndLoadDriveData(showLoadingState = true) {
    try {
      await requestMobilityRefresh();
    } catch {
      // The last verified snapshot remains available when refresh is unavailable.
    }

    await loadDriveData(showLoadingState);
  }

  useEffect(() => {
    let isRefreshRunning = false;

    async function runRefresh(showLoadingState = false) {
      if (isRefreshRunning) {
        return;
      }

      isRefreshRunning = true;

      try {
        await refreshAndLoadDriveData(showLoadingState);
      } finally {
        isRefreshRunning = false;
      }
    }

    runRefresh(true);

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        runRefresh();
      }
    }, MOBILITY_REFRESH_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runRefresh();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    async function loadDistancePreference() {
      if (!isAuthenticated || !session?.tokens.accessToken) {
        setDistanceUnit('km');
        return;
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setDistanceUnit('km');
        return;
      }

      try {
        const response = await getUserPreferences(accessToken);
        setDistanceUnit(response.data.distance_unit);
        await setThemeMode(response.data.theme_mode);
      } catch {
        setDistanceUnit('km');
      }
    }

    loadDistancePreference();
  }, [getAccessToken, isAuthenticated, session?.tokens.accessToken, setThemeMode]);

  useEffect(() => {
    if (isMapExpandedVisible) {
      setIsMapFollowingLocation(true);
    }
  }, [isMapExpandedVisible]);

  useEffect(() => {
    if (!isLiveMapTrackingEnabled) {
      setDriveGpsStatus('inactive');
      setLiveDriveLocation(null);
      setLiveDriveSpeedKmh(null);
      setLiveDriveHeadingDegrees(null);
      return;
    }

    let isMounted = true;
    let positionSubscription: Location.LocationSubscription | null = null;

    async function startDriveTracking() {
      try {
        setDriveGpsStatus('starting');
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== 'granted') {
          setDriveGpsStatus('denied');
          return;
        }

        positionSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 3500,
          },
          (position) => {
            if (!isMounted) {
              return;
            }

            const gpsHeading =
              position.coords.heading === null || position.coords.heading < 0
                ? null
                : position.coords.heading;
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            const speedMetersPerSecond = position.coords.speed;
            const hasReliableGpsHeading =
              gpsHeading !== null &&
              speedMetersPerSecond !== null &&
              speedMetersPerSecond >= 1.4;

            setDriveGpsStatus('tracking');
            setLiveDriveLocation(location);
            setCurrentRouteLocation(location);
            if (hasReliableGpsHeading) {
              setLiveDriveHeadingDegrees(gpsHeading);
            }
            setLiveDriveSpeedKmh(
              speedMetersPerSecond === null || speedMetersPerSecond < 0
                ? null
                : Math.round(speedMetersPerSecond * 3.6)
            );
          },
          () => {
            if (isMounted) {
              setDriveGpsStatus('unavailable');
              setLiveDriveSpeedKmh(null);
              setLiveDriveHeadingDegrees(null);
            }
          }
        );
      } catch {
        if (isMounted) {
          setDriveGpsStatus('unavailable');
          setLiveDriveSpeedKmh(null);
          setLiveDriveHeadingDegrees(null);
        }
      }
    }

    startDriveTracking();

    return () => {
      isMounted = false;
      positionSubscription?.remove();
    };
  }, [isLiveMapTrackingEnabled]);

  useEffect(() => {
    if (!savedRouteUseRequest) {
      return;
    }

    let isMounted = true;
    const { route } = savedRouteUseRequest;

    async function prepareSavedRoute() {
      setRouteOriginMode('manual');
      setManualRouteOrigin(route.origin_name);
      setRouteDestination(route.destination_name);
      setRoutePreviewError('');
      setRoutePreviewCacheMessage('');
      setIsRoutePreviewLoading(true);

      try {
        const preview = await previewRoute(route.origin_name, route.destination_name);

        if (!isMounted) {
          return;
        }

        setPlannedRoute({
          destination: preview.destination.name,
          origin: preview.origin.name,
        });
        setIsDriveActive(false);
        setRoutePreview(preview);
        setRoutePreviewCacheSavedAt(null);
        setIsCurrentRouteSaved(true);
        setSavedRouteMessage('Ruta salvată este pregătită.');
        setRideHistoryMessage('');
        setIsRouteSheetVisible(false);
        setIsRouteConfirmationVisible(true);

        try {
          await saveCachedRoutePreview(preview);
        } catch {
          // Cache writes should not block a successful route preview.
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setIsRouteSheetVisible(true);
        setRoutePreviewError(
          'Nu am putut pregăti ruta salvată. Verifică destinația și încearcă din nou.'
        );
      } finally {
        if (isMounted) {
          setIsRoutePreviewLoading(false);
        }
      }
    }

    prepareSavedRoute();

    return () => {
      isMounted = false;
    };
  }, [savedRouteUseRequest?.id]);

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
      routeOriginMode === 'current' ? 'Locația curentă' : manualRouteOrigin.trim();
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
      setRoutePreviewCacheMessage('');

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
      setIsDriveActive(false);
      setRoutePreview(preview);
      setRoutePreviewCacheSavedAt(null);
      setIsCurrentRouteSaved(false);
      setSavedRouteMessage('');
      setRideHistoryMessage('');
      setIsRouteSheetVisible(false);
      setIsRouteConfirmationVisible(true);

      try {
        await saveCachedRoutePreview(preview);
      } catch {
        // Cache writes should not block a successful route preview.
      }
    } catch {
      const cachedRoutePreview = await getCachedRoutePreview();

      if (cachedRoutePreview) {
        const preview = cachedRoutePreview.data;

        setPlannedRoute({
          destination: preview.destination.name,
          origin: preview.origin.name,
        });
        setIsDriveActive(false);
        setRoutePreview(preview);
        setRoutePreviewCacheSavedAt(cachedRoutePreview.savedAt);
        setIsCurrentRouteSaved(false);
        setRoutePreviewCacheMessage(
          'Nu am putut calcula o rută nouă. Afișăm ultima rută calculată cu succes.'
        );
        setSavedRouteMessage('');
        setRideHistoryMessage('');
        setIsRouteSheetVisible(false);
        setIsRouteConfirmationVisible(true);
        return;
      }

      setRoutePreview(null);
      setRoutePreviewCacheSavedAt(null);
      setIsCurrentRouteSaved(false);
      setRoutePreviewError(
        'Nu am putut calcula această rută. Alege o destinație din sugestii.'
      );
    } finally {
      setIsRoutePreviewLoading(false);
    }
  }

  async function handleSaveRoute() {
    if (!routePreview || isCurrentRouteSaved) {
      return;
    }

    if (!isAuthenticated || !session?.tokens.accessToken) {
      onOpenAccount();
      return;
    }

    try {
      setIsSavingRoute(true);
      setSavedRouteMessage('');
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setSavedRouteMessage('Sesiunea a expirat. Autentifică-te din nou.');
        onOpenAccount();
        return;
      }

      await saveRoute(routePreview, accessToken);
      setIsCurrentRouteSaved(true);
      setSavedRouteMessage('Ruta a fost salvată în cont.');
    } catch {
      setSavedRouteMessage('Ruta nu a putut fi salvată. Încearcă din nou.');
    } finally {
      setIsSavingRoute(false);
    }
  }

  async function handleStartDrive() {
    if (!routePreview) {
      return;
    }

    setIsDriveActive(true);
    setIsMapExpandedVisible(true);
    setIsRouteConfirmationVisible(false);

    if (!isAuthenticated || !session?.tokens.accessToken) {
      setRideHistoryMessage('Cursa a pornit. Autentifică-te pentru salvare în istoric.');
      return;
    }

    try {
      setIsAddingRideHistory(true);
      setRideHistoryMessage('');
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setRideHistoryMessage('Sesiunea a expirat. Autentifică-te din nou.');
        return;
      }

      await addRideToHistory(
        routePreview,
        accessToken,
        topCongestedSegment?.congestion_score ?? weatherImpact?.avg_congestion_score
      );
      setRideHistoryMessage('Cursa a pornit și a fost salvată în istoric.');
    } catch {
      setRideHistoryMessage('Cursa a pornit, dar nu a putut fi salvată în istoric.');
    } finally {
      setIsAddingRideHistory(false);
    }
  }

  function handleEndRoute() {
    setIsDriveActive(false);
    setIsMapExpandedVisible(false);
    setPlannedRoute(null);
    setRoutePreview(null);
    setRoutePreviewCacheMessage('');
    setIsCurrentRouteSaved(false);
    setSavedRouteMessage('');
    setRideHistoryMessage('');
  }

  if (isLoading) {
    return <LoadingState message="Se încarcă datele Traffiq..." />;
  }

  if (errorMessage) {
    return (
      <ErrorState
        actionLabel="Încearcă din nou"
        label="Hartă indisponibilă"
        message={errorMessage}
        onAction={() => refreshAndLoadDriveData()}
        title="Hartă"
      />
    );
  }

  const primaryEvent = data.events[0];
  const topCongestedSegment = data.congested[0];
  const cityTrafficSummary = buildCityTrafficSummary(data.congested);
  const weatherImpact = data.weather[0];
  const weatherPresentation = getWeatherImpactPresentation(weatherImpact);
  const recentRide = data.rides[0];
  const routeCondition = buildRouteConditionSummary(
    routePreview,
    weatherImpact,
    topCongestedSegment,
    data.events
  );
  const driveCacheTimestamp = formatCacheTimestamp(driveCacheSavedAt);
  const routePreviewCacheTimestamp = formatCacheTimestamp(routePreviewCacheSavedAt);
  const trafficObservedTimestamp = formatCacheTimestamp(data.trafficObservedAt);
  const shouldShowInlineRouteConfirmation =
    !!plannedRoute && !isRouteConfirmationVisible && !isMapExpandedVisible;
  const destinationSuggestions = searchSuceavaLocations(routeDestination);
  const shouldShowDestinationSuggestions = routeDestination.trim().length >= 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.eyebrow}>Traffiq</Text>
            <Text style={styles.title}>Unde mergi?</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Deschide contul"
              onPress={onOpenAccount}
              style={styles.accountButton}
            >
              <Text style={styles.accountButtonText}>A</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Deschide istoricul curselor"
              onPress={onOpenHistory}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>H</Text>
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
            <Text style={styles.destinationLabel}>Caută destinație</Text>
            <Text style={styles.destinationText}>
              {plannedRoute ? plannedRoute.destination : 'Unde vrei să ajungi?'}
            </Text>
          </View>
          <Text style={styles.destinationArrow}>›</Text>
        </Pressable>

        {isDriveDataCached ? (
          <View style={styles.cacheNotice}>
            <Text style={styles.cacheNoticeLabel}>Ultimele date disponibile</Text>
            <Text style={styles.cacheNoticeText}>
              Afișăm ultima situație încărcată cu succes
              {driveCacheTimestamp ? ` din ${driveCacheTimestamp}` : ''}.
            </Text>
          </View>
        ) : null}

        <View style={styles.weatherStrip}>
          <View style={styles.weatherTextBlock}>
            <Text style={styles.weatherLabel}>Meteo pe traseu</Text>
            <Text style={styles.weatherTitle}>
              {weatherPresentation.emoji} {weatherPresentation.label}
            </Text>
            <Text style={styles.weatherHelpText}>{weatherPresentation.userText}</Text>
          </View>
          <View style={styles.weatherMetric}>
            <Text style={styles.weatherMetricValue}>{weatherPresentation.scoreLabel}</Text>
            <Text style={styles.weatherMetricLabel}>{weatherPresentation.scoreTone}</Text>
          </View>
        </View>

        <SuceavaMap
          events={data.events}
          onExpand={() => {
            setIsExpandedRoutePromptVisible(true);
            setIsMapExpandedVisible(true);
          }}
          routePreview={routePreview}
        />

        <TrafficProfileChart profile={trafficProfile} />

        {shouldShowInlineRouteConfirmation ? (
          <View style={styles.routeDraftCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.routeDraftTextWrap}>
                <Text style={styles.routeDraftLabel}>Gata de plecare</Text>
                <Text style={styles.routeDraftTitle}>
                  {plannedRoute.origin} către {plannedRoute.destination}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Închide ruta"
                onPress={handleEndRoute}
                style={styles.routeDraftRemoveButton}
              >
                <Text style={styles.routeDraftRemoveText}>
                  {isDriveActive ? 'Oprește' : 'Renunță'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.cardText}>
              {routePreview
                ? `${formatValue(routePreview.duration_minutes, ' min')} durată · ${formatDistance(
                    routePreview.distance_km,
                    distanceUnit
                  )}`
                : 'Ruta se pregătește.'}
            </Text>

            {routePreviewCacheMessage ? (
              <Text style={styles.cacheInlineText}>
                {routePreviewCacheMessage}
                {routePreviewCacheTimestamp ? ` Salvat ${routePreviewCacheTimestamp}.` : ''}
              </Text>
            ) : null}

            {routePreview ? (
              <View style={styles.routeSummaryGrid}>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>De la</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.origin.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Către</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.destination.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Distanță</Text>
                  <Text style={styles.routeSummaryValue}>
                    {formatDistance(routePreview.distance_km, distanceUnit)}
                  </Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Durată</Text>
                  <Text style={styles.routeSummaryValue}>
                    {formatValue(routePreview.duration_minutes, ' min')}
                  </Text>
                </View>
              </View>
            ) : null}

            {routeCondition ? (
              <View style={styles.conditionPanel}>
                <View style={styles.conditionHeader}>
                  <View
                    style={[
                      styles.conditionIndicator,
                      { backgroundColor: getConditionColor(routeCondition.tone, colors) },
                    ]}
                  />
                  <View style={styles.conditionTitleWrap}>
                    <Text style={styles.conditionLabel}>Condiții pe traseu</Text>
                    <Text style={styles.conditionTitle}>{routeCondition.label}</Text>
                  </View>
                </View>

                <Text style={styles.conditionDescription}>{routeCondition.description}</Text>

                <View style={styles.conditionMetrics}>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Durată</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.etaContext}</Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Vreme</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.weatherContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Trafic</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.congestionContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Alerte</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.alertContext}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.routeDraftSecondaryActions}>
              <Pressable
                accessibilityLabel="Salvează ruta"
                disabled={!routePreview || isSavingRoute || isCurrentRouteSaved}
                onPress={handleSaveRoute}
                style={[
                  styles.routeDraftSaveButton,
                  isCurrentRouteSaved && styles.routeDraftSaveButtonSaved,
                  (!routePreview || isSavingRoute) && styles.routeDraftButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.routeDraftSaveText,
                    isCurrentRouteSaved && styles.routeDraftSaveTextSaved,
                  ]}
                >
                  {isCurrentRouteSaved
                    ? 'Rută salvată'
                    : isSavingRoute
                      ? 'Se salvează'
                      : isAuthenticated
                        ? 'Salvează ruta'
                        : 'Autentifică-te'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Schimbă ruta"
                onPress={() => {
                  setIsDriveActive(false);
                  setIsRouteSheetVisible(true);
              }}
              style={styles.routeDraftEditButton}
            >
                <Text style={styles.routeDraftEditText}>Schimbă ruta</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Pornește cursa cu această rută"
              disabled={!routePreview || (!isDriveActive && isAddingRideHistory)}
              onPress={() => {
                if (isDriveActive) {
                  setIsMapExpandedVisible(true);
                  return;
                }

                handleStartDrive();
              }}
              style={[
                styles.driveButton,
                (!routePreview || (!isDriveActive && isAddingRideHistory)) &&
                  styles.routeDraftButtonDisabled,
              ]}
            >
              <Text style={styles.driveButtonText}>
                {isDriveActive
                  ? 'Continuă'
                  : isAddingRideHistory
                    ? 'Pornire...'
                    : 'Pornește'}
              </Text>
            </Pressable>

            <Text style={styles.driveHelpText}>
              {isDriveActive
                ? 'GPS-ul rămâne activ cât timp cursa este pornită.'
                : 'Pornește deschide harta și salvează cursa în istoric dacă ești autentificat.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trafic în Suceava</Text>
            <Text style={styles.sectionAction}>Acum</Text>
          </View>

          {!cityTrafficSummary ? (
            <EmptyState
              message="Nu există încă o observație recentă pentru coridoarele urmărite."
              title="Trafic indisponibil"
            />
          ) : (
            <View style={styles.recommendationCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.recommendationTitle}>{cityTrafficSummary.label}</Text>
                <Text style={styles.levelBadge}>
                  {formatValue(cityTrafficSummary.averageScore)}/100
                </Text>
              </View>
              <Text style={styles.cardText}>
                Estimare pe baza celor mai importante coridoare monitorizate din
                Suceava{trafficObservedTimestamp ? `, actualizată ${trafficObservedTimestamp}` : ''}.
              </Text>

              <View style={styles.tripStats}>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {formatValue(cityTrafficSummary.averageSpeed, ' km/h')}
                  </Text>
                  <Text style={styles.tripLabel}>Viteză medie</Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {formatValue(cityTrafficSummary.averageFreeFlowSpeed, ' km/h')}
                  </Text>
                  <Text style={styles.tripLabel}>Viteză liberă</Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripValue}>
                    {cityTrafficSummary.monitoredCorridors}
                  </Text>
                  <Text style={styles.tripLabel}>Coridoare</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alerte în Suceava</Text>
            <Text style={styles.sectionAction}>Acum</Text>
          </View>

          {!primaryEvent ? (
            <EmptyState
              message="Nu există alerte active în ultima verificare."
              title="Nicio alertă activă"
            />
          ) : (
            data.events.slice(0, 3).map((event) => (
              <View key={event.event_id} style={styles.alertCard}>
                <View
                  style={[
                    styles.alertIndicator,
                    { backgroundColor: getSeverityColor(event.severity, colors) },
                  ]}
                />
                <View style={styles.alertContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.alertTitle}>{event.street_name}</Text>
                    <Text
                      style={[
                        styles.alertSeverity,
                        { color: getSeverityColor(event.severity, colors) },
                      ]}
                    >
                      {event.severity}
                    </Text>
                  </View>
                  <Text style={styles.alertType}>{formatTrafficAlertType(event.event_type)}</Text>
                  <Text style={styles.cardText}>
                    {formatTrafficAlertDescription(event.event_description)}
                  </Text>
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
            <Text style={styles.recentRideLabel}>Ultima cursă</Text>
            <Text style={styles.recentRideTitle}>
              {recentRide ? formatRouteName(recentRide.route_name) : 'Istoric curse'}
            </Text>
            <Text style={styles.recentRideText}>
              {recentRide
                ? `${formatValue(recentRide.estimated_duration_minutes, ' min')} · ${formatRideTraffic(
                    recentRide
                  )}`
                : 'Autentifică-te pentru cursele personale'}
            </Text>
          </View>
          <Text style={styles.recentRideArrow}>›</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={isMapExpandedVisible}
        onRequestClose={() => setIsMapExpandedVisible(false)}
      >
        <StatusBar
          backgroundColor={colors.background}
          style={resolvedMode === 'dark' ? 'light' : 'dark'}
          translucent
        />
        <SafeAreaView style={styles.expandedMapContainer}>
          <View
            style={[
              styles.expandedMapHeader,
              { paddingTop: Math.max(insets.top + 10, 26) },
            ]}
          >
            <Text style={styles.expandedMapTitle}>Harta Suceava</Text>
            <Pressable
              onPress={() => setIsMapExpandedVisible(false)}
              style={styles.expandedMapCloseButton}
            >
              <Text style={styles.expandedMapCloseText}>Închide</Text>
            </Pressable>
          </View>

          <View style={styles.expandedMapBody}>
            <SuceavaMap
              events={data.events}
              gpsStatus={driveGpsStatus}
              isDriveActive={isDriveActive}
              isFollowingLocation={isMapFollowingLocation}
              isLiveTrackingEnabled={isLiveMapTrackingEnabled}
              liveHeadingDegrees={liveDriveHeadingDegrees}
              liveLocation={liveDriveLocation}
              liveSpeedKmh={liveDriveSpeedKmh}
              onDismissRoutePrompt={() => setIsExpandedRoutePromptVisible(false)}
              onEndDrive={handleEndRoute}
              onFollowLocationChange={setIsMapFollowingLocation}
              onPlanRoute={() => {
                setIsMapExpandedVisible(false);
                setIsRouteSheetVisible(true);
              }}
              routePreview={routePreview}
              showRoutePrompt={!routePreview && isExpandedRoutePromptVisible}
              variant="expanded"
            />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isRouteConfirmationVisible && !!plannedRoute}
        onRequestClose={() => setIsRouteConfirmationVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setIsRouteConfirmationVisible(false)}
        >
          <Pressable style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.cardTopRow}>
              <View style={styles.routeDraftTextWrap}>
                <Text style={styles.routeDraftLabel}>Gata de plecare</Text>
                <Text style={styles.routeDraftTitle}>
                  {plannedRoute?.origin} către {plannedRoute?.destination}
                </Text>
              </View>
            </View>

            <Text style={styles.cardText}>
              {routePreview
                ? `${formatValue(routePreview.duration_minutes, ' min')} durată · ${formatDistance(
                    routePreview.distance_km,
                    distanceUnit
                  )}`
                : 'Ruta se pregătește.'}
            </Text>

            {routePreviewCacheMessage ? (
              <Text style={styles.cacheInlineText}>
                {routePreviewCacheMessage}
                {routePreviewCacheTimestamp ? ` Salvat ${routePreviewCacheTimestamp}.` : ''}
              </Text>
            ) : null}

            {routePreview ? (
              <View style={styles.routeSummaryGrid}>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>De la</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.origin.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Către</Text>
                  <Text style={styles.routeSummaryValue}>{routePreview.destination.name}</Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Distanță</Text>
                  <Text style={styles.routeSummaryValue}>
                    {formatDistance(routePreview.distance_km, distanceUnit)}
                  </Text>
                </View>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryLabel}>Durată</Text>
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
                  savedRouteMessage.includes('nu a putut') && styles.savedRouteMessageError,
                ]}
              >
                {savedRouteMessage}
              </Text>
            ) : null}

            {rideHistoryMessage ? (
              <Text
                style={[
                  styles.savedRouteMessage,
                  rideHistoryMessage.startsWith('Cursa') &&
                  !rideHistoryMessage.includes('nu a putut')
                    ? null
                    : styles.savedRouteMessageError,
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
                      { backgroundColor: getConditionColor(routeCondition.tone, colors) },
                    ]}
                  />
                  <View style={styles.conditionTitleWrap}>
                    <Text style={styles.conditionLabel}>Condiții pe traseu</Text>
                    <Text style={styles.conditionTitle}>{routeCondition.label}</Text>
                  </View>
                </View>

                <Text style={styles.conditionDescription}>{routeCondition.description}</Text>

                <View style={styles.conditionMetrics}>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Durată</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.etaContext}</Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Vreme</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.weatherContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Trafic</Text>
                    <Text style={styles.conditionMetricValue}>
                      {routeCondition.congestionContext}
                    </Text>
                  </View>
                  <View style={styles.conditionMetric}>
                    <Text style={styles.conditionMetricLabel}>Alerte</Text>
                    <Text style={styles.conditionMetricValue}>{routeCondition.alertContext}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.routeDraftSecondaryActions}>
              <Pressable
                accessibilityLabel="Salvează ruta"
                disabled={!routePreview || isSavingRoute || isCurrentRouteSaved}
                onPress={handleSaveRoute}
                style={[
                  styles.routeDraftSaveButton,
                  isCurrentRouteSaved && styles.routeDraftSaveButtonSaved,
                  (!routePreview || isSavingRoute) && styles.routeDraftButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.routeDraftSaveText,
                    isCurrentRouteSaved && styles.routeDraftSaveTextSaved,
                  ]}
                >
                  {isCurrentRouteSaved
                    ? 'Rută salvată'
                    : isSavingRoute
                      ? 'Se salvează'
                      : isAuthenticated
                        ? 'Salvează ruta'
                        : 'Autentifică-te'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Schimbă ruta"
                onPress={() => {
                  setIsRouteConfirmationVisible(false);
                  setIsRouteSheetVisible(true);
                }}
                style={styles.routeDraftEditButton}
              >
                <Text style={styles.routeDraftEditText}>Schimbă ruta</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Pornește cursa cu această rută"
              disabled={!routePreview || isAddingRideHistory}
              onPress={handleStartDrive}
              style={[
                styles.driveButton,
                (!routePreview || isAddingRideHistory) && styles.routeDraftButtonDisabled,
              ]}
            >
              <Text style={styles.driveButtonText}>
                {isAddingRideHistory ? 'Pornire...' : 'Pornește'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isRouteSheetVisible}
        onRequestClose={() => setIsRouteSheetVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          style={styles.sheetBackdrop}
        >
          <Pressable
            accessibilityLabel="Închide planificarea rutei"
            onPress={() => setIsRouteSheetVisible(false)}
            style={styles.sheetDismissArea}
          />

          <View style={[styles.bottomSheet, styles.routePlannerSheet]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Unde mergi?</Text>

            <Text style={styles.sheetText}>
              Alege o destinație din Suceava. Poți folosi locația curentă dacă
              ai permis accesul la GPS.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>De la</Text>
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
                    Locația curentă
                  </Text>
                  <Text
                    style={[
                      styles.originChoiceText,
                      routeOriginMode === 'current' && styles.originChoiceTextActive,
                    ]}
                  >
                    GPS telefon
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
                    Scrie locația
                  </Text>
                  <Text
                    style={[
                      styles.originChoiceText,
                      routeOriginMode === 'manual' && styles.originChoiceTextActive,
                    ]}
                  >
                    Locații disponibile
                  </Text>
                </Pressable>
              </View>

              {routeOriginMode === 'manual' ? (
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setManualRouteOrigin}
                  placeholder="Exemplu: Centru"
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
              <Text style={styles.inputLabel}>Către</Text>
              <TextInput
                autoCapitalize="words"
                autoFocus
                onChangeText={setRouteDestination}
                placeholder="Caută destinația în Suceava"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.routeInput}
                value={routeDestination}
              />
            </View>

            <View style={styles.suggestionSection}>
              {shouldShowDestinationSuggestions ? (
                <>
                  <Text style={styles.inputLabel}>Rezultate</Text>
                  {destinationSuggestions.length > 0 ? (
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      style={styles.suggestionListScroll}
                    >
                      <View style={styles.suggestionList}>
                      {destinationSuggestions.map((destination) => {
                        const isSelected = routeDestination === destination.name;

                        return (
                          <Pressable
                            key={destination.name}
                            onPress={() => setRouteDestination(destination.name)}
                            style={[
                              styles.suggestionRow,
                              isSelected && styles.suggestionRowActive,
                            ]}
                          >
                            <View style={styles.suggestionTextBlock}>
                              <Text
                                style={[
                                  styles.suggestionTitle,
                                  isSelected && styles.suggestionTitleActive,
                                ]}
                              >
                                {destination.name}
                              </Text>
                              <Text
                                style={[
                                  styles.suggestionMeta,
                                  isSelected && styles.suggestionMetaActive,
                                ]}
                              >
                                {formatLocationCategory(destination.category)}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.suggestionArrow,
                                isSelected && styles.suggestionArrowActive,
                              ]}
                            >
                              ›
                            </Text>
                          </Pressable>
                        );
                      })}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={styles.noSuggestionsText}>
                      Nu am găsit o locație potrivită în Suceava.
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.searchHelpText}>
                  Scrie un loc, o stradă, un cartier, un magazin sau un reper.
                </Text>
              )}
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
                {isRoutePreviewLoading ? 'Se calculează...' : 'Calculează ruta'}
              </Text>
            </Pressable>

            {routePreviewError ? (
              <Text style={styles.routePreviewError}>{routePreviewError}</Text>
            ) : null}

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
            <Text style={styles.sheetTitle}>Ultimele 5 curse</Text>

            {data.rides.slice(0, 5).map((ride) => (
              <View key={ride.ride_id} style={styles.sheetRouteRow}>
                <Text style={styles.sheetRouteName}>{formatRouteName(ride.route_name)}</Text>
                <Text style={styles.sheetRouteMeta}>
                  {formatValue(ride.estimated_duration_minutes, ' min')} ·{' '}
                  {formatRideTraffic(ride)}
                </Text>
              </View>
            ))}
          </Pressable>
        </Pressable>
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
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    flexShrink: 0,
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
    letterSpacing: 0,
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
  cacheNotice: {
    backgroundColor: colors.surface,
    borderColor: colors.amber,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  cacheNoticeLabel: {
    color: colors.amber,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cacheNoticeText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
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
  weatherTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  weatherHelpText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  weatherMetric: {
    alignItems: 'flex-end',
    maxWidth: 130,
  },
  weatherMetricValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  weatherMetricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginTop: 3,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  expandedMapContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  expandedMapHeader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenX,
    paddingVertical: 14,
  },
  expandedMapTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  expandedMapCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  expandedMapCloseText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  expandedMapBody: {
    flex: 1,
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
  routeDraftSecondaryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
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
  routeDraftRemoveButton: {
    backgroundColor: colors.red,
    borderColor: colors.red,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  routeDraftRemoveText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeDraftEditButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  routeDraftSaveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  routeDraftSaveButtonSaved: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: 'rgba(34, 197, 94, 0.55)',
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
  routeDraftSaveTextSaved: {
    color: colors.accent,
  },
  driveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  driveButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  driveHelpText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
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
  cacheInlineText: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
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
    letterSpacing: 0,
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
  routePlannerSheet: {
    maxHeight: '82%',
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
  suggestionList: {
    gap: 8,
  },
  suggestionListScroll: {
    maxHeight: 220,
  },
  suggestionRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionRowActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  suggestionTextBlock: {
    flex: 1,
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  suggestionTitleActive: {
    color: colors.primaryText,
  },
  suggestionMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  suggestionMetaActive: {
    color: colors.primaryText,
  },
  suggestionArrow: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '400',
  },
  suggestionArrowActive: {
    color: colors.primaryText,
  },
  searchHelpText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  noSuggestionsText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
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
}

