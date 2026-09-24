/**
 * Günün içeriği kartları — şartname §22–§26, §44–§46.
 * Telif engeline takılan kartlar (Günün Âyeti, Günün Hadisi) burada
 * **yok sayılmaz**: bölüm görünür, içeriğin neden boş olduğu yazılır (§92).
 */
import React from 'react';
import { router } from 'expo-router';
import { Card, Column, Row, Text, Badge, IconButton } from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { pickDaily } from '../pick';
import { DUAS } from '@/content/duas';
import { KNOWLEDGE } from '@/content/knowledge';
import { DIVINE_NAMES } from '@/content/names';
import { useFavoriteStore } from '@/store/favorites';
import { toHijri, upcomingReligiousDays } from '@/features/hijri/calc';
import { useHijriMonthName, useReligiousDayName } from '@/features/hijri/labels';
import { moonState } from '@/features/moon/phase';
import { isFriday, ramadanState, KAHF_SURAH } from '@/features/ramadan/calc';
import { getQuranIndexSize, getAyahByIndex, getTranslationByIndex, getTranslationInfo } from '@/features/quran/data';
import { dailyIndex } from '../pick';
import { ArabicText, SourceNote } from '@/ui';

export interface DailyContext {
  year: number;
  month: number;
  day: number;
  /** Kullanıcının hicrî gün düzeltmesi (§44). */
  hijriOffset: number;
  now: Date;
}

export function DailyDuaCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const fav = useFavoriteStore();
  const dua = pickDaily(DUAS, ctx);
  if (!dua) return null;
  const secili = fav.has('dua', dua.id);
  return (
    <Card onPress={() => router.push('/duas')} accessibilityLabel={t('dua.ofDay')}>
      <Column gap="sm">
        <Row align="center" justify="space-between">
          <Text variant="caption" tone="muted">{t('dua.ofDay')}</Text>
          <IconButton
            name="heart"
            label={secili ? t('favorite.remove') : t('favorite.add')}
            size={18}
            onPress={() => fav.toggle('dua', dua.id)}
          />
        </Row>
        <Text variant="title3">{dua.title}</Text>
        <Text variant="body" tone="muted">{dua.body}</Text>
        <Text variant="micro" tone="subtle">{t('dua.ownContent')}</Text>
      </Column>
    </Card>
  );
}

export function DailyKnowledgeCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const item = pickDaily(KNOWLEDGE, { ...ctx, salt: 101 });
  if (!item) return null;
  return (
    <Card onPress={() => router.push('/knowledge')} accessibilityLabel={t('knowledge.ofDay')}>
      <Column gap="sm">
        <Text variant="caption" tone="muted">{t('knowledge.ofDay')}</Text>
        <Text variant="title3">{item.title}</Text>
        <Text variant="body" tone="muted" lines={4}>{item.body}</Text>
      </Column>
    </Card>
  );
}

export function DailyNameCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const fav = useFavoriteStore();
  const isim = pickDaily(DIVINE_NAMES, { ...ctx, salt: 211 });
  if (!isim) return null;
  const secili = fav.has('name', String(isim.ordinal));
  return (
    <Card onPress={() => router.push('/names')} accessibilityLabel={t('names.ofDay')}>
      <Column gap="sm">
        <Row align="center" justify="space-between">
          <Text variant="caption" tone="muted">{t('names.ofDay')}</Text>
          <IconButton
            name="heart"
            label={secili ? t('favorite.remove') : t('favorite.add')}
            size={18}
            onPress={() => fav.toggle('name', String(isim.ordinal))}
          />
        </Row>
        <Text variant="title2" tone="accent">{isim.transliteration}</Text>
        <Text variant="body" tone="muted">{isim.meaning}</Text>
      </Column>
    </Card>
  );
}

export function HijriDateCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const ayAdi = useHijriMonthName();
  const h = toHijri(new Date(ctx.now.getTime() + ctx.hijriOffset * 86400000));
  const ay = ayAdi(h.month);
  return (
    <Card onPress={() => router.push('/hijri')} accessibilityLabel={t('hijri.title')}>
      <Column gap="xs">
        <Text variant="caption" tone="muted">{t('hijri.title')}</Text>
        <Text variant="title2">{`${h.day} ${ay} ${h.year}`}</Text>
        <Text variant="micro" tone="subtle">{t('hijri.approxNote')}</Text>
      </Column>
    </Card>
  );
}

export function ReligiousDayCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const gunAdi = useReligiousDayName();
  const yaklasan = upcomingReligiousDays(ctx.now)[0];
  if (!yaklasan) return null;
  const kalan = yaklasan.daysAway === 0
    ? t('religiousDay.today')
    : yaklasan.daysAway === 1
      ? t('religiousDay.tomorrow')
      : t('religiousDay.inDays', { days: yaklasan.daysAway });
  return (
    <Card onPress={() => router.push('/hijri')} accessibilityLabel={t('religiousDay.upcoming')}>
      <Column gap="xs">
        <Text variant="caption" tone="muted">{t('religiousDay.upcoming')}</Text>
        <Row align="center" justify="space-between">
          <Text variant="title3">{gunAdi(yaklasan.id)}</Text>
          <Badge label={kalan} tone="highlight" />
        </Row>
      </Column>
    </Card>
  );
}

