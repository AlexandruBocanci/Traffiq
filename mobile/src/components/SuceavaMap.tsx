import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import { colors, radius, shadows } from '../theme/theme';

const SUCEAVA_REGION: Region = {
  latitude: 47.6514,
  latitudeDelta: 0.055,
  longitude: 26.2556,
  longitudeDelta: 0.055,
};

type LocationStatus = 'checking' | 'granted' | 'denied';

type SuceavaMapProps = {
  congestionLabel: string;
  congestionScore: string;
};

export default function SuceavaMap({
  congestionLabel,
  congestionScore,
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

  return (
    <View style={styles.mapPanel}>
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

      <View style={styles.mapOverlay}>
        <Text style={styles.mapLabel}>Suceava map</Text>
        <Text style={styles.mapTitle}>{congestionLabel}</Text>
        <Text style={styles.mapText}>Congestion score {congestionScore}</Text>
      </View>
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
});
