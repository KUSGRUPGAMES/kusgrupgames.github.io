/** Mukabele ve hatim takibi — şartname §48. */
import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Button, Field, ProgressBar,
  Banner, EmptyState, IconButton,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useWorshipStore } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { khatmStatus, JUZ_TOTAL } from '@/features/ramadan/calc';
import { getJuzStarts } from '@/features/quran/data';
import { dateKey } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

export default function KhatmScreen() {
  const t = useT();
  const theme = useTheme();
  const konum = useLocationStore((s) => s.active());
  const khatms = useWorshipStore((s) => s.khatms);
  const startKhatm = useWorshipStore((s) => s.startKhatm);
  const toggleJuz = useWorshipStore((s) => s.toggleJuz);
  const finishKhatm = useWorshipStore((s) => s.finishKhatm);

  const [ad, setAd] = useState('');
  const [hedef, setHedef] = useState('');

  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const etkin = khatms.find((k) => k.active) ?? null;
  const durum = etkin
    ? khatmStatus(
        {
          completedJuz: etkin.completedJuz,
          startedOn: etkin.startedOn,
          ...(etkin.targetOn ? { targetOn: etkin.targetOn } : {}),
        },
        bugun,
      )
    : null;

  const cuzBaslari = useMemo(() => getJuzStarts(), []);

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('khatm.title') }} />

      {!etkin ? (
        <>
          <EmptyState icon="book" title={t('khatm.none')} description={t('khatm.noneBody')} />
          <Column gap="md">
            <Field label={t('khatm.newTitle')} value={ad} onChangeText={setAd} />
            <Field
              label={t('khatm.target')}
              hint={t('khatm.targetHint')}
              value={hedef}
              onChangeText={setHedef}
              placeholder="2026-03-30"
            />
            <Row>
              <Button
                label={t('khatm.start')}
                icon="plus"
                onPress={() => {
                  const gecerli = /^\d{4}-\d{2}-\d{2}$/.test(hedef.trim());
                  startKhatm(ad.trim() || t('khatm.title'), bugun, gecerli ? hedef.trim() : undefined);
                  setAd('');
                  setHedef('');
                }}
              />
            </Row>
          </Column>
        </>
      ) : (
        <>
          <Card accent motif="starLattice">
            <Column gap="md">
              <Text variant="callout" tone="onAccent">{etkin.title}</Text>
              <Text variant="title1" tone="onAccent">
                {t('khatm.progress', { done: durum!.completed })}
              </Text>
              <ProgressBar
                value={durum!.ratio}
                height={10}
                color={theme.colors.onAccent}
                accessibilityLabel={t('khatm.progress', { done: durum!.completed })}
              />
              {durum!.dailyPace !== null && durum!.remaining > 0 ? (
                <Text variant="caption" tone="onAccent">
                  {t('khatm.dailyPace', { n: durum!.dailyPace })}
                </Text>
              ) : null}
              {durum!.daysLeft !== null && !durum!.overdue ? (
                <Text variant="caption" tone="onAccent">
                  {t('khatm.daysLeft', { days: durum!.daysLeft })}
                </Text>
              ) : null}
            </Column>
          </Card>

          {durum!.overdue ? (
            <Banner tone="warning" title={t('khatm.overdue')} description={t('khatm.dailyPace', { n: durum!.dailyPace ?? 0 })} />
          ) : null}

          <SectionHeader title={t('quran.juz')} />
          <Card padding="md">
            <Row gap="sm" wrap>
              {Array.from({ length: JUZ_TOTAL }, (_, i) => i + 1).map((juz) => {
                const bitti = etkin.completedJuz.includes(juz);
                return (
                  <Pressable
                    key={juz}
                    onPress={() => toggleJuz(etkin.id, juz)}
                    onLongPress={() => {
                      const bas = cuzBaslari.find((c) => c.juz === juz);
                      if (bas) router.push(`/reader?surah=${bas.surah}&ayah=${bas.ayah}`);
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: bitti }}
                    accessibilityLabel={t('quran.juzNo', { n: juz })}
                    style={{
                      width: 48, height: 48, borderRadius: theme.radius.md,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: bitti ? theme.colors.accent : theme.colors.surfaceRaised,
                      borderWidth: 1,
                      borderColor: bitti ? theme.colors.accent : theme.colors.border,
                    }}
                  >
                    <Text variant="bodyStrong" tone={bitti ? 'onAccent' : 'muted'}>{String(juz)}</Text>
                  </Pressable>
                );
              })}
            </Row>
          </Card>

          <Row gap="sm" style={{ marginTop: theme.spacing.lg }}>
            <Button
              label={t('khatm.readJuz')}
              icon="book"
              variant="secondary"
              size="sm"
              onPress={() => {
                const sonraki = Array.from({ length: JUZ_TOTAL }, (_, i) => i + 1)
                  .find((j) => !etkin.completedJuz.includes(j)) ?? 1;
                const bas = cuzBaslari.find((c) => c.juz === sonraki);
                if (bas) router.push(`/reader?surah=${bas.surah}&ayah=${bas.ayah}`);
              }}
            />
            <View style={{ flex: 1 }} />
            <IconButton name="check" label={t('khatm.finish')} onPress={() => finishKhatm(etkin.id)} />
          </Row>
        </>
      )}
    </Screen>
  );
}
