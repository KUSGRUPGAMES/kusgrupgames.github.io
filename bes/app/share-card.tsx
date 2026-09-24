/**
 * Paylaşım kartı ekranı — şartname §62.
 *
 * İki giriş: okuyucudan seçilen âyet (parametrelerle gelir) ya da hazır
 * kartlar (cuma, bayram, kandil, Ramazan, âyet, gün selamı). Hazır kartlar
 * her zaman aşağıda durur; parametreyle gelinmişse ilk seçenek o metindir.
 */
import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Screen, SectionHeader, Column, Segmented, Toggle, Button, Text, Banner, Card, Chip, Row,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';
import { ShareCard } from '@/features/share/ShareCard';
import { shareCard } from '@/features/share/capture';
import type { CardContent, CardFormat } from '@/features/share/card';
import { resolveTemplate } from '@/features/share/templates';
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/content/cardTemplates';
import { Brand } from '@/config/brand';

const KATEGORI_ADI: Record<TemplateCategory, StringKey> = {
  friday: 'share.catFriday', eid: 'share.catEid', kandil: 'share.catKandil',
  ramadan: 'share.catRamadan', verse: 'share.catVerse', daily: 'share.catDaily',
};

type Secim = 'own' | TemplateCategory;

export default function ShareCardScreen() {
  const t = useT();
  const theme = useTheme();
  const { width: ekran } = useWindowDimensions();
  const params = useLocalSearchParams<{
    body?: string; arabic?: string; reference?: string; source?: string;
  }>();

  const kendi: CardContent | null = useMemo(() => (params.body?.trim() ? {
    ...(params.arabic ? { arabic: params.arabic } : {}),
    body: params.body,
    ...(params.reference ? { reference: params.reference } : {}),
    // Kaynak künyesi kullanıcıya kapalıdır; kaldırılamaz (§107).
    source: params.source ?? Brand.appName,
    brand: Brand.appName,
  } : null), [params]);

  const [secim, setSecim] = useState<Secim>(kendi ? 'own' : 'friday');
  const [sablonId, setSablonId] = useState<string | null>(null);
  const [format, setFormat] = useState<CardFormat>('portrait');
  const [koyu, setKoyu] = useState(true);
  const [motif, setMotif] = useState(true);
  const [sahne, setSahne] = useState(true);
  const [hata, setHata] = useState(false);
  const gizliRef = useRef<View>(null);

  const etiketler = useMemo(() => ({
    greetingSource: t('share.greetingSource'),
    translationSource: (name: string) => t('quran.translationSource', { name, rights: t('quran.publicDomain') }),
    brand: Brand.appName,
  }), [t]);

  const sablonlar = useMemo(
    () => (secim === 'own' ? [] : CARD_TEMPLATES
      .filter((s) => s.category === secim)
      .map((s) => ({ s, icerik: resolveTemplate(s, etiketler) }))
      .filter((x): x is { s: typeof x.s; icerik: CardContent } => x.icerik !== null)),
    [secim, etiketler],
  );

  const icerik: CardContent | null = secim === 'own'
    ? kendi
    : (sablonlar.find((x) => x.s.id === sablonId) ?? sablonlar[0])?.icerik ?? null;
  const seciliId = secim === 'own' ? null : (sablonlar.find((x) => x.s.id === sablonId) ?? sablonlar[0])?.s.id;

  const onizleme = Math.min(ekran - theme.spacing.lg * 2 - theme.spacing.md * 2, format === 'story' ? 250 : 320);

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('share.title') }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
        {kendi ? (
          <Chip label={t('share.thisContent')} selected={secim === 'own'} onPress={() => setSecim('own')} />
        ) : null}
        {TEMPLATE_CATEGORIES.map((k) => (
          <Chip key={k} label={t(KATEGORI_ADI[k])} selected={secim === k}
            onPress={() => { setSecim(k); setSablonId(null); }} />
        ))}
      </ScrollView>

      {icerik ? (
        <Card padding="md">
          <Column align="center">
            <ShareCard format={format} content={icerik} dark={koyu} motif={motif} scene={sahne} width={onizleme} />
          </Column>
        </Card>
      ) : (
        <Banner tone="info" title={t('share.nothing')} description={t('share.nothingBody')} />
      )}

      {sablonlar.length > 1 ? (
        <>
          <SectionHeader title={t('share.templates')} subtitle={t('share.templatesHint')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
            {sablonlar.map(({ s, icerik: c }) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected: seciliId === s.id }}
                accessibilityLabel={c.body}
                onPress={() => setSablonId(s.id)}
                style={{ width: 180, minHeight: 96, padding: theme.spacing.md, borderRadius: theme.radius.lg,
                  borderWidth: seciliId === s.id ? 2 : 1,
                  borderColor: seciliId === s.id ? theme.colors.highlight : theme.colors.bezemeSolgun,
                  backgroundColor: theme.colors.surface }}
              >
                <Text variant="micro" tone="highlight" lines={1}>{c.reference ?? c.eyebrow ?? ''}</Text>
                <Text variant="caption" lines={4} style={{ marginTop: theme.spacing.xxs }}>{c.body}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {icerik ? (
        <>
          <SectionHeader title={t('share.format')} />
          <Segmented
            options={[
              { value: 'story', label: t('share.story') },
              { value: 'square', label: t('share.square') },
              { value: 'portrait', label: t('share.portrait') },
            ]}
            value={format}
            onChange={(v) => setFormat(v as CardFormat)}
            accessibilityLabel={t('share.format')}
          />

          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            <Toggle title={t('share.themeDark')} value={koyu} onChange={setKoyu} />
            <Toggle title={t('share.motif')} value={motif} onChange={setMotif} />
            <Toggle title={t('share.scene')} value={sahne} onChange={setSahne} />
          </Card>

          <Text variant="micro" tone="subtle" style={{ marginTop: theme.spacing.md }}>
            {t('share.sourceLocked')}
          </Text>

          {hata ? <Banner tone="danger" title={t('share.failed')} /> : null}

          <Row style={{ marginTop: theme.spacing.lg }}>
            <Button
              label={t('share.create')}
              icon="share"
              block
              onPress={async () => {
                setHata(false);
                const sonuc = await shareCard(gizliRef);
                if (!sonuc.ok) setHata(true);
              }}
            />
          </Row>

          {/* Tam boy kart (360 birim; 3x ekranda 1080 piksel): ekran dışında
              durur, görsele bu alınır. */}
          <View style={{ position: 'absolute', left: -10000, top: 0 }} pointerEvents="none">
            <ShareCard ref={gizliRef} format={format} content={icerik} dark={koyu} motif={motif} scene={sahne} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
