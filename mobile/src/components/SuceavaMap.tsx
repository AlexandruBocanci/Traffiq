import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, radius, shadows } from '../theme/theme';
import { MapEventRecord, RoutePreviewResponse } from '../types/api';

type MapRegion = {
  latitude: number;
  latitudeDelta: number;
  longitude: number;
  longitudeDelta: number;
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const SUCEAVA_REGION: MapRegion = {
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
  const [currentRegion, setCurrentRegion] = useState<MapRegion>(SUCEAVA_REGION);
  const [currentLocation, setCurrentLocation] = useState<MapCoordinate | null>(null);
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

  const routeCoordinates: MapCoordinate[] =
    routePreview?.geometry.coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })) ?? [];
  const activeRoute = routePreview && routeCoordinates.length >= 2 ? routePreview : null;
  const displayRegion = activeRoute ? getRouteRegion(routeCoordinates) : currentRegion;
  const locationNotice =
    !activeRoute && locationStatus === 'denied'
      ? 'Location unavailable. Showing the Suceava demo viewport.'
      : '';
  const visibleEvents = events
    .filter((event) => event.latitude !== null && event.longitude !== null)
    .slice(0, isExpanded ? 8 : 4);
  const mapHtml = useMemo(
    () =>
      createMapHtml({
        currentLocation: locationStatus === 'granted' ? currentLocation : null,
        destination: activeRoute
          ? {
              latitude: activeRoute.destination.latitude,
              longitude: activeRoute.destination.longitude,
              name: activeRoute.destination.name,
            }
          : null,
        events: visibleEvents.map((event) => ({
          description: event.event_description,
          latitude: event.latitude as number,
          longitude: event.longitude as number,
          severity: event.severity,
          streetName: event.street_name,
        })),
        interactive: isExpanded,
        region: displayRegion,
        routeCoordinates,
      }),
    [
      activeRoute,
      currentLocation,
      displayRegion,
      isExpanded,
      locationStatus,
      routeCoordinates,
      visibleEvents,
    ]
  );

  return (
    <View style={[styles.mapPanel, isExpanded && styles.mapPanelExpanded]}>
      <WebView
        applicationNameForUserAgent="Traffiq/1.0.1"
        javaScriptEnabled
        originWhitelist={['*']}
        pointerEvents={isExpanded ? 'auto' : 'none'}
        source={{ html: mapHtml, baseUrl: 'https://traffiq.local/' }}
        style={styles.map}
      />

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

function getRouteRegion(routeCoordinates: MapCoordinate[]): MapRegion {
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

type EmbeddedMapData = {
  currentLocation: MapCoordinate | null;
  destination: (MapCoordinate & { name: string }) | null;
  events: Array<{
    description: string;
    latitude: number;
    longitude: number;
    severity: string;
    streetName: string;
  }>;
  interactive: boolean;
  region: MapRegion;
  routeCoordinates: MapCoordinate[];
};

function createMapHtml(mapData: EmbeddedMapData) {
  const serializedData = JSON.stringify(mapData).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map { height: 100%; margin: 0; width: 100%; }
      body { background: #121512; }
      .leaflet-container { background: #121512; font-family: Arial, sans-serif; }
      .leaflet-control-attribution {
        background: rgba(9, 11, 10, 0.74) !important;
        color: #dde5dd;
        font-size: 10px;
      }
      .leaflet-control-attribution a { color: #a3e635; }
      .map-marker {
        align-items: center;
        border-radius: 6px;
        border-style: solid;
        border-width: 2px;
        box-sizing: border-box;
        color: #f8faf8;
        display: flex;
        font-size: 14px;
        font-weight: 800;
        height: 28px;
        justify-content: center;
        width: 28px;
      }
      .destination-marker { background: #f43f5e; border-color: #f8faf8; }
      .location-marker {
        background: #38bdf8;
        border: 3px solid #f8faf8;
        border-radius: 50%;
        box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.22);
        box-sizing: border-box;
        height: 18px;
        width: 18px;
      }
      .severity-high { background: rgba(244, 63, 94, 0.92); border-color: #f43f5e; }
      .severity-medium { background: rgba(234, 179, 8, 0.92); border-color: #eab308; }
      .severity-low { background: rgba(34, 197, 94, 0.92); border-color: #22c55e; }
      .leaflet-tooltip { background: #171c17; border-color: #303a30; color: #f8faf8; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      (function () {
        var data = ${serializedData};
        var map = L.map('map', {
          attributionControl: true,
          doubleClickZoom: data.interactive,
          dragging: data.interactive,
          keyboard: false,
          scrollWheelZoom: data.interactive,
          tap: data.interactive,
          touchZoom: data.interactive,
          zoomControl: data.interactive
        });
        var southWest = [
          data.region.latitude - data.region.latitudeDelta / 2,
          data.region.longitude - data.region.longitudeDelta / 2
        ];
        var northEast = [
          data.region.latitude + data.region.latitudeDelta / 2,
          data.region.longitude + data.region.longitudeDelta / 2
        ];

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        map.fitBounds([southWest, northEast], { animate: false, padding: [10, 10] });

        function escapeText(value) {
          return String(value).replace(/[&<>"']/g, function (character) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
          });
        }

        function icon(html, size) {
          return L.divIcon({
            className: '',
            html: html,
            iconAnchor: [size[0] / 2, size[1] / 2],
            iconSize: size
          });
        }

        if (data.routeCoordinates.length >= 2) {
          L.polyline(
            data.routeCoordinates.map(function (point) { return [point.latitude, point.longitude]; }),
            { color: '#15803d', lineCap: 'round', lineJoin: 'round', weight: 6 }
          ).addTo(map);
        }

        if (data.destination) {
          L.marker([data.destination.latitude, data.destination.longitude], {
            icon: icon('<div class="map-marker destination-marker">B</div>', [28, 28])
          }).addTo(map).bindTooltip(escapeText(data.destination.name));
        }

        if (data.currentLocation) {
          L.marker([data.currentLocation.latitude, data.currentLocation.longitude], {
            icon: icon('<div class="location-marker"></div>', [18, 18])
          }).addTo(map);
        }

        data.events.forEach(function (event) {
          var level = event.severity === 'high' ? 'high' : event.severity === 'medium' ? 'medium' : 'low';
          L.marker([event.latitude, event.longitude], {
            icon: icon('<div class="map-marker severity-' + level + '">!</div>', [28, 28])
          }).addTo(map).bindTooltip(escapeText(event.streetName + ' - ' + event.severity));
        });
      })();
    </script>
  </body>
</html>`;
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
    backgroundColor: colors.surface,
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
