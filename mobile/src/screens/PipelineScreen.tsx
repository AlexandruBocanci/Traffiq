import { useEffect, useState } from 'react';
import {
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
import { useThemedStyles } from '../context/ThemeContext';
import { getHealthStatus, getPipelineStatus } from '../services/traffiqApi';
import { radius, shadows, spacing, ThemeColors } from '../theme/theme';
import { PipelineStatusResponse } from '../types/api';

const PIPELINE_STEPS = [
  {
    title: 'Extragere',
    description: 'Se cer date TomTom despre fluxul de trafic și incidente, plus vreme Open-Meteo pentru Suceava.',
  },
  {
    title: 'Bronze',
    description: 'Datele brute sau aproape brute ajung în PostgreSQL cu transformări minime.',
  },
  {
    title: 'Silver',
    description: 'Datele sunt curățate, standardizate, legate de străzile din Suceava și pregătite pentru analiză.',
  },
  {
    title: 'Gold',
    description: 'Încetinirea pe coridoarele monitorizate este calculată față de viteza liberă TomTom.',
  },
  {
    title: 'Serving',
    description: 'View-urile SQL pregătite pentru API oferă răspunsuri stabile către FastAPI.',
  },
  {
    title: 'FastAPI',
    description: 'Backend-ul cloud citește din RDS și servește endpointurile pentru aplicație și demo.',
  },
];

type PipelineMetrics = {
  apiStatus: string;
  pipelineStatus: PipelineStatusResponse;
};

type PipelineScreenProps = {
  onBackToDrive?: () => void;
};

export default function PipelineScreen({ onBackToDrive }: PipelineScreenProps) {
  const { styles } = useThemedStyles(createStyles);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadPipelineContext() {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const [healthResponse, pipelineStatusResponse] = await Promise.all([
        getHealthStatus(),
        getPipelineStatus(),
      ]);

      setMetrics({
        apiStatus: healthResponse.status,
        pipelineStatus: pipelineStatusResponse,
      });
    } catch {
      setErrorMessage('Statusul pipeline-ului nu este disponibil. Verifică API-ul cloud și încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPipelineContext();
  }, []);

  if (isLoading) {
    return <LoadingState message="Se încarcă statusul pipeline-ului..." />;
  }

  if (errorMessage) {
    return (
      <ErrorState
        actionLabel="Încearcă din nou"
        label="Flux de date indisponibil"
        message={errorMessage}
        onAction={loadPipelineContext}
        title="Pipeline"
      />
    );
  }

  if (!metrics) {
    return (
      <View style={styles.emptyStateWrapper}>
        <EmptyState
          message="Backend-ul nu a returnat încă metadate ETL."
          title="Flux de date indisponibil"
        />
      </View>
    );
  }

  const latestRun = metrics.pipelineStatus.latest_run;
  const qualityChecks = metrics.pipelineStatus.data_quality_checks;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Administrare</Text>
            <Text style={styles.title}>Pipeline</Text>
          </View>

          {onBackToDrive ? (
            <Pressable onPress={onBackToDrive} style={styles.backButton}>
              <Text style={styles.backButtonText}>Acasă</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.subtitle}>
          Ecran admin/demo pentru pipeline-ul ETL Traffiq și verificările de
          calitate a datelor.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stare operațională</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>API</Text>
              <Text style={styles.metricValue}>{metrics.apiStatus}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pipeline</Text>
              <Text style={styles.metricValue}>
                {latestRun ? formatPipelineRunStatus(latestRun.status) : 'Fără rulare'}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Extrase</Text>
              <Text style={styles.metricValue}>{latestRun?.records_extracted ?? 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Încărcate</Text>
              <Text style={styles.metricValue}>{latestRun?.records_loaded ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ultima rulare pipeline</Text>

          {latestRun ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{latestRun.pipeline_name}</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ID rulare</Text>
                  <Text style={styles.detailValue}>{latestRun.run_id}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {formatPipelineRunStatus(latestRun.status)}
                  </Text>
                </View>
                <View style={styles.detailItemFull}>
                  <Text style={styles.detailLabel}>Pornit</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(latestRun.started_at)}
                  </Text>
                </View>
                <View style={styles.detailItemFull}>
                  <Text style={styles.detailLabel}>Finalizat</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(latestRun.finished_at)}
                  </Text>
                </View>
              </View>

              {latestRun.error_message ? (
                <Text style={styles.errorText}>{latestRun.error_message}</Text>
              ) : (
                <Text style={styles.cardText}>Nu există eroare înregistrată pentru pipeline.</Text>
              )}
            </View>
          ) : (
            <EmptyState
              message="Rulează pipeline-ul ETL o dată ca etl_meta.pipeline_runs să aibă o rulare recentă."
              title="Nu există rulare ETL"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificări calitate date</Text>

          {qualityChecks.length === 0 ? (
            <EmptyState
              message="Ultima rulare nu are verificări de calitate asociate."
              title="Nu există verificări"
            />
          ) : (
            qualityChecks.map((check) => (
              <View key={check.check_id} style={styles.card}>
                <View style={styles.checkHeader}>
                  <Text style={[styles.cardTitle, styles.checkTitle]}>
                    {formatCheckName(check.check_name)}
                  </Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      check.check_status === 'passed'
                        ? styles.statusBadgePassed
                        : styles.statusBadgeFailed,
                    ]}
                  >
                    {formatCheckStatus(check.check_status)}
                  </Text>
                </View>
                <Text style={styles.cardText}>
                  Înregistrări afectate: {check.affected_records}
                </Text>
                {check.details ? (
                  <Text style={styles.cardText}>{formatCheckDetails(check.details)}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arhitectură pipeline</Text>

          {PIPELINE_STEPS.map((step) => (
            <View key={step.title} style={styles.card}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardText}>{step.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Neîncheiat';
  }

  return new Date(value).toLocaleString();
}

function formatCheckName(value: string) {
  const knownChecks: Record<string, string> = {
    events_suceava_coordinates_valid: 'Coordonate valide pentru alertele din Suceava',
    real_source_serving_snapshot_ready: 'Snapshot real pregătit pentru aplicație',
    tomtom_flow_corridors_complete: 'Coridoare TomTom complete',
    tomtom_incidents_current_snapshot: 'Snapshot curent de incidente TomTom',
    traffic_raw_not_empty: 'Date brute de trafic disponibile',
    traffic_transform_removed_invalid_rows: 'Rânduri invalide eliminate din trafic',
    weather_raw_not_empty: 'Date brute meteo disponibile',
    weather_transform_removed_invalid_rows: 'Rânduri meteo invalide eliminate',
  };

  if (knownChecks[value]) {
    return knownChecks[value];
  }

  return value.replace(/_/g, ' ');
}

function formatCheckDetails(value: string) {
  if (value.includes('configured Suceava corridors returned valid flow data')) {
    return value.replace(
      'configured Suceava corridors returned valid flow data.',
      'coridoare configurate din Suceava au returnat date valide de trafic.'
    );
  }

  if (value.includes('current TomTom incidents normalized for the Suceava bounding area')) {
    return value.replace(
      'current TomTom incidents normalized for the Suceava bounding area.',
      'incidente TomTom curente normalizate pentru zona Suceava.'
    );
  }

  if (value === 'Gold traffic snapshot and Open-Meteo current weather snapshot are available.') {
    return 'Snapshot-ul Gold de trafic și snapshot-ul meteo Open-Meteo sunt disponibile.';
  }

  if (value === 'Events must have allowed type/severity and coordinates inside Suceava bounds.') {
    return 'Alertele trebuie să aibă tip/severitate acceptate și coordonate în zona Suceava.';
  }

  return value;
}

function formatPipelineRunStatus(value: string) {
  if (value === 'success') {
    return 'Reușit';
  }

  if (value === 'failed') {
    return 'Eșuat';
  }

  if (value === 'running') {
    return 'În rulare';
  }

  return value;
}

function formatCheckStatus(value: string) {
  if (value === 'passed') {
    return 'OK';
  }

  if (value === 'failed') {
    return 'Eroare';
  }

  return value;
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
    gap: 22,
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    ...shadows.card,
    width: '48%',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    width: '48%',
  },
  detailItemFull: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
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
    marginTop: 6,
  },
  checkHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  checkTitle: {
    flex: 1,
    flexShrink: 1,
    maxWidth: '72%',
  },
  statusBadge: {
    borderRadius: radius.md,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
    textTransform: 'uppercase',
  },
  statusBadgePassed: {
    backgroundColor: colors.primary,
    color: colors.primaryText,
  },
  statusBadgeFailed: {
    backgroundColor: colors.red,
    color: colors.text,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  emptyStateWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  });
}
