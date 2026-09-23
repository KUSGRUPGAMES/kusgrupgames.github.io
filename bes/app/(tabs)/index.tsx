/**
 * Ana Sayfa — şartname §14, §20, §21.
 * Kart düzeni kullanıcı tarafından değiştirilebilir; sıradaki vakit kartı
 * sabittir (kapatılamaz), çünkü uygulamanın çekirdeği odur.
 */
import React, { useMemo } from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import {
  Screen, Card, Text, Column, CountdownRing, Button, EmptyState, Banner, Row,
  Icon, IconButton, OrnateFrame,
} from '@/ui';
import { Brand } from '@/config/brand';
// Görseller `import` ile alınır: `require()` lint kuralıyla yasak ve
// `types/assets.d.ts` zaten `*.png` modülünü bildiriyor.
import camiSiluet from '../../assets/brand/paket/islami_siluet_03.png';
// İki sembol var ve **temaya göre seçilir**. Açık temada açık renkli sembol
// fildişi zeminde tamamen kayboluyordu; dosya adındaki "light/dark" sembolün
// kendi rengidir, kullanılacağı temanın değil.
import sembolAcikRenk from '../../assets/brand/symbol-micro-light.png';
import sembolKoyuRenk from '../../assets/brand/symbol-micro-dark.png';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { useHomeLayoutStore, type HomeCardId } from '@/store/homeLayout';
import { useLiveView } from '@/features/prayer/useSchedule';
import { PrayerList, usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { formatCountdown } from '@/features/prayer/calc';
import type { ScheduleInput } from '@/features/prayer/schedule';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';
import { zonedNow } from '@/lib/time/zone';
import {
  DailyAyahCard, DailyDuaCard, DailyKnowledgeCard, DailyNameCard, HijriDateCard,
  ReligiousDayCard, MoonCard, FridayCard, RamadanCard, type DailyContext,
} from '@/features/daily/components/DailyCards';

export default function HomeScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const kartlar = useHomeLayoutStore((s) => s.cards);

  const input = useMemo<ScheduleInput | null>(() => {
    if (!konum) return null;
    return {
      latitude: konum.latitude,
      longitude: konum.longitude,
      timezone: konum.timezone,
      options: {
        method: settings.method as MethodId,
        asrShadow: settings.asrShadow,
        adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
        ...(konum.elevation === undefined ? {} : { elevation: konum.elevation }),
      },
    };
  }, [konum, settings]);

  const live = useLiveView(input);
  // Kemerli kart ekran genişliğine göre ölçeklenir; sabit yükseklik dar
  // telefonlarda kemeri eziyordu.
  const { width: ekranGen } = useWindowDimensions();
  const kartGen = Math.max(240, ekranGen - theme.spacing.lg * 2);

  const ctx = useMemo<DailyContext | null>(() => {
    if (!konum) return null;
    const now = new Date();
    const z = zonedNow(konum.timezone, now);
    return { year: z.year, month: z.month, day: z.day, hijriOffset: settings.hijriOffset, now };
    // Gün içinde saatlik değişimi önemsiz; kartlar gün bazında sabit kalır.
  }, [konum, settings.hijriOffset, live?.today.day]);

  if (!konum || !ctx) {
    return (
      <Screen motif="marka">
        <EmptyState
          icon="location"
          title={t('location.empty')}
          description={t('location.permissionBody')}
          actionLabel={t('location.add')}
          onAction={() => router.push('/location')}
        />
      </Screen>
    );
  }

  const kart = (id: HomeCardId) => {
    switch (id) {
      case 'nextPrayer':
        return (
          <OrnateFrame
            key={id}
            width={kartGen}
            height={Math.round(kartGen * 0.80)}
            siluet={camiSiluet}
          >
            <Column gap="sm" align="center" style={{ flex: 1, justifyContent: 'center' }}>
              <Text variant="callout" tone="onAccent">{t('prayer.next')}</Text>
              {live?.next ? (
                <CountdownRing
                  progress={live.progress}
                  // Halka marka kartının üstünde: altın ve yatak zümrüde göre
                  // seçilir. Açık temanın koyulaştırılmış altını burada
                  // 2.25:1'e düşüyor ve halka kayboluyordu (D18).
                  color={theme.colors.onAccentHighlight}
                  trackColor={theme.colors.onAccentTrack}
                  size={Math.round(kartGen * 0.42)}
                  accessibilityLabel={t('prayer.remainingTo', {
                    name: label(live.next.key),
                    time: formatCountdown(live.secondsToNext),
                  })}
                >
                  <Column align="center" gap="xxs">
                    <Text variant="title2" tone="onAccent">{label(live.next.key)}</Text>
                    <Text
                      variant="numericSmall"
                      tone="onAccent"
                      align="center"
                      lines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={{ width: Math.round(kartGen * 0.42) - 28, fontVariant: ['tabular-nums'] }}
                    >
                      {formatCountdown(live.secondsToNext)}
                    </Text>
                  </Column>
                </CountdownRing>
              ) : (
                <Text variant="body" tone="onAccent" align="center">{t('prayer.polarNote')}</Text>
              )}
            </Column>
          </OrnateFrame>
        );
      case 'todayTimes':
        return live ? (
          <Card key={id}>
            <Column gap="sm">
              <Row align="center" gap="sm">
                <Icon name="mosque" size={20} color={theme.colors.highlight} />
                <Text variant="caption" tone="muted">{t('prayer.todayTimes')}</Text>
              </Row>
              <PrayerList day={live.today} highlight={live.current} />
            </Column>
          </Card>
        ) : <Banner key={id} tone="info" title={t('common.loading')} />;
      case 'friday': return <FridayCard key={id} ctx={ctx} />;
      case 'ramadan': return <RamadanCard key={id} ctx={ctx} />;
      case 'hijriDate': return <HijriDateCard key={id} ctx={ctx} />;
      case 'dailyAyah': return <DailyAyahCard key={id} ctx={ctx} />;
      case 'dailyDua': return <DailyDuaCard key={id} ctx={ctx} />;
      case 'dailyKnowledge': return <DailyKnowledgeCard key={id} ctx={ctx} />;
      case 'dailyName': return <DailyNameCard key={id} ctx={ctx} />;
      case 'religiousDay': return <ReligiousDayCard key={id} ctx={ctx} />;
      case 'moon': return <MoonCard key={id} ctx={ctx} />;
    }
  };

  return (
    <Screen scroll motif="marka">
      {/* Üst çubuk: solda bildirimler, ortada marka, sağda vakit ayarları.
          Onaylanan taslaktaki düzen budur; daire içindeki düğmeler markanın
          altın hattını taşır. */}
      <Row align="center" justify="space-between" style={{ marginBottom: theme.spacing.md }}>
        <IconButton
          name="bell"
          label={t('reminder.title')}
          filled
          onPress={() => router.push('/notifications-center')}
        />
        <Column align="center" gap="xxs">
          <Image
            source={theme.name === 'dark' ? sembolAcikRenk : sembolKoyuRenk}
            resizeMode="contain"
            accessible
            accessibilityLabel={Brand.appName}
            style={{ width: 40, height: 40 }}
          />
          <Text variant="caption" tone="muted">{Brand.tagline}</Text>
        </Column>
        <IconButton
          name="settings"
          label={t('prayer.settings')}
          filled
          onPress={() => router.push('/prayer-settings')}
        />
      </Row>

      {/* Konum hapı: iğne, şehir, ülke ve ok — taslaktaki satırın aynısı. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${konum.label}, ${konum.country}`}
        onPress={() => router.push('/location')}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.lg, borderWidth: 1,
          borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
          marginBottom: theme.spacing.md,
        }}
      >
        <Icon name="location" size={20} color={theme.colors.highlight} />
        <Column gap="xxs" style={{ flex: 1 }}>
          <Text variant="bodyStrong">{konum.label}</Text>
          <Text variant="caption" tone="muted">{konum.country}</Text>
        </Column>
        <Icon name="chevronDown" size={18} color={theme.colors.textSubtle} />
      </Pressable>

      <Column gap="md">
        {kartlar.filter((c) => c.visible).map((c) => kart(c.id))}
      </Column>

      <Row gap="sm" style={{ marginTop: theme.spacing.xl }}>
        <Button
          label={t('prayer.calendar')}
          icon="calendar"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/prayer-calendar')}
        />
        <View style={{ flex: 1 }} />
        <Button
          label={t('home.customize')}
          icon="settings"
          variant="ghost"
          size="sm"
          onPress={() => router.push('/home-layout')}
        />
      </Row>
    </Screen>
  );
}
