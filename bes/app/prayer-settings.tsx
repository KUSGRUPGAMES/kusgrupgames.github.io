/** Vakit hesabı ayarları — şartname §15. Bildirimler: `alarms.tsx`. */
import React from 'react';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Segmented, Stepper,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useMethodName } from '@/features/hijri/labels';
import { METHODS, PRAYER_KEYS, type PrayerKey } from '@/features/prayer/methods';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';

export default function PrayerSettingsScreen() {
  const t = useT();
  const yontemAdi = useMethodName();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('prayer.settings') }} />

      <SectionHeader title={t('prayer.method')} />
      <Card padding="sm">
        {Object.values(METHODS).map((m) => (
          <ListItem
            key={m.id}
            title={yontemAdi(m.id)}
            chevron={false}
            // Seçili satır bir noktayla işaretleniyordu: küçük, soluk ve
            // ekran okuyucuya hiçbir şey söylemiyordu (D: erişilebilirlik).
            selected={settings.method === m.id}
            onPress={() => update({ method: m.id })}
          />
        ))}
      </Card>

      <SectionHeader title={t('prayer.asrShadow')} />
      <Segmented
        options={[
          { value: '1', label: t('prayer.asrStandard') },
          { value: '2', label: t('prayer.asrHanafi') },
        ]}
        value={String(settings.asrShadow)}
        onChange={(v) => update({ asrShadow: v === '2' ? 2 : 1 })}
        accessibilityLabel={t('prayer.asrShadow')}
      />

      <SectionHeader title={t('prayer.adjustment')} subtitle={t('prayer.adjustmentHint')} />
      <Card padding="sm">
        {PRAYER_KEYS.map((key) => (
          <Stepper
            key={key}
            title={label(key)}
            value={(settings.adjustments as Partial<Record<PrayerKey, number>>)[key] ?? 0}
            min={-60}
            signed
            max={60}
            unit={t('notification.beforeUnit')}
            onChange={(v) => update({ adjustments: { ...settings.adjustments, [key]: v } })}
          />
        ))}
      </Card>

      {/* Bildirim ayarları "Vakit uyarıları" ekranına taşındı: ana sayfadaki
          zilden tek dokunuşla açılıyor (D25). */}
      <Card padding="sm" style={{ marginTop: 16 }}>
        <ListItem title={t('alarm.title')} subtitle={t('alarm.subtitle')} icon="bell"
          onPress={() => router.push('/alarms')} />
      </Card>
    </Screen>
  );
}
