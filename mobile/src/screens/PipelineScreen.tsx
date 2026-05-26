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
import { getHealthStatus, getPipelineStatus } from '../services/traffiqApi';
import { colors, radius, shadows, spacing } from '../theme/theme';
import { PipelineStatusResponse } from '../types/api';

const PIPELINE_STEPS = [
  {
    title: 'Extract',
    description: 'Traffic CSV ingestion, Open-Meteo weather ingestion, and controlled Suceava seed data.',
  },
  {
    title: 'Bronze',
    description: 'Raw or near-raw records land in PostgreSQL with minimal shaping.',
  },
  {
    title: 'Silver',
    description: 'Data is cleaned, standardized, linked to Suceava streets, and prepared for analytics.',
  },
  {
    title: 'Gold',
    description: 'Business-level route, congestion, weather, and hourly metrics are calculated.',
  },
  {
    title: 'Serving',
    description: 'API-ready SQL views expose stable response shapes to FastAPI.',
  },
  {
    title: 'FastAPI',
    description: 'The cloud backend reads RDS and serves mobile and demo endpoints.',
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
      setErrorMessage('Pipeline status is unavailable. Check the cloud API and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPipelineContext();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading pipeline status..." />;
  }

  if (errorMessage) {
    return (
      <ErrorState
        actionLabel="Try again"
        label="Admin status unavailable"
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
          message="No ETL metadata was returned by the backend yet."
          title="No pipeline status available"
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
            <Text style={styles.eyebrow}>Admin layer</Text>
            <Text style={styles.title}>Pipeline</Text>
          </View>

          {onBackToDrive ? (
            <Pressable onPress={onBackToDrive} style={styles.backButton}>
              <Text style={styles.backButtonText}>Drive</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.subtitle}>
          Admin/demo status surface for the Traffiq ETL pipeline and data quality
          checks.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operational status</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>API</Text>
              <Text style={styles.metricValue}>{metrics.apiStatus}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pipeline</Text>
              <Text style={styles.metricValue}>{latestRun?.status ?? 'No run'}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Extracted</Text>
              <Text style={styles.metricValue}>{latestRun?.records_extracted ?? 0}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Loaded</Text>
              <Text style={styles.metricValue}>{latestRun?.records_loaded ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest pipeline run</Text>

          {latestRun ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{latestRun.pipeline_name}</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Run ID</Text>
                  <Text style={styles.detailValue}>{latestRun.run_id}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{latestRun.status}</Text>
                </View>
                <View style={styles.detailItemFull}>
                  <Text style={styles.detailLabel}>Started</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(latestRun.started_at)}
                  </Text>
                </View>
                <View style={styles.detailItemFull}>
                  <Text style={styles.detailLabel}>Finished</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(latestRun.finished_at)}
                  </Text>
                </View>
              </View>

              {latestRun.error_message ? (
                <Text style={styles.errorText}>{latestRun.error_message}</Text>
              ) : (
                <Text style={styles.cardText}>No pipeline error recorded.</Text>
              )}
            </View>
          ) : (
            <EmptyState
              message="Run the ETL pipeline once so etl_meta.pipeline_runs has a latest run."
              title="No ETL run recorded"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data quality checks</Text>

          {qualityChecks.length === 0 ? (
            <EmptyState
              message="The latest run has no linked data quality checks."
              title="No quality checks found"
            />
          ) : (
            qualityChecks.map((check) => (
              <View key={check.check_id} style={styles.card}>
                <View style={styles.checkHeader}>
                  <Text style={styles.cardTitle}>
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
                    {check.check_status}
                  </Text>
                </View>
                <Text style={styles.cardText}>
                  Affected records: {check.affected_records}
                </Text>
                {check.details ? (
                  <Text style={styles.cardText}>{check.details}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline architecture</Text>

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
    return 'Not finished';
  }

  return new Date(value).toLocaleString();
}

function formatCheckName(value: string) {
  return value.replace(/_/g, ' ');
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
