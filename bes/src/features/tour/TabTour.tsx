/**
 * Sekme tanıtımı — ilk kullanım öğreticisi (kullanıcı isteği, 1 Ekim).
 *
 * Her sekme ilk kez açıldığında o bölümün ana başlıklarını adım adım, kısa
 * açıklamalarla anlatan bir kart çıkar. Kurallar:
 * - Her sekmede bir kez gösterilir (`tour.seen`).
 * - Her adımda "Tanıtımı atla" vardır; basılırsa hiçbir sekmede bir daha
 *   gösterilmez (`tour.skipped`).
 * - Onboarding bitmeden gösterilmez (ana sayfaya ilk gelişte başlar).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Column, Icon, Row, Text, type IconName } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { kv } from '@/boot/storage';
import type { Codec } from '@/lib/storage/kv';
import { TOUR_STEPS, type TourTab } from './steps';

interface TourState { seen: string[]; skipped: boolean }

const KEY = 'tour';
const codec: Codec<TourState> = {
  parse: (r) => {
    const o = r as Partial<TourState> | null;
    return { seen: Array.isArray(o?.seen) ? o.seen.filter((x): x is string => typeof x === 'string') : [], skipped: o?.skipped === true };
  },
  fallback: { seen: [], skipped: false },
};

/** Tanıtımı her sekmede yeniden göstermek için (Ayarlar → "Tanıtımı yeniden göster"). */
export async function resetTour(): Promise<void> {
  await kv.write(KEY, { seen: [], skipped: false });
}

export function TabTour({ tab }: { tab: TourTab }) {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState(0);
  const adimlar = TOUR_STEPS[tab];

  useFocusEffect(useCallback(() => {
    let alive = true;
    void kv.read(KEY, codec).then((s) => {
      if (alive && !s.skipped && !s.seen.includes(tab)) { setAdim(0); setAcik(true); }
    });
    return () => { alive = false; };
  }, [tab]));

  const kapat = useCallback(async (atla: boolean) => {
    setAcik(false);
    const s = await kv.read(KEY, codec);
    await kv.write(KEY, { seen: [...new Set([...s.seen, tab])], skipped: s.skipped || atla });
  }, [tab]);

  useEffect(() => { if (!acik) setAdim(0); }, [acik]);

  const a = adimlar[adim];
  if (!a) return null;
  const son = adim === adimlar.length - 1;

  return (
    <Modal visible={acik} transparent animationType="fade" onRequestClose={() => { void kapat(false); }}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: `rgba(0,0,0,${theme.opacity.overlay})` }}>
        <View style={{
          margin: theme.spacing.lg, marginBottom: insets.bottom + theme.spacing.lg,
          padding: theme.spacing.lg, borderRadius: theme.radius.xxl,
          backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.bezemeSolgun,
        }}>
          <Column gap="md">
            <Row align="center" justify="space-between">
              <Text variant="micro" tone="highlight">{t('tour.step', { current: adim + 1, total: adimlar.length })}</Text>
              <Pressable accessibilityRole="button" onPress={() => { void kapat(true); }} hitSlop={12}>
                <Text variant="caption" tone="muted">{t('tour.skip')}</Text>
              </Pressable>
            </Row>
            <Row gap="md" align="center">
              <View style={{
                width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.colors.accentSurface, borderWidth: 1, borderColor: theme.colors.bezemeSolgun,
              }}>
                <Icon name={a.icon as IconName} size={24} color={theme.colors.highlight} />
              </View>
              <Text variant="title3" style={{ flex: 1 }}>{t(a.title)}</Text>
            </Row>
            <Text variant="body" tone="muted">{t(a.body)}</Text>
            <Row gap="sm" align="center">
              {adimlar.map((_, i) => (
                <View key={i} style={{
                  width: i === adim ? 18 : 6, height: 6, borderRadius: 3,
                  backgroundColor: i === adim ? theme.colors.highlight : theme.colors.bezemeSolgun,
                }} />
              ))}
              <View style={{ flex: 1 }} />
              {adim > 0 ? <Button label={t('nav.back')} variant="ghost" size="sm" onPress={() => setAdim(adim - 1)} /> : null}
              <Button
                label={son ? t('tour.done') : t('common.next')}
                size="sm"
                onPress={() => (son ? void kapat(false) : setAdim(adim + 1))}
              />
            </Row>
          </Column>
        </View>
      </View>
    </Modal>
  );
}
