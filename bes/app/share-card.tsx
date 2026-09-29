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
import { ShareCard, type CardStyle } from '@/features/share/ShareCard';
import { shareCard } from '@/features/share/capture';
import type { CardContent, CardFormat } from '@/features/share/card';
import { resolveTemplate } from '@/features/share/templates';
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/content/cardTemplates';
import { Brand } from '@/config/brand';
import { useI18n } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useContentItems } from '@/features/community/content';
import { maybeShowInterstitial } from '@/features/pro/adsRuntime';

const KATEGORI_ADI: Record<TemplateCategory, StringKey> = {
  friday: 'share.catFriday', eid: 'share.catEid', kandil: 'share.catKandil',
  ramadan: 'share.catRamadan', dua: 'share.catDua', verse: 'share.catVerse', daily: 'share.catDaily',
};

/**
 * "community": yönetici panelinden eklenen ek hazır kartlar (D31,
 * `content_items` tür `share_card`) — mevcut, doğrulanmış katalogdan
 * (`CARD_TEMPLATES`) TAMAMEN AYRI, yalnız topluluk açıkken görünen bir ek
 * kaynak. Âyet çözümlemesi gerekmez, metin zaten hazır gelir.
 */
type Secim = 'own' | TemplateCategory | 'community';

export default function ShareCardScreen() {
  const t = useT();
  const theme = useTheme();
  const { language } = useI18n();
  const settings = useSettingsStore((s) => s.settings);
  const toplulukIcerik = useContentItems('share_card', language, settings.community.enabled);
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
  const [stil, setStil] = useState<CardStyle>('emerald');
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
    () => (secim === 'own' || secim === 'community' ? [] : CARD_TEMPLATES
      .filter((s) => s.category === secim)
      .map((s) => ({ id: s.id, icerik: resolveTemplate(s, etiketler) }))
      .filter((x): x is { id: string; icerik: CardContent } => x.icerik !== null)),
    [secim, etiketler],
  );

  const toplulukKartlari = useMemo(
    () => (toplulukIcerik.data ?? []).map((c): { id: string; icerik: CardContent } => ({
      id: c.id,
      icerik: {
        body: c.body,
        ...(typeof c.extra.arabic === 'string' ? { arabic: c.extra.arabic } : {}),
        ...(typeof c.extra.reference === 'string' ? { reference: c.extra.reference } : {}),
        source: Brand.appName,
        brand: Brand.appName,
      },
    })),
    [toplulukIcerik.data],
  );

  const listelenenler = secim === 'community' ? toplulukKartlari : sablonlar;

  const icerik: CardContent | null = secim === 'own'
    ? kendi
    : (listelenenler.find((x) => x.id === sablonId) ?? listelenenler[0])?.icerik ?? null;
  const seciliId = secim === 'own' ? null : (listelenenler.find((x) => x.id === sablonId) ?? listelenenler[0])?.id;

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
        {settings.community.enabled ? (
          <Chip label={t('share.catCommunity')} selected={secim === 'community'}
            onPress={() => { setSecim('community'); setSablonId(null); }} />
        ) : null}
      </ScrollView>

      {icerik ? (
        <Card padding="md">
          <Column align="center">
            <ShareCard format={format} content={icerik} cardStyle={stil} motif={motif} scene={sahne} width={onizleme} />
          </Column>
        </Card>
      ) : (
        <Banner tone="info" title={t('share.nothing')} description={t('share.nothingBody')} />
      )}

      {listelenenler.length > 1 ? (
        <>
          <SectionHeader title={t('share.templates')} subtitle={t('share.templatesHint')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
            {listelenenler.map(({ id, icerik: c }) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected: seciliId === id }}
                accessibilityLabel={c.body}
                onPress={() => setSablonId(id)}
                style={{ width: 180, minHeight: 96, padding: theme.spacing.md, borderRadius: theme.radius.lg,
                  borderWidth: seciliId === id ? 2 : 1,
                  borderColor: seciliId === id ? theme.colors.highlight : theme.colors.bezemeSolgun,
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

          <SectionHeader title={t('share.style')} />
          <Segmented
            options={[
              { value: 'emerald', label: t('share.styleEmerald') },
              { value: 'ivory', label: t('share.styleIvory') },
              { value: 'gold', label: t('share.styleGold') },
            ]}
            value={stil}
            onChange={(v) => setStil(v as CardStyle)}
            accessibilityLabel={t('share.style')}
          />

          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
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
                if (!sonuc.ok) { setHata(true); return; }
                // Paylaşım bitti: doğal bir duraklama, kurallar izin verirse tam ekran reklam (D33).
                maybeShowInterstitial('explore');
              }}
            />
          </Row>

          {/* Tam boy kart (360 birim; 3x ekranda 1080 piksel): ekran dışında
              durur, görsele bu alınır. */}
          <View style={{ position: 'absolute', left: -10000, top: 0 }} pointerEvents="none">
            <ShareCard ref={gizliRef} format={format} content={icerik} cardStyle={stil} motif={motif} scene={sahne} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
