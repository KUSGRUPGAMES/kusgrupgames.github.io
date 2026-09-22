/** Günün altı vakti — şartname §14. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';
import { Row, Text, Divider } from '@/ui';
import { formatHM } from '../calc';
import { PRAYER_KEYS, type PrayerKey } from '../methods';
import type { DaySchedule } from '../schedule';

const LABEL_KEY: Record<PrayerKey, 'prayer.fajr' | 'prayer.sunrise' | 'prayer.dhuhr' | 'prayer.asr' | 'prayer.maghrib' | 'prayer.isha'> = {
  fajr: 'prayer.fajr', sunrise: 'prayer.sunrise', dhuhr: 'prayer.dhuhr',
  asr: 'prayer.asr', maghrib: 'prayer.maghrib', isha: 'prayer.isha',
};

const SHORT_KEY: Record<PrayerKey, StringKey> = {
  fajr: 'prayer.fajrShort', sunrise: 'prayer.sunriseShort', dhuhr: 'prayer.dhuhrShort',
  asr: 'prayer.asrShort', maghrib: 'prayer.maghribShort', isha: 'prayer.ishaShort',
};

export function usePrayerLabel(): (key: PrayerKey) => string {
  const t = useT();
  return (key) => t(LABEL_KEY[key]);
}

/**
 * Aylık takvimin dar sütunları için kısa ad.
 *
 * Eskiden uzun ad `slice(0, 3)` ile kesiliyordu. Türkçede "Güneş" → "Gün"
 * olup gün numarası sütunuyla karışıyordu; Arapçada sözcük ortadan
 * bölünüyordu ("الشروق" → "الش"). Kısaltma artık her dilde ayrı yazılır.
 */
export function usePrayerShortLabel(): (key: PrayerKey) => string {
  const t = useT();
  return (key) => t(SHORT_KEY[key]);
}

export function PrayerList({ day, highlight }: { day: DaySchedule; highlight?: PrayerKey | null }) {
  const theme = useTheme();
  const label = usePrayerLabel();
  return (
    <View>
      {PRAYER_KEYS.map((key, i) => {
        const entry = day.entries.find((e) => e.key === key);
        const aktif = highlight === key;
        return (
          <View key={key}>
            {i > 0 ? <Divider /> : null}
            <Row
              align="center"
              justify="space-between"
              style={{ paddingVertical: theme.spacing.md }}
              accessible
              accessibilityLabel={`${label(key)} ${formatHM(entry?.hours ?? null)}`}
            >
              <Text variant={aktif ? 'bodyStrong' : 'body'} tone={aktif ? 'accent' : 'default'}>
                {label(key)}
              </Text>
              <Text variant={aktif ? 'bodyStrong' : 'body'} tone={aktif ? 'accent' : 'muted'}>
                {formatHM(entry?.hours ?? null)}
              </Text>
            </Row>
          </View>
        );
      })}
    </View>
  );
}
