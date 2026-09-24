/**
 * Ana Sayfa — şartname §14, §20, §21.
 * Kart düzeni kullanıcı tarafından değiştirilebilir; sıradaki vakit kartı
 * sabittir (kapatılamaz), çünkü uygulamanın çekirdeği odur.
 */
import React, { useMemo } from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import {
  Screen, Card, Text, Column, Button, EmptyState, Banner, Row,
  Icon, IconButton, OrnateFrame, SectionHeader, ListItem, type IconName,
} from '@/ui';
import { Brand } from '@/config/brand';
// Görseller `import` ile alınır: `require()` lint kuralıyla yasak ve
// `types/assets.d.ts` zaten `*.png` modülünü bildiriyor.
import camiSiluet from '../../assets/brand/hero-mosque-sunset.png';
// İki sembol var ve **temaya göre seçilir**. Açık temada açık renkli sembol
// fildişi zeminde tamamen kayboluyordu; dosya adındaki "light/dark" sembolün
// kendi rengidir, kullanılacağı temanın değil.
import sembolAcikRenk from '../../assets/brand/symbol-micro-light.png';
import sembolKoyuRenk from '../../assets/brand/symbol-micro-dark.png';
import { useT, useI18n, localeTag, type StringKey } from '@/lib/i18n';
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
import { useWorshipStore } from '@/store/worship';
import { dateKey } from '@/features/dhikr/stats';
import {
  DailyAyahCard, DailyDuaCard, DailyKnowledgeCard, DailyNameCard, HijriDateCard,
  ReligiousDayCard, MoonCard, FridayCard, RamadanCard, type DailyContext,
} from '@/features/daily/components/DailyCards';

const HIZLI = [
  { href: '/qibla', icon: 'compass', label: 'qibla.title' },
  { href: '/dhikr', icon: 'beads', label: 'worship.dhikr' },
  { href: '/(tabs)/quran', icon: 'book', label: 'nav.quran' },
  { href: '/(tabs)/learn', icon: 'sparkle', label: 'nav.learn' },
] as const satisfies readonly { href: string; icon: IconName; label: StringKey }[];

export default function HomeScreen() {
  const t = useT();
  const { language } = useI18n();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const kartlar = useHomeLayoutStore((s) => s.cards);
  const digerKartlar = kartlar.filter((c) => c.visible && c.id !== 'nextPrayer' && c.id !== 'todayTimes');
  const vakitlerAcik = kartlar.find((c) => c.id === 'todayTimes')?.visible !== false;

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
  const bugunAnahtar = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
    // Gün değişince canlı görünümün günü de değişir.
  }, [konum, live?.today.day]);
  const bugunIsaretli = useWorshipStore((s) => Object.keys(s.days[bugunAnahtar]?.prayers ?? {}).length);
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
            height={Math.round(kartGen * 0.79)}
            siluet={camiSiluet}
          >
            <Column gap="xs" align="center" style={{ flex: 1, justifyContent: 'center' }}>
              <Text variant="eyebrow" tone="onAccent" align="center" style={{ color: theme.colors.onAccentHighlight, letterSpacing: 2 }}>
                {t('prayer.next').toLocaleUpperCase(localeTag(language))}
              </Text>
              {live?.next ? (
                <Column align="center" gap="xs" style={{ width: '100%' }}>
                  <Text variant="display" tone="onAccent" align="center">{label(live.next.key)}</Text>
                  <Text
                    variant="numeric"
                    tone="onAccent"
                    align="center"
                    lines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    accessibilityLabel={t('prayer.remainingTo', {
                      name: label(live.next.key), time: formatCountdown(live.secondsToNext),
                    })}
                    style={{ width: '100%', fontVariant: ['tabular-nums'], color: theme.colors.onAccentHighlight }}
                  >
                    {formatCountdown(live.secondsToNext)}
                  </Text>
                </Column>
              ) : (
                <Text variant="body" tone="onAccent" align="center">{t('prayer.polarNote')}</Text>
              )}
            </Column>
          </OrnateFrame>
        );
      case 'todayTimes':
        return live ? (
          <Card key={id} accent padding="md">
            <Column gap="xs">
              <Row align="center" gap="sm">
                <Icon name="mosque" size={20} color={theme.colors.onAccentHighlight} />
                <Text variant="bodyStrong" tone="onAccent" style={{ color: theme.colors.onAccentHighlight }}>
                  {t('prayer.todayTimes')}
                </Text>
              </Row>
              <PrayerList day={live.today} highlight={live.current} branded compact
                onPrayerPress={() => router.push('/prayer-calendar')} />
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
    <Screen scroll motif="marka" padding="none">
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
      <Row align="center" justify="space-between" style={{ marginBottom: theme.spacing.sm }}>
        <IconButton
          name="bell"
          label={t('alarm.title')}
          filled
          onPress={() => router.push('/alarms')}
        />
        <Column align="center" gap="xxs">
          <Image
            source={theme.name === 'dark' ? sembolAcikRenk : sembolKoyuRenk}
            resizeMode="contain"
            accessible
            accessibilityLabel={Brand.appName}
          style={{ width: 52, height: 52 }}
          />
          <Text variant="caption" tone="muted">{Brand.tagline}</Text>
        </Column>
        <IconButton
          name="search"
          label={t('search.title')}
          filled
          onPress={() => router.push('/search')}
        />
      </Row>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${konum.label}, ${konum.country}`}
        onPress={() => router.push('/location')}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
          minHeight: 48, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.pill, borderWidth: 1,
          borderColor: theme.colors.bezemeSolgun, backgroundColor: theme.colors.surface,
          marginBottom: theme.spacing.sm,
        }}
      >
        <Icon name="location" size={20} color={theme.colors.highlight} />
        <Text variant="bodyStrong" lines={1} style={{ flex: 1 }}>{`${konum.label}, ${konum.country}`}</Text>
        <Icon name="chevronDown" size={18} color={theme.colors.textSubtle} />
      </Pressable>

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.sm }}>{kart('nextPrayer')}</View>
      {vakitlerAcik ? <View style={{ marginBottom: theme.spacing.sm }}>{kart('todayTimes')}</View> : null}

      {/* Hızlı erişim: en sık açılan dört yer tek dokunuşta (D25). */}
      <Row gap="sm">
        {HIZLI.map((h) => (
          <Card key={h.href} padding="sm" onPress={() => router.push(h.href)}
            accessibilityLabel={t(h.label)} style={{ flex: 1 }}>
            <Column align="center" gap="xs" style={{ paddingVertical: theme.spacing.xs }}>
              <Icon name={h.icon} size={26} color={theme.colors.highlight} />
              <Text variant="caption" align="center" lines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t(h.label)}
              </Text>
            </Column>
          </Card>
        ))}
      </Row>

      {/* Bugünün defteri: kaç vakit işaretlendi, tek dokunuşla deftere. */}
      <Card padding="sm" style={{ marginTop: theme.spacing.sm }}>
        <ListItem
          title={t('log.title')}
          subtitle={t('home.logToday', { n: bugunIsaretli })}
          icon="check"
          onPress={() => router.push('/worship-log')}
        />
      </Card>

      {digerKartlar.length > 0 ? (
        <>
          <SectionHeader title={t('common.today')} />
          <Column gap="md">{digerKartlar.map((c) => kart(c.id))}</Column>
        </>
      ) : null}

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
      </View>
    </Screen>
  );
}
