import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { COGNITO_REGION, COGNITO_USER_POOL_ID } from '../config/auth';
import {
  getSavedRoutes,
  getUserPreferences,
  updateUserPreferences,
} from '../services/traffiqApi';
import { radius, shadows, spacing, ThemeColors } from '../theme/theme';
import {
  DistanceUnit,
  SavedRouteRecord,
  ThemeMode,
  UserPreferencesRecord,
} from '../types/api';
import AuthScreen from './AuthScreen';

type AccountScreenProps = {
  onBackToDrive: () => void;
  onOpenPipeline: () => void;
};

type PreferenceOption<T extends string> = {
  label: string;
  value: T;
};

const DISTANCE_UNIT_OPTIONS: PreferenceOption<DistanceUnit>[] = [
  { label: 'Kilometers', value: 'km' },
  { label: 'Miles', value: 'mi' },
];

const THEME_MODE_OPTIONS: PreferenceOption<ThemeMode>[] = [
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

function formatDistance(valueKm: number, unit: DistanceUnit | undefined) {
  if (unit === 'mi') {
    return `${Math.round(valueKm * 0.621371 * 100) / 100} mi`;
  }

  return `${valueKm} km`;
}

export default function AccountScreen({
  onBackToDrive,
  onOpenPipeline,
}: AccountScreenProps) {
  const {
    getAccessToken,
    isAuthenticated,
    isRestoringSession,
    session,
    signOut,
  } = useAuth();
  const { mode: localThemeMode, setThemeMode } = useTheme();
  const { styles } = useThemedStyles(createStyles);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteRecord[]>([]);
  const [isSavedRoutesLoading, setIsSavedRoutesLoading] = useState(false);
  const [savedRoutesError, setSavedRoutesError] = useState('');
  const [preferences, setPreferences] = useState<UserPreferencesRecord | null>(null);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  function revealAuthenticationForm() {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 260);
  }

  useEffect(() => {
    async function loadSavedRoutes() {
      if (!isAuthenticated || !session?.tokens.accessToken) {
        setSavedRoutes([]);
        return;
      }

      try {
        setIsSavedRoutesLoading(true);
        setSavedRoutesError('');

        const accessToken = await getAccessToken();

        if (!accessToken) {
          setSavedRoutesError('Your session expired. Please sign in again.');
          return;
        }

        const response = await getSavedRoutes(accessToken);
        setSavedRoutes(response.data);
      } catch {
        setSavedRoutesError('Could not load saved routes.');
      } finally {
        setIsSavedRoutesLoading(false);
      }
    }

    loadSavedRoutes();
  }, [getAccessToken, isAuthenticated, session?.tokens.accessToken]);

  useEffect(() => {
    async function loadPreferences() {
      if (!isAuthenticated || !session?.tokens.accessToken) {
        setPreferences(null);
        return;
      }

      try {
        setIsPreferencesLoading(true);
        setPreferencesError('');

        const accessToken = await getAccessToken();

        if (!accessToken) {
          setPreferencesError('Your session expired. Please sign in again.');
          return;
        }

        const response = await getUserPreferences(accessToken);
        setPreferences(response.data);
        await setThemeMode(response.data.theme_mode);
      } catch {
        setPreferencesError('Could not load preferences.');
      } finally {
        setIsPreferencesLoading(false);
      }
    }

    loadPreferences();
  }, [getAccessToken, isAuthenticated, session?.tokens.accessToken]);

  async function handleDistancePreferenceChange(value: DistanceUnit) {
    if (!preferences || !session?.tokens.accessToken) {
      return;
    }

    const nextPreferences = {
      distance_unit: value,
      preferred_route_type: preferences.preferred_route_type,
      theme_mode: preferences.theme_mode,
    };

    try {
      setIsPreferencesSaving(true);
      setPreferencesError('');

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setPreferencesError('Your session expired. Please sign in again.');
        return;
      }

      const response = await updateUserPreferences(nextPreferences, accessToken);
      setPreferences(response.data);
    } catch {
      setPreferencesError('Could not save preferences.');
    } finally {
      setIsPreferencesSaving(false);
    }
  }

  async function handleThemePreferenceChange(value: ThemeMode) {
    await setThemeMode(value);

    if (!preferences || !session?.tokens.accessToken) {
      return;
    }

    const nextPreferences = {
      distance_unit: preferences.distance_unit,
      preferred_route_type: preferences.preferred_route_type,
      theme_mode: value,
    };

    try {
      setIsPreferencesSaving(true);
      setPreferencesError('');

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setPreferencesError('Your session expired. Theme changed locally only.');
        return;
      }

      const response = await updateUserPreferences(nextPreferences, accessToken);
      setPreferences(response.data);
    } catch {
      setPreferencesError('Theme changed locally, but could not be saved to account.');
    } finally {
      setIsPreferencesSaving(false);
    }
  }

  function renderPreferenceOptions<T extends string>(
    label: string,
    options: PreferenceOption<T>[],
    selectedValue: T | undefined,
    onSelect: (value: T) => void
  ) {
    return (
      <View style={styles.preferenceGroup}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <View style={styles.preferenceOptions}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                disabled={isPreferencesSaving}
                key={option.value}
                onPress={() => onSelect(option.value)}
                style={[
                  styles.preferenceChip,
                  isSelected ? styles.preferenceChipSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.preferenceChipText,
                    isSelected ? styles.preferenceChipTextSelected : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (isRestoringSession) {
    return <LoadingState message="Restoring account session..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Personal area</Text>
            <Text style={styles.title}>Account</Text>
          </View>

          <Pressable onPress={onBackToDrive} style={styles.backButton}>
            <Text style={styles.backButtonText}>Drive</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Open admin pipeline status"
          onPress={onOpenPipeline}
          style={styles.adminCard}
        >
          <View style={styles.adminTextBlock}>
            <Text style={styles.cardLabel}>Admin</Text>
            <Text style={styles.adminTitle}>Pipeline status</Text>
            <Text style={styles.cardText}>
              View latest ETL run status, records loaded, and data quality checks.
            </Text>
          </View>
          <Text style={styles.adminAction}>Open</Text>
        </Pressable>

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

            <View style={styles.preferencesCard}>
              <Text style={styles.cardLabel}>Preferences</Text>
              <Text style={styles.preferencesTitle}>Personal settings</Text>
              <Text style={styles.cardText}>
                Distance unit and appearance mode are stored per Cognito user.
                System follows your phone setting, while Dark and Light override it.
              </Text>

              {isPreferencesLoading ? (
                <Text style={styles.cardText}>Loading preferences...</Text>
              ) : preferences ? (
                <>
                  {renderPreferenceOptions(
                    'Distance unit',
                    DISTANCE_UNIT_OPTIONS,
                    preferences.distance_unit,
                    (value) => handleDistancePreferenceChange(value)
                  )}
                  {renderPreferenceOptions(
                    'Appearance',
                    THEME_MODE_OPTIONS,
                    preferences.theme_mode,
                    (value) => handleThemePreferenceChange(value)
                  )}
                  {isPreferencesSaving ? (
                    <Text style={styles.cardText}>Saving preferences...</Text>
                  ) : null}
                </>
              ) : null}

              {preferencesError ? (
                <Text style={styles.errorText}>{preferencesError}</Text>
              ) : null}
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
                <EmptyState
                  actionLabel="Open Drive"
                  message="Preview a Suceava route and save it to your account."
                  onAction={onBackToDrive}
                  title="No saved routes yet"
                />
              ) : (
                savedRoutes.map((route) => (
                  <View key={route.saved_route_id} style={styles.savedRouteRow}>
                    <Text style={styles.savedRouteName}>{route.route_name}</Text>
                    <Text style={styles.savedRouteMeta}>
                      {formatDistance(route.distance_km, preferences?.distance_unit)} -{' '}
                      {route.duration_minutes} min - {route.provider}
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

            <View style={styles.preferencesCard}>
              <Text style={styles.cardLabel}>Appearance</Text>
              <Text style={styles.preferencesTitle}>Display mode</Text>
              <Text style={styles.cardText}>
                Guests can change the theme on this phone. Sign in to sync the
                preference to your account.
              </Text>
              {renderPreferenceOptions(
                'Theme',
                THEME_MODE_OPTIONS,
                localThemeMode,
                (value) => handleThemePreferenceChange(value)
              )}
            </View>

            <AuthScreen onInputFocus={revealAuthenticationForm} />
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  adminCard: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    padding: 16,
  },
  adminTextBlock: {
    flex: 1,
    gap: 5,
  },
  adminTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  adminAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
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
  preferencesCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  preferencesTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginTop: -4,
  },
  preferenceGroup: {
    gap: 9,
  },
  preferenceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  preferenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  preferenceChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  preferenceChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  preferenceChipTextSelected: {
    color: colors.primaryText,
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
}
