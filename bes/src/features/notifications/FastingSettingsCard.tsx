/**
 * Oruç bildirimleri ayarı (5 Ekim) — Ayarlar → Bildirimler ve İbadet → Oruç'ta
 * aynı kart. Varsayılan kapalı: Ramazan dışında vakit bildirimleri oruçtan
 * söz etmez; oruç tutan kullanıcı buradan açar.
 */
import React from 'react';
import { Card, Chip, Column, Row, SectionHeader, Text, Toggle } from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settings';
import type { FastingMode } from './fasting';

const MODLAR: readonly FastingMode[] = ['off', 'ramadan', 'planned', 'everyday'];
const SAHUR = [0, 30, 45, 60, 90] as const;

export function FastingSettingsCard() {
  const t = useT();
  const theme = useTheme();
  const f = useSettingsStore((s) => s.settings.fasting);
  const update = useSettingsStore((s) => s.update);
  const ayarla = (p: Partial<typeof f>) => update({ fasting: { ...f, ...p } });
  return (
    <>
      <SectionHeader title={t('fasting.settingsTitle')} subtitle={t('fasting.settingsHint')} />
      <Card padding="md">
        <Column gap="sm">
          <Row gap="sm" wrap>
            {MODLAR.map((m) => (
              <Chip key={m} label={t(`fasting.mode.${m}`)} selected={f.mode === m} onPress={() => ayarla({ mode: m })} />
            ))}
          </Row>
          {f.mode === 'planned' ? <Text variant="micro" tone="subtle">{t('fasting.plannedHint')}</Text> : null}
          {f.mode !== 'off' ? (
            <Column gap="sm" style={{ marginTop: theme.spacing.sm }}>
              <Text variant="caption" tone="muted">{t('fasting.sahurLabel')}</Text>
              <Row gap="sm" wrap>
                {SAHUR.map((dk) => (
                  <Chip key={dk} label={dk === 0 ? t('alarm.off') : t('alarm.minutes', { n: dk })}
                    selected={f.sahurMinutes === dk} onPress={() => ayarla({ sahurMinutes: dk })} />
                ))}
              </Row>
              <Toggle title={t('fasting.atImsak')} value={f.atImsak} onChange={(v) => ayarla({ atImsak: v })} />
              <Toggle title={t('fasting.iftar')} value={f.iftar} onChange={(v) => ayarla({ iftar: v })} />
            </Column>
          ) : null}
        </Column>
      </Card>
    </>
  );
}
