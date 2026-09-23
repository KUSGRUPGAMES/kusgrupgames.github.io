/**
 * Günün vakit listesi — beş vakit ve güneş doğuşu (§14).
 *
 * Tasarım, ürün sahibinin onayladığı ana sayfa taslağından gelir: her satırda
 * vaktin kendi ikonu, sağda saat ve ok; **aktif vakit altın çerçeveli bir
 * şeritle** vurgulanır. Önceki sürüm yalnız yazıyı kalınlaştırıyordu ve
 * listede gözle bulunmuyordu.
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';
import { Row, Text, Divider, Icon, type IconName } from '@/ui';
import { formatHM } from '../calc';
import { PRAYER_KEYS, type PrayerKey } from '../methods';
import type { DaySchedule } from '../schedule';

const LABEL_KEY: Record<PrayerKey, 'prayer.fajr' | 'prayer.sunrise' | 'prayer.dhuhr' | 'prayer.asr' | 'prayer.maghrib' | 'prayer.isha'> = {
  fajr: 'prayer.fajr', sunrise: 'prayer.sunrise', dhuhr: 'prayer.dhuhr',
  asr: 'prayer.asr', maghrib: 'prayer.maghrib', isha: 'prayer.isha',
};

/**
 * Vakte göre ikon: güneşin ufka göre yeri. İmsak ufkun altında, güneş
 * doğarken, öğle tepede, ikindi alçalırken, akşam batarken, yatsı hilal.
 */
const ICON: Record<PrayerKey, IconName> = {
  fajr: 'sunLow', sunrise: 'sunrise', dhuhr: 'sunHigh',
  asr: 'sunLow', maghrib: 'sunset', isha: 'crescent',
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

export function PrayerList({ day, highlight, branded = false }: { day: DaySchedule; highlight?: PrayerKey | null; branded?: boolean }) {
  const theme = useTheme();
  const label = usePrayerLabel();
  return (
    <View>
      {PRAYER_KEYS.map((key, i) => {
        const entry = day.entries.find((e) => e.key === key);
        const aktif = highlight === key;
        return (
          <View key={key}>
            {i > 0 && !aktif ? branded
              ? <View style={{ height: 1, backgroundColor: theme.colors.bezemeSolgun }} />
              : <Divider /> : null}
            <Row
              align="center"
              justify="space-between"
              style={{
                paddingVertical: theme.spacing.md,
                paddingHorizontal: aktif ? theme.spacing.sm : 0,
                borderRadius: aktif ? theme.radius.md : 0,
                borderWidth: aktif ? 1 : 0,
                borderColor: aktif ? (branded ? theme.colors.onAccentHighlight : theme.colors.highlight) : 'transparent',
                backgroundColor: aktif ? theme.colors.onAccentBorder : 'transparent',
              }}
              accessible
              accessibilityLabel={`${label(key)} ${formatHM(entry?.hours ?? null)}`}
            >
              <Row align="center" gap="sm">
                <Icon
                  name={ICON[key]}
                  size={20}
                  color={branded ? theme.colors.onAccentHighlight : aktif ? theme.colors.highlight : theme.colors.textMuted}
                />
                <Text variant={aktif ? 'bodyStrong' : 'body'} tone={branded ? 'onAccent' : aktif ? 'accent' : 'default'}
                  style={branded && aktif ? { color: theme.colors.onAccentHighlight } : undefined}>
                  {label(key)}
                </Text>
              </Row>
              <Row align="center" gap="xs">
                <Text variant={aktif ? 'bodyStrong' : 'body'} tone={branded ? 'onAccent' : aktif ? 'accent' : 'muted'}
                  style={branded && aktif ? { color: theme.colors.onAccentHighlight } : undefined}>
                  {formatHM(entry?.hours ?? null)}
                </Text>
                <Icon
                  name="chevronRight"
                  size={16}
                  color={branded ? theme.colors.onAccentHighlight : aktif ? theme.colors.highlight : theme.colors.textSubtle}
                />
              </Row>
            </Row>
          </View>
        );
      })}
    </View>
  );
}
