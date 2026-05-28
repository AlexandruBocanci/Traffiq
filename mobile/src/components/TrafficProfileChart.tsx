import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemedStyles } from '../context/ThemeContext';
import { radius, shadows, ThemeColors } from '../theme/theme';
import { TrafficProfileRecord, TrafficProfileResponse } from '../types/api';

const DAY_LABELS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const CHART_HEIGHT = 132;
const MIN_BAR_HEIGHT = 10;

type TrafficProfileChartProps = {
  profile: TrafficProfileResponse | null;
};

function formatHour(hour: number) {
  return hour.toString().padStart(2, '0');
}

function recordsByHour(records: TrafficProfileRecord[], weekdayIndex: number) {
  const values = new Map<number, TrafficProfileRecord>();

  records
    .filter((record) => record.weekday_index === weekdayIndex)
    .forEach((record) => values.set(record.hour_of_day, record));

  return values;
}

export default function TrafficProfileChart({ profile }: TrafficProfileChartProps) {
  const { styles } = useThemedStyles(createStyles);
  const initialWeekdayIndex = profile?.current_weekday_index ?? new Date().getDay() - 1;
  const normalizedInitialWeekday =
    initialWeekdayIndex < 0 ? 6 : Math.min(initialWeekdayIndex, 6);
  const [selectedWeekdayIndex, setSelectedWeekdayIndex] = useState(
    normalizedInitialWeekday
  );
  const animatedHeights = useRef(
    HOURS.map(() => new Animated.Value(MIN_BAR_HEIGHT))
  ).current;

  useEffect(() => {
    if (profile) {
      setSelectedWeekdayIndex(profile.current_weekday_index);
    }
  }, [profile?.current_weekday_index]);

  const selectedRows = useMemo(() => {
    if (!profile) {
      return new Map<number, TrafficProfileRecord>();
    }

    return recordsByHour(profile.data, selectedWeekdayIndex);
  }, [profile, selectedWeekdayIndex]);

  const maxScore = useMemo(() => {
    const scores = HOURS.map((hour) => selectedRows.get(hour)?.traffic_score ?? 0);
    return Math.max(100, ...scores);
  }, [selectedRows]);

  useEffect(() => {
    const animations = HOURS.map((hour) => {
      const score = selectedRows.get(hour)?.traffic_score ?? 0;
      const targetHeight =
        MIN_BAR_HEIGHT + (Math.max(0, Math.min(score, maxScore)) / maxScore) *
          (CHART_HEIGHT - MIN_BAR_HEIGHT);

      return Animated.timing(animatedHeights[hour], {
        duration: 420,
        easing: Easing.out(Easing.cubic),
        toValue: targetHeight,
        useNativeDriver: false,
      });
    });

    Animated.stagger(10, animations).start();
  }, [animatedHeights, maxScore, selectedRows]);

  if (!profile || profile.data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Profil trafic</Text>
        <Text style={styles.emptyTitle}>Profilul orar nu este disponibil</Text>
        <Text style={styles.emptyText}>
          Datele pentru distribuția pe ore nu au fost încă încărcate.
        </Text>
      </View>
    );
  }

  const currentHour = profile.current_hour;
  const isCurrentDay = selectedWeekdayIndex === profile.current_weekday_index;
  const selectedDayLabel = DAY_LABELS[selectedWeekdayIndex];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Profil trafic</Text>
          <Text style={styles.title}>{selectedDayLabel}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {DAY_LABELS.map((dayLabel, index) => {
          const isSelected = selectedWeekdayIndex === index;

          return (
            <Pressable
              accessibilityLabel={`Afișează profilul de trafic pentru ${dayLabel}`}
              key={dayLabel}
              onPress={() => setSelectedWeekdayIndex(index)}
              style={[styles.dayButton, isSelected && styles.dayButtonActive]}
            >
              <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>
                {dayLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.chartFrame}>
        <View style={styles.chart}>
          {HOURS.map((hour) => {
            const row = selectedRows.get(hour);
            const isCurrentHour = isCurrentDay && hour === currentHour;
            const shouldShowHourLabel =
              hour === 0 || hour === 6 || hour === 12 || hour === 18 || hour === 23;

            return (
              <View key={hour} style={styles.barSlot}>
                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.bar,
                      isCurrentHour ? styles.currentBar : styles.standardBar,
                      { height: animatedHeights[hour] },
                    ]}
                  />
                </View>
                <Text style={[styles.hourLabel, isCurrentHour && styles.currentHourLabel]}>
                  {isCurrentHour ? formatHour(hour) : shouldShowHourLabel ? formatHour(hour) : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.scopeText}>
        Estimare pe coridoarele principale din Suceava. Bara evidențiată
        indică ora curentă pentru ziua selectată.
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
  },
  daySelector: {
    gap: 8,
    paddingRight: 4,
  },
  dayButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 52,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  dayButtonTextActive: {
    color: colors.primaryText,
  },
  chartFrame: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 10,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: CHART_HEIGHT + 34,
    justifyContent: 'space-between',
  },
  barSlot: {
    alignItems: 'center',
    flex: 1,
    minWidth: 10,
  },
  barTrack: {
    alignItems: 'center',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    borderRadius: 999,
    width: 7,
  },
  standardBar: {
    backgroundColor: 'rgba(34, 197, 94, 0.52)',
  },
  currentBar: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(248, 250, 248, 0.7)',
    borderWidth: 1,
    width: 9,
  },
  hourLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    height: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  currentHourLabel: {
    color: colors.primary,
  },
  scopeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  });
}
