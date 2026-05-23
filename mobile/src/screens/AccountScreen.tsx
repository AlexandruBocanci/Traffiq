import {
  useEffect,
  useState,
} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { COGNITO_REGION, COGNITO_USER_POOL_ID } from '../config/auth';
import { getSavedRoutes } from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';
import { SavedRouteRecord } from '../types/api';
import AuthScreen from './AuthScreen';

type AccountScreenProps = {
  onBackToDrive: () => void;
};

export default function AccountScreen({ onBackToDrive }: AccountScreenProps) {
  const { isAuthenticated, isRestoringSession, session, signOut } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteRecord[]>([]);
  const [isSavedRoutesLoading, setIsSavedRoutesLoading] = useState(false);
  const [savedRoutesError, setSavedRoutesError] = useState('');

  useEffect(() => {
    async function loadSavedRoutes() {
      if (!isAuthenticated || !session?.tokens.accessToken) {
        setSavedRoutes([]);
        return;
      }

      try {
        setIsSavedRoutesLoading(true);
        setSavedRoutesError('');

        const response = await getSavedRoutes(session.tokens.accessToken);
        setSavedRoutes(response.data);
      } catch {
        setSavedRoutesError('Could not load saved routes.');
      } finally {
        setIsSavedRoutesLoading(false);
      }
    }

    loadSavedRoutes();
  }, [isAuthenticated, session?.tokens.accessToken]);

  if (isRestoringSession) {
    return <LoadingState message="Restoring account session..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Personal area</Text>
            <Text style={styles.title}>Account</Text>
          </View>

          <Pressable onPress={onBackToDrive} style={styles.backButton}>
            <Text style={styles.backButtonText}>Drive</Text>
          </Pressable>
        </View>

        {isAuthenticated && session ? (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.cardLabel}>Signed in as</Text>
              <Text style={styles.email}>{session.user.email}</Text>
              <Text style={styles.cardText}>
                Personal features will use this Cognito identity for saved routes, ride
                history, and preferences.
              </Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>Amazon Cognito</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Region</Text>
                <Text style={styles.detailValue}>{COGNITO_REGION}</Text>
              </View>
              <View style={styles.detailCardFull}>
                <Text style={styles.detailLabel}>User Pool</Text>
                <Text style={styles.detailValue}>{COGNITO_USER_POOL_ID}</Text>
              </View>
            </View>

            <View style={styles.savedRoutesCard}>
              <View style={styles.savedRoutesHeader}>
                <View>
                  <Text style={styles.cardLabel}>Saved routes</Text>
                  <Text style={styles.savedRoutesTitle}>Personal route list</Text>
                </View>
                <Text style={styles.savedRoutesCount}>{savedRoutes.length}</Text>
              </View>

              {isSavedRoutesLoading ? (
                <Text style={styles.cardText}>Loading saved routes...</Text>
              ) : savedRoutesError ? (
                <Text style={styles.errorText}>{savedRoutesError}</Text>
              ) : savedRoutes.length === 0 ? (
                <Text style={styles.cardText}>
                  Save a route from Drive to see it here.
                </Text>
              ) : (
                savedRoutes.map((route) => (
                  <View key={route.saved_route_id} style={styles.savedRouteRow}>
                    <Text style={styles.savedRouteName}>{route.route_name}</Text>
                    <Text style={styles.savedRouteMeta}>
                      {route.distance_km} km - {route.duration_minutes} min - {route.provider}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <Pressable onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.guestCard}>
              <Text style={styles.cardLabel}>Guest access active</Text>
              <Text style={styles.guestTitle}>Public traffic features stay open.</Text>
              <Text style={styles.cardText}>
                Sign in only when you need personal data such as saved routes, ride
                history, and user preferences.
              </Text>
            </View>

            <AuthScreen />
          </>
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
  guestCard: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  profileCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 9,
    padding: 18,
  },
  cardLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  guestTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  email: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 15,
    width: '48%',
  },
  detailCardFull: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 15,
    width: '100%',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 7,
  },
  savedRoutesCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  savedRoutesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savedRoutesTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  savedRoutesCount: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  savedRouteRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  savedRouteName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  savedRouteMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '800',
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.red,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  signOutButtonText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
