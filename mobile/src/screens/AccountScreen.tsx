import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import {
  deleteSavedRoute,
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
  onUseSavedRoute: (route: SavedRouteRecord) => void;
};

type PreferenceOption<T extends string> = {
  label: string;
  value: T;
};

const DISTANCE_UNIT_OPTIONS: PreferenceOption<DistanceUnit>[] = [
  { label: 'Kilometri', value: 'km' },
  { label: 'Mile', value: 'mi' },
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

function formatRouteName(value: string) {
  return value.replace(/\s+to\s+/i, ' către ');
}

export default function AccountScreen({
  onBackToDrive,
  onOpenPipeline,
  onUseSavedRoute,
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
  const [deletingSavedRouteId, setDeletingSavedRouteId] = useState<number | null>(null);
  const [savedRoutePendingDelete, setSavedRoutePendingDelete] =
    useState<SavedRouteRecord | null>(null);
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
          setSavedRoutesError('Sesiunea a expirat. Autentifică-te din nou.');
          return;
        }

        const response = await getSavedRoutes(accessToken);
        setSavedRoutes(response.data);
      } catch {
        setSavedRoutesError('Rutele salvate nu au putut fi încărcate.');
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
          setPreferencesError('Sesiunea a expirat. Autentifică-te din nou.');
          return;
        }

        const response = await getUserPreferences(accessToken);
        setPreferences(response.data);
        await setThemeMode(response.data.theme_mode);
      } catch {
        setPreferencesError('Preferințele nu au putut fi încărcate.');
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
        setPreferencesError('Sesiunea a expirat. Autentifică-te din nou.');
        return;
      }

      const response = await updateUserPreferences(nextPreferences, accessToken);
      setPreferences(response.data);
    } catch {
      setPreferencesError('Preferințele nu au putut fi salvate.');
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
        setPreferencesError('Sesiunea a expirat. Tema a fost schimbată doar local.');
        return;
      }

      const response = await updateUserPreferences(nextPreferences, accessToken);
      setPreferences(response.data);
    } catch {
      setPreferencesError('Tema a fost schimbată local, dar nu a putut fi salvată în cont.');
    } finally {
      setIsPreferencesSaving(false);
    }
  }

  function requestDeleteSavedRoute(route: SavedRouteRecord) {
    if (!session?.tokens.accessToken) {
      setSavedRoutesError('Sesiunea a expirat. Autentifică-te din nou.');
      return;
    }

    setSavedRoutePendingDelete(route);
  }

  async function confirmDeleteSavedRoute() {
    if (!savedRoutePendingDelete) {
      return;
    }

    try {
      setDeletingSavedRouteId(savedRoutePendingDelete.saved_route_id);
      setSavedRoutesError('');

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setSavedRoutesError('Sesiunea a expirat. Autentifică-te din nou.');
        return;
      }

      await deleteSavedRoute(savedRoutePendingDelete.saved_route_id, accessToken);
      setSavedRoutes((currentRoutes) =>
        currentRoutes.filter(
          (currentRoute) =>
            currentRoute.saved_route_id !== savedRoutePendingDelete.saved_route_id
        )
      );
      setSavedRoutePendingDelete(null);
    } catch {
      setSavedRoutesError('Ruta nu a putut fi ștearsă. Încearcă din nou.');
    } finally {
      setDeletingSavedRouteId(null);
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
    return <LoadingState message="Se verifică sesiunea..." />;
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
            <Text style={styles.eyebrow}>Cont personal</Text>
            <Text style={styles.title}>Cont</Text>
          </View>

          <Pressable onPress={onBackToDrive} style={styles.backButton}>
            <Text style={styles.backButtonText}>Acasă</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Deschide statusul pipeline-ului"
          onPress={onOpenPipeline}
          style={styles.adminCard}
        >
          <View style={styles.adminTextBlock}>
            <Text style={styles.cardLabel}>Administrare</Text>
            <Text style={styles.adminTitle}>Flux de date</Text>
            <Text style={styles.cardText}>
              Verifică rapid dacă fluxul de date rulează corect.
            </Text>
          </View>
          <Text style={styles.adminAction}>Deschide</Text>
        </Pressable>

        {isAuthenticated && session ? (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.cardLabel}>Autentificat ca</Text>
              <Text style={styles.email}>{session.user.email}</Text>
              <Text style={styles.cardText}>
                Rutele, istoricul și setările tale sunt salvate pe acest cont.
              </Text>
            </View>

            <View style={styles.preferencesCard}>
              <Text style={styles.cardLabel}>Setări</Text>
              <Text style={styles.preferencesTitle}>Preferințele tale</Text>
              <Text style={styles.cardText}>
                Alege cum vrei să fie afișate distanțele și tema aplicației.
              </Text>

              {isPreferencesLoading ? (
                <Text style={styles.cardText}>Se încarcă preferințele...</Text>
              ) : preferences ? (
                <>
                  {renderPreferenceOptions(
                    'Distanțe',
                    DISTANCE_UNIT_OPTIONS,
                    preferences.distance_unit,
                    (value) => handleDistancePreferenceChange(value)
                  )}
                  {renderPreferenceOptions(
                    'Temă',
                    THEME_MODE_OPTIONS,
                    preferences.theme_mode,
                    (value) => handleThemePreferenceChange(value)
                  )}
                  {isPreferencesSaving ? (
                    <Text style={styles.cardText}>Se salvează preferințele...</Text>
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
                  <Text style={styles.cardLabel}>Rute salvate</Text>
                  <Text style={styles.savedRoutesTitle}>Destinații rapide</Text>
                </View>
                <Text style={styles.savedRoutesCount}>{savedRoutes.length}</Text>
              </View>

              {isSavedRoutesLoading ? (
                <Text style={styles.cardText}>Se încarcă rutele...</Text>
              ) : savedRoutesError ? (
                <Text style={styles.errorText}>{savedRoutesError}</Text>
              ) : savedRoutes.length === 0 ? (
                <EmptyState
                  actionLabel="Deschide harta"
                  message="Calculează o rută în Suceava și salveaz-o în cont."
                  onAction={onBackToDrive}
                  title="Nu ai rute salvate"
                />
              ) : (
                savedRoutes.map((route) => (
                  <View key={route.saved_route_id} style={styles.savedRouteRow}>
                    <View style={styles.savedRouteTextBlock}>
                      <Text style={styles.savedRouteName}>
                        {formatRouteName(route.route_name)}
                      </Text>
                      <Text style={styles.savedRouteMeta}>
                        {formatDistance(route.distance_km, preferences?.distance_unit)} -{' '}
                        {route.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.savedRouteActions}>
                      <Pressable
                        accessibilityLabel={`Folosește ruta salvată ${route.route_name}`}
                        onPress={() => onUseSavedRoute(route)}
                        style={styles.savedRoutePrimaryAction}
                      >
                        <Text style={styles.savedRoutePrimaryActionText}>Pornește</Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Șterge ruta salvată ${route.route_name}`}
                        disabled={deletingSavedRouteId === route.saved_route_id}
                        onPress={() => requestDeleteSavedRoute(route)}
                        style={[
                          styles.savedRouteDeleteAction,
                          deletingSavedRouteId === route.saved_route_id &&
                            styles.actionDisabled,
                        ]}
                      >
                        <Text style={styles.savedRouteDeleteActionText}>
                          {deletingSavedRouteId === route.saved_route_id ? '...' : 'Șterge'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            <Pressable onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutButtonText}>Deconectare</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.guestCard}>
              <Text style={styles.cardLabel}>Mod invitat</Text>
              <Text style={styles.guestTitle}>Funcțiile publice rămân disponibile.</Text>
              <Text style={styles.cardText}>
                Autentificarea este necesară doar pentru rute salvate, istoric și
                preferințe personale.
              </Text>
            </View>

            <View style={styles.preferencesCard}>
              <Text style={styles.cardLabel}>Setări</Text>
              <Text style={styles.preferencesTitle}>Tema aplicației</Text>
              <Text style={styles.cardText}>
                Schimbarea se aplică pe acest telefon. Autentifică-te ca să fie
                salvată în cont.
              </Text>
              {renderPreferenceOptions(
                'Temă',
                THEME_MODE_OPTIONS,
                localThemeMode,
                (value) => handleThemePreferenceChange(value)
              )}
            </View>

            <AuthScreen onInputFocus={revealAuthenticationForm} />
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={!!savedRoutePendingDelete}
        onRequestClose={() => {
          if (deletingSavedRouteId === null) {
            setSavedRoutePendingDelete(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Închide confirmarea de ștergere"
            disabled={deletingSavedRouteId !== null}
            onPress={() => setSavedRoutePendingDelete(null)}
            style={styles.modalDismissArea}
          />
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogEyebrow}>Ștergere rută</Text>
            <Text style={styles.deleteDialogTitle}>Elimini această rută?</Text>
            <Text style={styles.deleteDialogText}>
              {savedRoutePendingDelete
                ? `${formatRouteName(
                    savedRoutePendingDelete.route_name
                  )} va fi ștearsă din rutele salvate.`
                : ''}
            </Text>

            <View style={styles.deleteDialogActions}>
              <Pressable
                disabled={deletingSavedRouteId !== null}
                onPress={() => setSavedRoutePendingDelete(null)}
                style={[
                  styles.cancelDialogButton,
                  deletingSavedRouteId !== null && styles.actionDisabled,
                ]}
              >
                <Text style={styles.cancelDialogButtonText}>Anulează</Text>
              </Pressable>
              <Pressable
                disabled={deletingSavedRouteId !== null}
                onPress={confirmDeleteSavedRoute}
                style={[
                  styles.confirmDeleteButton,
                  deletingSavedRouteId !== null && styles.actionDisabled,
                ]}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {deletingSavedRouteId !== null ? 'Se șterge...' : 'Șterge'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 13,
  },
  savedRouteTextBlock: {
    gap: 5,
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
  savedRouteActions: {
    flexDirection: 'row',
    gap: 9,
  },
  savedRoutePrimaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedRoutePrimaryActionText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  savedRouteDeleteAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.red,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  savedRouteDeleteActionText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionDisabled: {
    opacity: 0.55,
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