const MOON_LABEL = {
  newMoon: 'moon.newMoon', waxingCrescent: 'moon.waxingCrescent',
  firstQuarter: 'moon.firstQuarter', waxingGibbous: 'moon.waxingGibbous',
  fullMoon: 'moon.fullMoon', waningGibbous: 'moon.waningGibbous',
  lastQuarter: 'moon.lastQuarter', waningCrescent: 'moon.waningCrescent',
} as const;

export function MoonCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const theme = useTheme();
  const m = moonState(ctx.now);
  return (
    <Card>
      <Column gap="xs">
        <Text variant="caption" tone="muted">{t('moon.title')}</Text>
        <Row align="center" justify="space-between">
          <Text variant="title3">{t(MOON_LABEL[m.name])}</Text>
          <Text variant="body" tone="highlight">{`%${Math.round(m.illumination * 100)}`}</Text>
        </Row>
        <Text variant="caption" tone="muted">
          {`${t('moon.age')}: ${m.ageDays.toFixed(1)} ${t('moon.ageUnit')}`}
        </Text>
        <Text variant="micro" tone="subtle" style={{ marginTop: theme.spacing.xxs }}>
          {t('moon.approxNote')}
        </Text>
      </Column>
    </Card>
  );
}

/**
 * Günün Âyeti — şartname §22.
 *
 * Seçim gün bazında sabittir ve rastgele değildir; aynı gün kaç kez açılırsa
 * açılsın aynı âyet gelir. Kaynak künyesi kartın üstünde durur (§107).
 */
export function DailyAyahCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const fav = useFavoriteStore();
  const toplam = getQuranIndexSize();
  const i = dailyIndex({ year: ctx.year, month: ctx.month, day: ctx.day, length: toplam, salt: 313 });
  const ayet = i < 0 ? null : getAyahByIndex(i);
  if (!ayet) return null;
  const meal = getTranslationByIndex(i);
  const kunye = getTranslationInfo();
  const kimlik = `${ayet.surah}:${ayet.ayah}`;
  const secili = fav.has('ayah', kimlik);

  return (
    <Card
      onPress={() => router.push(`/reader?surah=${ayet.surah}&ayah=${ayet.ayah}`)}
      accessibilityLabel={t('explore.dailyAyah')}
    >
      <Column gap="sm">
        <Row align="center" justify="space-between">
          <Text variant="caption" tone="muted">{t('explore.dailyAyah')}</Text>
          <IconButton
            name="heart"
            label={secili ? t('favorite.remove') : t('favorite.add')}
            size={18}
            onPress={() => fav.toggle('ayah', kimlik)}
          />
        </Row>
        <ArabicText size="small">{ayet.text}</ArabicText>
        {meal ? <Text variant="body" tone="muted">{meal}</Text> : null}
        <Text variant="micro" tone="subtle">{`${ayet.surahName} ${ayet.ayah}`}</Text>
        <SourceNote
          source={t('quran.translationSource', { name: kunye.name, rights: t('quran.publicDomain') })}
        />
      </Column>
    </Card>
  );
}

/**
 * Cuma kartı — şartname §50. Yalnız cuma günü görünür; diğer günlerde
 * kart hiç çizilmez, boş kutu bırakılmaz.
 */
export function FridayCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  if (!isFriday(ctx.year, ctx.month, ctx.day)) return null;
  return (
    <Card accent onPress={() => router.push(`/reader?surah=${KAHF_SURAH}&ayah=1`)}>
      <Column gap="xs">
        <Text variant="caption" tone="onAccent">{t('friday.title')}</Text>
        <Text variant="title3" tone="onAccent">{t('friday.greeting')}</Text>
        <Text variant="caption" tone="onAccent">{t('friday.kahf')}</Text>
      </Column>
    </Card>
  );
}

/** Ramazan kartı — şartname §47. Ramazan dışında görünmez. */
export function RamadanCard({ ctx }: { ctx: DailyContext }) {
  const t = useT();
  const durum = ramadanState(ctx.now, ctx.hijriOffset);
  if (!durum.active) return null;
  return (
    <Card onPress={() => router.push('/ramadan')} accessibilityLabel={t('ramadan.title')}>
      <Column gap="xs">
        <Text variant="caption" tone="muted">{t('ramadan.title')}</Text>
        <Text variant="title3" tone="accent">{t('ramadan.day', { day: durum.day })}</Text>
      </Column>
    </Card>
  );
}
