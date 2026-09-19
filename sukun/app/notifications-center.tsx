/** Bildirim merkezi — şartname §65. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Column, Row, Text, Button, Banner, EmptyState, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { rangeSchedule } from '@/features/prayer/schedule';
import { planNotifications, coverageDays, type NotificationSettings } from '@/features/notifications/plan';
import { planReminders } from '@/features/notifications/reminders';
import { applyPlan, requestPermission, pendingCount } from '@/features/notifications/service';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { zonedNow } from '@/lib/time/zone';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';

interface Satir { id: string; baslik: string; an: Date }

export default function NotificationsCenterScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const konum = useLocationStore((s) => s.active());
  const reminders = useWorshipStore((s) => s.reminders);
  const [kurulu, setKurulu] = useState(0);
  const [izin, setIzin] = useState(true);

  const bildirimAyari: NotificationSettings = useMemo(() => ({
    enabled: settings.notifications.enabled,
    perPrayer: settings.notifications.perPrayer as Partial<Record<PrayerKey, boolean>>,
    beforeMinutes: settings.notifications.beforeMinutes,
    includeSunrise: false,
  }), [settings.notifications]);

  const gunler = useMemo(() => {
    if (!konum) return [];
    const z = zonedNow(konum.timezone);
    return rangeSchedule(
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
  }, [konum, settings, bildirimAyari]);

  /** Vakit bildirimleri ve özel hatırlatıcılar tek listede, zaman sırasında. */
  const liste = useMemo<Satir[]>(() => {
    const vakitler = planNotifications(gunler, bildirimAyari).map((n) => ({
      id: n.id, baslik: label(n.key), an: n.at,
    }));
    const hatirlaticilar = planReminders(reminders, gunler).map((r) => ({
      id: r.id, baslik: r.title, an: r.at,
    }));
    return [...vakitler, ...hatirlaticilar]
      .sort((a, b) => a.an.getTime() - b.an.getTime())
      .slice(0, 64);
  }, [gunler, bildirimAyari, reminders, label]);

  const durumOku = useCallback(async () => setKurulu(await pendingCount()), []);
  useEffect(() => { void durumOku(); }, [durumOku]);

  const yenidenKur = useCallback(async () => {
    const verildi = await requestPermission();
    setIzin(verildi);
    if (!verildi) return;
    const plan = planNotifications(gunler, bildirimAyari);
    const n = await applyPlan(plan, {
      title: (key) => label(key),
      body: (item) => t('prayer.entered', { name: label(item.key) }),
    }, { sound: settings.notifications.sound });
    setKurulu(n);
  }, [gunler, bildirimAyari, label, t, settings.notifications.sound]);

  const bicim = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <Screen motif="octagonGrid" padding="lg">
      <Stack.Screen options={{ headerShown: true, title: t('notification.center') }} />
      <View style={{ flex: 1 }}>
        <VirtualList
          data={liste}
          keyExtractor={(s) => s.id}
          itemHeight={56}
          header={
            <Column gap="md" style={{ paddingBottom: theme.spacing.md }}>
              <SectionHeader
                title={t('notification.upcoming')}
                subtitle={t('notification.pending', { count: kurulu })}
              />
              {!izin ? <Banner tone="warning" title={t('notification.permissionMissing')} /> : null}
              <Banner tone="info" title={t('notification.center')} description={t('notification.coverageNote')} />
              <Row>
                <Button
                  label={t('notification.refresh')}
                  icon="refresh"
                  variant="secondary"
                  size="sm"
                  onPress={() => { void yenidenKur(); }}
                />
              </Row>
            </Column>
          }
          renderItem={(s) => (
            <Row align="center" justify="space-between" style={{ paddingVertical: theme.spacing.sm }}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>{s.baslik}</Text>
              <Text variant="caption" tone="muted">{bicim.format(s.an)}</Text>
            </Row>
          )}
          empty={<EmptyState icon="bellOff" title={t('notification.none')} description={t('notification.coverageNote')} />}
        />
      </View>
    </Screen>
  );
}
