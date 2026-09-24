/**
 * Vakit uyarıları — şartname §16, §64, §65.
 *
 * Eskiden vakit bildirimleri "Vakit ayarları"nın dibinde, hesap yöntemiyle
 * aynı ekrandaydı; ana sayfadan oraya ulaşmak mümkün değildi. Artık ana
 * sayfadaki zil doğrudan buraya açılır. Burada: vakit bildirimleri,
 * "vakitten önce uyar", vakit vakit aç/kapat ve özel hatırlatıcılar.
 *
 * Bildirimler telefonun yerel bildirimleridir: uygulama kapalıyken de gelir,
 * kilit ekranında ve bildirim merkezinde görünür.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Toggle, Banner, Text, Column, Row, Chip,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { PRAYER_KEYS, type PrayerKey } from '@/features/prayer/methods';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { coverageDays, type NotificationSettings } from '@/features/notifications/plan';
import { requestPermission, cancelOwned } from '@/features/notifications/service';
import { useNotificationSync } from '@/features/notifications/useNotificationSync';

const ONCEDEN = [0, 5, 10, 15, 20, 30, 45, 60] as const;

export default function AlarmsScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const konum = useLocationStore((s) => s.active());
  const hatirlaticilar = useWorshipStore((s) => s.reminders);
  const { esitle } = useNotificationSync();
  const [kurulu, setKurulu] = useState(0);
  const [izin, setIzin] = useState(true);
  const n = settings.notifications;

  const bildirimAyari: NotificationSettings = {
    enabled: n.enabled,
    perPrayer: n.perPrayer as Partial<Record<PrayerKey, boolean>>,
    beforeMinutes: n.beforeMinutes,
    includeSunrise: false,
    alsoAtTime: n.alsoAtTime,
  };

  /** Ayar her değiştiğinde bildirimler baştan kurulur (§16). */
  const bildirimleriKur = useCallback(async () => {
    if (!konum) return;
    if (!n.enabled) {
      // Kapatınca **bizim** kayıtlarımız silinir; başka kaynağınkine dokunulmaz.
      setKurulu(0);
      await cancelOwned();
      return;
    }
    // İzin isteme kullanıcı eylemine bağlı: bu ekranı kullanıcı kendisi açtı.
    const verildi = await requestPermission();
    setIzin(verildi);
    if (!verildi) { setKurulu(0); return; }
    // Plan koordinatörden gelir; metin ve kimlik tek yerde üretilir.
    const sonuc = await esitle();
    setIzin(sonuc.izin);
    setKurulu(sonuc.kurulan + sonuc.dokunulmayan);
  }, [esitle]);

  useEffect(() => { void bildirimleriKur(); }, [bildirimleriKur]);

  const ayarla = (patch: Partial<typeof n>) => update({ notifications: { ...n, ...patch } });
  const etkin = hatirlaticilar.filter((r) => r.enabled).length;

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('alarm.title') }} />
      <Text variant="callout" tone="muted">{t('alarm.intro')}</Text>

      {!izin ? (
        <Banner tone="warning" title={t('notification.permissionMissing')} style={{ marginTop: theme.spacing.md }}
          actionLabel={t('qibla.openSettings')} onAction={() => { void Linking.openSettings(); }} />
      ) : null}

      <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
        <Toggle title={t('alarm.prayerAlerts')} value={n.enabled} onChange={(v) => ayarla({ enabled: v })} icon="bell" />
        <Toggle title={t('settings.sound')} value={n.sound} onChange={(v) => ayarla({ sound: v })} />
      </Card>

      {n.enabled ? (
        <>
          <SectionHeader title={t('alarm.beforeTitle')} subtitle={t('alarm.beforeHint')} />
          <Row gap="sm" wrap>
            {ONCEDEN.map((dk) => (
              <Chip
                key={dk}
                label={dk === 0 ? t('alarm.off') : t('alarm.minutes', { n: dk })}
                selected={n.beforeMinutes === dk}
                onPress={() => ayarla({ beforeMinutes: dk })}
              />
            ))}
          </Row>
          {n.beforeMinutes > 0 ? (
            <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
              <Toggle title={t('alarm.alsoAtTime')} value={n.alsoAtTime}
                onChange={(v) => ayarla({ alsoAtTime: v })} />
            </Card>
          ) : null}

          <SectionHeader title={t('notification.perPrayer')} />
          <Card padding="sm">
            {PRAYER_KEYS.filter((k) => k !== 'sunrise').map((key) => (
              <Toggle
                key={key}
                title={label(key)}
                value={(n.perPrayer as Partial<Record<PrayerKey, boolean>>)[key] ?? true}
                onChange={(v) => ayarla({ perPrayer: { ...n.perPrayer, [key]: v } })}
              />
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('alarm.custom')} subtitle={t('alarm.customHint')} />
      <Card padding="sm">
        <ListItem
          title={t('reminder.add')}
          subtitle={t('alarm.customCount', { n: etkin })}
          icon="plus"
          onPress={() => router.push('/reminders')}
        />
        <ListItem title={t('notification.center')} icon="calendar" onPress={() => router.push('/notifications-center')} />
      </Card>

      <Column gap="xs" style={{ marginTop: theme.spacing.lg }}>
        {n.enabled && izin ? (
          <Text variant="caption" tone="muted">
            {`${t('notification.pending', { count: kurulu })} · ${t('notification.coverage', { days: coverageDays(bildirimAyari) })}`}
          </Text>
        ) : null}
        <Text variant="micro" tone="subtle">{t('notification.coverageNote')}</Text>
      </Column>
    </Screen>
  );
}
