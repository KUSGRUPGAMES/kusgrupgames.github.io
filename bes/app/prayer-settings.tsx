/** Vakit ve bildirim ayarları — şartname §15, §16, §65. */
import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Segmented, Stepper, Toggle, Banner, Text, Column,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useMethodName } from '@/features/hijri/labels';
import { METHODS, PRAYER_KEYS, type MethodId, type PrayerKey } from '@/features/prayer/methods';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { rangeSchedule } from '@/features/prayer/schedule';
import { planNotifications, coverageDays, type NotificationSettings } from '@/features/notifications/plan';
import { applyPlan, requestPermission, pendingCount } from '@/features/notifications/service';
import { zonedNow } from '@/lib/time/zone';

export default function PrayerSettingsScreen() {
  const t = useT();
  const yontemAdi = useMethodName();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const konum = useLocationStore((s) => s.active());
  const [kurulu, setKurulu] = useState(0);

  const bildirimAyari: NotificationSettings = {
    enabled: settings.notifications.enabled,
    perPrayer: settings.notifications.perPrayer as Partial<Record<PrayerKey, boolean>>,
    beforeMinutes: settings.notifications.beforeMinutes,
    includeSunrise: false,
  };

  /** Ayar her değiştiğinde bildirimler baştan kurulur (§16). */
  const bildirimleriKur = useCallback(async () => {
    if (!konum) return;
    if (!settings.notifications.enabled) { setKurulu(await pendingCount()); return; }
    const izin = await requestPermission();
    if (!izin) { setKurulu(0); return; }
    const z = zonedNow(konum.timezone);
    const gunler = rangeSchedule(
      {
        latitude: konum.latitude,
        longitude: konum.longitude,
        timezone: konum.timezone,
        options: {
          method: settings.method as MethodId,
          asrShadow: settings.asrShadow,
          adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
        },
      },
      { year: z.year, month: z.month, day: z.day },
      coverageDays(bildirimAyari) + 1,
    );
    const plan = planNotifications(gunler, bildirimAyari);
    const n = await applyPlan(plan, {
      title: (key) => label(key),
      body: (item) => item.beforeMinutes > 0
        ? t('prayer.remainingTo', { name: label(item.key), time: `${item.beforeMinutes} ${t('notification.beforeUnit')}` })
        : t('prayer.entered', { name: label(item.key) }),
    }, { sound: settings.notifications.sound });
    setKurulu(n);
  }, [konum, settings, label, t, bildirimAyari]);

  useEffect(() => { void bildirimleriKur(); }, [bildirimleriKur]);

  return (
    <Screen scroll>
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

      <SectionHeader title={t('notification.title')} />
      <Card padding="sm">
        <Toggle
          title={t('settings.notifications')}
          value={settings.notifications.enabled}
          onChange={(v) => update({ notifications: { ...settings.notifications, enabled: v } })}
          icon="bell"
        />
        <Toggle
          title={t('settings.sound')}
          value={settings.notifications.sound}
          onChange={(v) => update({ notifications: { ...settings.notifications, sound: v } })}
        />
        <Stepper
          title={t('notification.before')}
          value={settings.notifications.beforeMinutes}
          min={0}
          max={60}
          step={5}
          unit={t('notification.beforeUnit')}
          onChange={(v) => update({ notifications: { ...settings.notifications, beforeMinutes: v } })}
        />
      </Card>

      <SectionHeader title={t('notification.perPrayer')} />
      <Card padding="sm">
        {PRAYER_KEYS.filter((k) => k !== 'sunrise').map((key) => (
          <Toggle
            key={key}
            title={label(key)}
            value={(settings.notifications.perPrayer as Partial<Record<PrayerKey, boolean>>)[key] ?? true}
            onChange={(v) => update({
              notifications: {
                ...settings.notifications,
                perPrayer: { ...settings.notifications.perPrayer, [key]: v },
              },
            })}
          />
        ))}
      </Card>

      <Column gap="sm" style={{ marginTop: 16 }}>
        <Banner
          tone="info"
          title={t('notification.pending', { count: kurulu })}
          description={t('notification.coverageNote')}
        />
        <Text variant="caption" tone="subtle">
          {t('notification.coverage', { days: coverageDays(bildirimAyari) })}
        </Text>
      </Column>
    </Screen>
  );
}
