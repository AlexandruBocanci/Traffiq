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
          ...SUCEAVA_REGION,
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

  const locationLabel =
    locationStatus === 'checking'
      ? 'Checking location'
      : locationStatus === 'granted'
        ? 'Current location enabled'
        : 'Default Suceava view';
  const routeCoordinates: LatLng[] =
    routePreview?.geometry.coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })) ?? [];
  const activeRoute = routePreview && routeCoordinates.length >= 2 ? routePreview : null;
  const geolocatedEvents = events.filter(
    (event) => event.latitude !== null && event.longitude !== null
  );

  function getEventMarkerColor(severity: string) {
    if (severity === 'high') {
      return colors.red;
    }

    if (severity === 'medium') {
      return colors.amber;
    }

    return colors.accent;
  }

  return (
    <View style={[styles.mapPanel, variant === 'expanded' && styles.mapPanelExpanded]}>
      <MapView
        initialRegion={SUCEAVA_REGION}
        provider={PROVIDER_DEFAULT}
        region={currentRegion}
        showsCompass
        showsMyLocationButton
        showsUserLocation={locationStatus === 'granted'}
        style={styles.map}
      >
        <Marker
          coordinate={{
            latitude: SUCEAVA_REGION.latitude,
            longitude: SUCEAVA_REGION.longitude,
          }}
          description="Default Traffiq city area"
          title="Suceava"
        />

        {geolocatedEvents.map((event) => (
          <Marker
            coordinate={{
              latitude: event.latitude as number,
              longitude: event.longitude as number,
            }}
            description={`${event.event_type}: ${event.event_description}`}
            key={`event-${event.event_id}`}
            pinColor={getEventMarkerColor(event.severity)}
            title={event.street_name}
          />
        ))}

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
                latitude: activeRoute.origin.latitude,
                longitude: activeRoute.origin.longitude,
              }}
              description="Route start"
              pinColor={colors.accent}
              title={activeRoute.origin.name}
            />

            <Marker
              coordinate={{
                latitude: activeRoute.destination.latitude,
                longitude: activeRoute.destination.longitude,
              }}
              description="Route destination"
              pinColor={colors.red}
              title={activeRoute.destination.name}
            />
          </>
        ) : null}

        {currentLocation ? (
          <Marker
            coordinate={currentLocation}
            description="Your current position"
            pinColor={colors.primary}
            title="Current location"
          />
        ) : null}
      </MapView>

      <View style={styles.locationBadge}>
        <Text style={styles.locationBadgeText}>{locationLabel}</Text>
      </View>

      {onExpand ? (
        <Pressable onPress={onExpand} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>Expand map</Text>
        </Pressable>
      ) : null}
    </View>
  );
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
  locationBadge: {
    backgroundColor: 'rgba(9, 11, 10, 0.82)',
    borderColor: 'rgba(248, 250, 248, 0.14)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  locationBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  expandButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
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
});
