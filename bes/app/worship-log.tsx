/** İbadet defteri ve oruç takibi — şartname §42, §49. */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Segmented, Stepper,
  Banner, IconButton, Button, Divider, ListItem, Icon,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useWorshipStore, type QadaSlot, type FastKind, type WorshipDay, type FastDay } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { dateKey } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

type NamazSlot = Exclude<QadaSlot, 'witr'>;
const NAMAZLAR: NamazSlot[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Ekrandaki her değişiklik doğrudan depoya yazılıyordu: sayfalar arası
 * gezinirken yanlışlıkla dokunulan bir alan hemen kaydediliyordu, "Kaydet"
 * demeden önceki kaydı bozabiliyordu. Artık değişiklikler yalnız bu yerel
 * taslakta tutulur; "Kaydet"e basılmadan depoya yazılmaz, tarihten
 * uzaklaşınca da sessizce bırakılır — önceki kayıt her durumda korunur.
 */
/**
 * Oruç tek bir sorunun cevabı olarak seçilir. Eskiden "Tutmadım / Ramazan /
 * Kaza / Nafile" diye dört kısa etiket vardı ve Ramazan'da tutulamayan günü
 * (kazaya kalan borç) girmenin yolu yoktu.
 */
type OrucSecimi = 'none' | 'ramadan' | 'ramadanMissed' | 'qada' | 'nafile' | 'kaffara';

interface Taslak {
  prayers: Partial<Record<NamazSlot, 'alone' | 'jamaah' | 'qada'>>;
  quranMinutes: number;
  /** Arayüzden kaldırıldı; eski kayıtlarda varsa korunur. */
  note: string;
  fast: OrucSecimi;
}

function orucSecimi(oruc: FastDay | undefined): OrucSecimi {
  if (!oruc) return 'none';
  if (oruc.kind === 'ramadan') return oruc.completed ? 'ramadan' : 'ramadanMissed';
  return oruc.kind;
}

function taslakOlustur(gun: WorshipDay | undefined, oruc: FastDay | undefined): Taslak {
  return {
    prayers: { ...(gun?.prayers ?? {}) },
    quranMinutes: gun?.quranMinutes ?? 0,
    note: gun?.note ?? '',
    fast: orucSecimi(oruc),
  };
}

export default function WorshipLogScreen() {
  const tamTarih = useDateFormat({ dateStyle: 'full', timeZone: 'UTC' });
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());

  const bugunKey = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const [offset, setOffset] = useState(0);
  const tarih = useMemo(() => {
    const [y, m, d] = bugunKey.split('-').map(Number) as [number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d + offset));
    return dateKey(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  }, [bugunKey, offset]);

  const gun = useWorshipStore((s) => s.days[tarih]);
  const oruc = useWorshipStore((s) => s.fasts[tarih]);
  const setPrayer = useWorshipStore((s) => s.setPrayer);
  const setQuranMinutes = useWorshipStore((s) => s.setQuranMinutes);
  const setDayNote = useWorshipStore((s) => s.setDayNote);
  const setFast = useWorshipStore((s) => s.setFast);
  const clearFast = useWorshipStore((s) => s.clearFast);

  const [taslak, setTaslak] = useState<Taslak>(() => taslakOlustur(gun, oruc));
  const [kaydedildi, setKaydedildi] = useState(false);

  // Tarih değişince taslak o günün kayıtlı hâline sıfırlanır — önceki
  // tarihte kaydedilmemiş bir değişiklik varsa sessizce bırakılır, depoya
  // hiç yazılmadığı için zaten bir kaydı bozmuyordu.
  useEffect(() => {
    setTaslak(taslakOlustur(gun, oruc));
    setKaydedildi(false);
  }, [tarih]);

  const setTaslakPrayer = (slot: NamazSlot, value: 'alone' | 'jamaah' | 'qada' | null) => {
    setTaslak((onceki) => {
      const prayers = { ...onceki.prayers };
      if (value === null) delete prayers[slot];
      else prayers[slot] = value;
      return { ...onceki, prayers };
    });
    setKaydedildi(false);
  };

  const kaydet = () => {
    for (const slot of NAMAZLAR) setPrayer(tarih, slot, taslak.prayers[slot] ?? null);
    setQuranMinutes(tarih, taslak.quranMinutes);
    if (taslak.note) setDayNote(tarih, taslak.note);
    if (taslak.fast === 'none') clearFast(tarih);
    else if (taslak.fast === 'ramadanMissed') setFast(tarih, 'ramadan', false);
    else setFast(tarih, taslak.fast as FastKind, true);
    setKaydedildi(true);
  };

  const hepsiKilindi = () => {
    setTaslak((onceki) => ({
      ...onceki,
      prayers: Object.fromEntries(NAMAZLAR.map((s) => [s, onceki.prayers[s] ?? 'alone'])),
    }));
    setKaydedildi(false);
  };

  const gosterim = tamTarih.format(new Date(`${tarih}T12:00:00Z`));

  const orucSecenekleri: { id: OrucSecimi; label: string; hint?: string }[] = [
    { id: 'none', label: t('log.fastOptNone') },
    { id: 'ramadan', label: t('log.fastOptRamadan') },
    { id: 'ramadanMissed', label: t('log.fastOptRamadanMissed'), hint: t('log.fastOptRamadanMissedHint') },
    { id: 'qada', label: t('log.fastOptQada'), hint: t('log.fastOptQadaHint') },
    { id: 'nafile', label: t('log.fastOptNafile') },
  ];

  return (
    <Screen topInset={false} scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('log.title') }} />

      <Row align="center" justify="space-between">
        <IconButton name="chevronLeft" label={t('nav.back')} onPress={() => setOffset(offset - 1)} />
        <Column align="center" gap="xxs">
          <Text variant="bodyStrong">{gosterim}</Text>
          {offset === 0 ? <Text variant="micro" tone="accent">{t('common.today')}</Text> : null}
        </Column>
        <IconButton
          name="chevronRight"
          label={t('common.next')}
          disabled={offset >= 0}
          onPress={() => setOffset(Math.min(0, offset + 1))}
        />
      </Row>

      <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
        <ListItem title={t('log.stats')} subtitle={t('log.statsHint')} icon="chart"
          onPress={() => router.push('/worship-stats')} />
      </Card>

      <SectionHeader title={t('log.subtitle')} actionLabel={t('log.allPrayed')} onAction={hepsiKilindi} />
      <Card padding="sm">
        {NAMAZLAR.map((slot, i) => {
          const deger = taslak.prayers[slot] ?? null;
          return (
            <View key={slot}>
              {i > 0 ? <Divider /> : null}
              <Column gap="sm" style={{ paddingVertical: theme.spacing.sm }}>
                <Text variant="bodyStrong">{label(slot)}</Text>
                <Segmented
                  // Dört uzun etiket 320 piksellik ekranda sığmıyor; kısa
                  // karşılıklar gösterilir, ekran okuyucu uzununu okur.
                  options={[
                    { value: 'none', label: t('log.notPrayed'), short: t('log.notPrayedShort') },
                    { value: 'alone', label: t('log.prayerAlone'), short: t('log.prayerAloneShort') },
                    { value: 'jamaah', label: t('log.prayerJamaah'), short: t('log.prayerJamaahShort') },
                    { value: 'qada', label: t('log.prayerQada'), short: t('log.prayerQadaShort') },
                  ]}
                  value={deger ?? 'none'}
                  onChange={(v) => setTaslakPrayer(slot, v === 'none' ? null : (v as 'alone' | 'jamaah' | 'qada'))}
                  accessibilityLabel={label(slot)}
                />
              </Column>
            </View>
          );
        })}
      </Card>

      <SectionHeader title={t('quran.title')} />
      <Card padding="sm">
        <Stepper
          title={t('log.quranMinutes')}
          value={taslak.quranMinutes}
          min={0}
          max={600}
          step={5}
          unit={t('notification.beforeUnit')}
          onChange={(v) => { setTaslak((onceki) => ({ ...onceki, quranMinutes: v })); setKaydedildi(false); }}
        />
      </Card>

      <SectionHeader title={t('log.fasting')} subtitle={t('log.fastQuestion')} />
      <Card padding="sm">
        {orucSecenekleri.map((o) => (
          <ListItem
            key={o.id}
            title={o.label}
            {...(o.hint ? { subtitle: o.hint } : {})}
            chevron={false}
            selected={taslak.fast === o.id}
            {...(taslak.fast === o.id ? { right: <Icon name="check" size={18} color={theme.colors.accent} /> } : {})}
            onPress={() => { setTaslak((onceki) => ({ ...onceki, fast: o.id })); setKaydedildi(false); }}
          />
        ))}
      </Card>

      <Button label={t('log.save')} icon="check" block onPress={kaydet} style={{ marginTop: theme.spacing.lg }} />
      {kaydedildi ? (
        <Banner tone="success" title={t('log.saved')} style={{ marginTop: theme.spacing.md }}
          actionLabel={t('log.stats')} onAction={() => router.push('/worship-stats')} />
      ) : null}

      <Banner tone="info" title={t('settings.privacy')} description={t('log.privateNote')} />
    </Screen>
  );
}
