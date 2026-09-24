/** Paylaşım kartı ekranı — şartname §62. */
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Screen, SectionHeader, Column, Row, Segmented, Toggle, Button, Text, Banner, Card,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { ShareCard } from '@/features/share/ShareCard';
import { shareCard } from '@/features/share/capture';
import type { CardFormat, CardPalette } from '@/features/share/card';
import { palette as token } from '@/theme/tokens';
import { Brand } from '@/config/brand';

const KOYU: CardPalette = {
  background: token.emerald900, surface: token.emerald800, text: token.ivory50,
  muted: token.ink300, accent: token.gold400, motif: token.gold400,
};
const ACIK: CardPalette = {
  background: token.ivory50, surface: token.white, text: token.ink900,
  muted: token.ink500, accent: token.gold600, motif: token.emerald700,
};

export default function ShareCardScreen() {
  const t = useT();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    body?: string; arabic?: string; reference?: string; source?: string;
  }>();

  const [format, setFormat] = useState<CardFormat>('portrait');
  const [koyu, setKoyu] = useState(true);
  const [motif, setMotif] = useState(true);
  const [hata, setHata] = useState(false);
  const kartRef = useRef<View>(null);
  const [gizliRef] = useState(() => React.createRef<View>());

  const icerik = useMemo(() => ({
    ...(params.arabic ? { arabic: params.arabic } : {}),
    body: params.body ?? '',
    ...(params.reference ? { reference: params.reference } : {}),
    // Kaynak künyesi kullanıcıya kapalıdır; kaldırılamaz (§107).
    source: params.source ?? Brand.appName,
    brand: Brand.appName,
  }), [params]);

  const gecerli = icerik.body.trim().length > 0;

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('share.title') }} />

      {!gecerli ? (
        <Banner tone="info" title={t('share.nothing')} description={t('share.nothingBody')} />
      ) : (
        <>
          <Card padding="md">
            <Column align="center">
              <ShareCard
                ref={kartRef}
                format={format}
                content={icerik}
                palette={koyu ? KOYU : ACIK}
                motif={motif}
                dark={koyu}
                previewWidth={260}
              />
            </Column>
          </Card>

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
          </Card>

          <Text variant="micro" tone="subtle" style={{ marginTop: theme.spacing.md }}>
            {t('share.sourceLocked')}
          </Text>

          {hata ? <Banner tone="danger" title={t('share.failed')} /> : null}

          <Row style={{ marginTop: theme.spacing.lg }}>
            <Button
              label={t('share.create')}
              icon="share"
              onPress={async () => {
                setHata(false);
                const sonuc = await shareCard(gizliRef);
                if (!sonuc.ok) setHata(true);
              }}
            />
          </Row>

          {/* Tam çözünürlüklü kart: ekran dışında durur, görsele bu alınır. */}
          <View style={{ position: 'absolute', left: -10000, top: 0 }} pointerEvents="none">
            <ShareCard
              ref={gizliRef}
              format={format}
              content={icerik}
              palette={koyu ? KOYU : ACIK}
              motif={motif}
              dark={koyu}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
