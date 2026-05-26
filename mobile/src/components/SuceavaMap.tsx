import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, {
  LatLng,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  Region,
} from 'react-native-maps';

import { colors, radius, shadows } from '../theme/theme';
import { MapEventRecord, RoutePreviewResponse } from '../types/api';

const SUCEAVA_REGION: Region = {
  latitude: 47.6514,
  latitudeDelta: 0.055,
  longitude: 26.2556,
  longitudeDelta: 0.055,
};

const USER_LOCATION_REGION_DELTA = 0.012;
const MIN_ROUTE_REGION_DELTA = 0.015;

type LocationStatus = 'checking' | 'granted' | 'denied';

type SuceavaMapProps = {
  events?: MapEventRecord[];
  onExpand?: () => void;
  routePreview?: RoutePreviewResponse | null;
  variant?: 'compact' | 'expanded';
};

export default function SuceavaMap({
  events = [],
  onExpand,
  routePreview,
  variant = 'compact',
}: SuceavaMapProps) {
  const isExpanded = variant === 'expanded';
  const [currentRegion, setCurrentRegion] = useState<Region>(SUCEAVA_REGION);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking');

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (permission.status !== 'granted') {
          setLocationStatus('denied');
          setCurrentRegion(SUCEAVA_REGION);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentLocation(userLocation);
        setCurrentRegion({
          latitudeDelta: USER_LOCATION_REGION_DELTA,
          longitudeDelta: USER_LOCATION_REGION_DELTA,
          ...userLocation,
        });
        setLocationStatus('granted');
      } catch {
        if (isMounted) {
          setLocationStatus('denied');
          setCurrentRegion(SUCEAVA_REGION);
        }
      }
    }

    loadCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const routeCoordinates: LatLng[] =
    routePreview?.geometry.coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })) ?? [];
  const activeRoute = routePreview && routeCoordinates.length >= 2 ? routePreview : null;
  const displayRegion = activeRoute
    ? getRouteRegion(routeCoordinates)
    : currentRegion;
  const locationNotice =
    !activeRoute && locationStatus === 'denied'
      ? 'Location unavailable. Showing the Suceava demo viewport.'
      : '';
  const visibleEvents = events
    .filter((event) => event.latitude !== null && event.longitude !== null)
    .slice(0, isExpanded ? 8 : 4);

  return (
    <View style={[styles.mapPanel, isExpanded && styles.mapPanelExpanded]}>
      <MapView
        initialRegion={SUCEAVA_REGION}
        pitchEnabled={isExpanded}
        provider={PROVIDER_DEFAULT}
        region={displayRegion}
        rotateEnabled={isExpanded}
        scrollEnabled={isExpanded}
        showsCompass={isExpanded}
        showsMyLocationButton={isExpanded}
        showsUserLocation={locationStatus === 'granted'}
        style={styles.map}
        zoomEnabled={isExpanded}
      >
        {activeRoute ? (
          <>
            <Polyline
              coordinates={routeCoordinates}
              lineCap="round"
              lineJoin="round"
              strokeColor={colors.tealDark}
              strokeWidth={6}
            />

            <Marker
              coordinate={{
                latitude: activeRoute.destination.latitude,
                longitude: activeRoute.destination.longitude,
              }}
              description="Route destination"
              title={activeRoute.destination.name}
            >
              <View style={[styles.routeMarker, styles.routeMarkerDestination]}>
                <Text style={styles.routeMarkerText}>B</Text>
              </View>
            </Marker>
          </>
        ) : null}

        {visibleEvents.map((event) => (
          <Marker
            coordinate={{
              latitude: event.latitude as number,
              longitude: event.longitude as number,
            }}
            description={event.event_description}
            key={event.event_id}
            title={`${event.street_name} - ${event.severity}`}
          >
            <View
              style={[
                styles.alertMarker,
                { borderColor: getSeverityColor(event.severity) },
                { backgroundColor: getSeverityBackground(event.severity) },
              ]}
            >
              <Text style={styles.alertMarkerText}>!</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {activeRoute && isExpanded ? (
        <View style={styles.routeInfoCard}>
          <Text style={styles.routeInfoTitle}>{activeRoute.destination.name}</Text>
          <Text style={styles.routeInfoText}>
            {activeRoute.duration_minutes} min - {activeRoute.distance_km} km
          </Text>
        </View>
      ) : null}

      {locationNotice ? (
        <View style={styles.mapNotice}>
          <Text style={styles.mapNoticeText}>{locationNotice}</Text>
        </View>
      ) : null}

      {onExpand ? (
        <Pressable onPress={onExpand} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>Expand map</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getRouteRegion(routeCoordinates: LatLng[]): Region {
  const latitudes = routeCoordinates.map((coordinate) => coordinate.latitude);
  const longitudes = routeCoordinates.map((coordinate) => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeDelta = Math.max(
    (maxLatitude - minLatitude) * 1.6,
    MIN_ROUTE_REGION_DELTA
  );
  const longitudeDelta = Math.max(
    (maxLongitude - minLongitude) * 1.6,
    MIN_ROUTE_REGION_DELTA
  );

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    latitudeDelta,
    longitude: (minLongitude + maxLongitude) / 2,
    longitudeDelta,
  };
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

function getSeverityBackground(severity: string) {
  if (severity === 'high') {
    return 'rgba(244, 63, 94, 0.9)';
  }

  if (severity === 'medium') {
    return 'rgba(234, 179, 8, 0.9)';
  }

  return 'rgba(34, 197, 94, 0.9)';
}

const styles = StyleSheet.create({
  mapPanel: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 250,
    overflow: 'hidden',
  },
  mapPanelExpanded: {
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
    height: '100%',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  routeInfoCard: {
    backgroundColor: 'rgba(9, 11, 10, 0.88)',
    borderColor: 'rgba(248, 250, 248, 0.14)',
    borderRadius: radius.lg,
    borderWidth: 1,
    left: 12,
    maxWidth: '62%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    top: 12,
  },
  routeInfoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  routeInfoText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 4,
  },
  routeMarker: {
    alignItems: 'center',
    borderColor: colors.text,
    borderRadius: radius.md,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  routeMarkerDestination: {
    backgroundColor: colors.red,
  },
  routeMarkerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  alertMarker: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  alertMarkerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  expandButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
    right: 12,
  },
  expandButtonText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mapNotice: {
    backgroundColor: 'rgba(9, 11, 10, 0.86)',
    borderColor: 'rgba(250, 204, 21, 0.42)',
    borderRadius: radius.md,
    borderWidth: 1,
    bottom: 12,
    left: 12,
    maxWidth: '62%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    position: 'absolute',
  },
  mapNoticeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
});
