/**
 * BEŞ Pro — satın alma sayfası (D33).
 *
 * App Review'un abonelik sayfasında istediği her şey burada: fiyat ve dönem
 * mağazanın yerelleştirilmiş metninden, otomatik yenileme açıklaması,
 * "satın alımları geri yükle", gizlilik ve kullanım koşulları bağlantıları.
 * Ücretsiz kalanlar da açıkça yazılır: kilit kandırıcı değildir (§66).
 */
import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, Card, Column, Row, Text, Button, Banner, EmptyState, Icon, ListItem, Skeleton,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { openLegalPage } from '@/lib/legal';
import {
  buyPlan, loadPlans, purchasesAvailable, restorePurchases, usePro, type Plan,
} from '@/features/pro/purchases';
import type { IconName } from '@/ui/Icon';

const YONETIM = Platform.OS === 'ios'
  ? 'https://apps.apple.com/account/subscriptions'
  : 'https://play.google.com/store/account/subscriptions';

export default function ProScreen() {
  const t = useT();
  const theme = useTheme();
  const pro = usePro();
  const [planlar, setPlanlar] = useState<Plan[] | null>(null);
  const [yukHata, setYukHata] = useState(false);
  const [secili, setSecili] = useState<Plan['kind'] | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [sonuc, setSonuc] = useState<{ tone: 'success' | 'warning'; title: string } | null>(null);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let alive = true;
    loadPlans()
      .then((p) => { if (!alive) return; setPlanlar(p); setSecili(p[0]?.kind ?? null); })
      .catch(() => { if (alive) { setPlanlar([]); setYukHata(true); } });
    return () => { alive = false; };
  }, []);

  const baslik = <Stack.Screen options={{ headerShown: true, title: t('pro.title') }} />;

  if (!purchasesAvailable) {
    return (
      <Screen topInset={false} scroll>
        {baslik}
        <EmptyState icon="star" title={t('pro.notReadyTitle')} description={t('pro.notReadyBody')} />
      </Screen>
    );
  }

  const satinAl = async () => {
    const plan = planlar?.find((p) => p.kind === secili);
    if (!plan) return;
    setCalisiyor(true);
    setSonuc(null);
    const r = await buyPlan(plan);
    setCalisiyor(false);
    if (r === 'error') setSonuc({ tone: 'warning', title: t('pro.failed') });
  };

  const geriYukle = async () => {
    setCalisiyor(true);
    setSonuc(null);
    const ok = await restorePurchases();
    setCalisiyor(false);
    setSonuc(ok ? { tone: 'success', title: t('pro.restored') } : { tone: 'warning', title: t('pro.restoreNone') });
  };

  const fiyatMetni = (p: Plan) => t(p.kind === 'annual' ? 'pro.perYear' : p.kind === 'monthly' ? 'pro.perMonth' : 'pro.once', { price: p.price });
  const planAdi = (p: Plan) => t(p.kind === 'annual' ? 'pro.planAnnual' : p.kind === 'monthly' ? 'pro.planMonthly' : 'pro.planLifetime');

  const fayda = (icon: IconName, baslikMetni: string, alt: string) => (
    <ListItem title={baslikMetni} subtitle={alt} icon={icon} chevron={false} />
  );

  return (
    <Screen topInset={false} scroll motif="marka">
      {baslik}
      <Card accent>
        <Column gap="xs">
          <Text variant="title2" tone="onAccent">{t('pro.title')}</Text>
          <Text variant="body" tone="onAccent">{pro ? t('pro.activeBody') : t('pro.tagline')}</Text>
        </Column>
      </Card>

      <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
        {fayda('close', t('pro.benefitNoAds'), t('pro.benefitNoAdsHint'))}
        {fayda('book', t('pro.benefitLearn'), t('pro.benefitLearnHint'))}
        {fayda('users', t('pro.benefitCommunity'), t('pro.benefitCommunityHint'))}
      </Card>
      <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.sm }}>{t('pro.alwaysFree')}</Text>

      {pro ? (
        <Column gap="md" style={{ marginTop: theme.spacing.lg }}>
          <Banner tone="success" title={t('pro.active')} />
          <Button label={t('pro.manage')} variant="secondary" block onPress={() => { void Linking.openURL(YONETIM); }} />
        </Column>
      ) : (
        <Column gap="sm" style={{ marginTop: theme.spacing.lg }}>
          {planlar === null ? <Skeleton height={64} /> : null}
          {yukHata ? <Banner tone="warning" title={t('pro.loadFailed')} /> : null}
          {(planlar ?? []).map((p) => {
            const sec = p.kind === secili;
            return (
              <Pressable
                key={p.kind}
                accessibilityRole="radio"
                accessibilityState={{ selected: sec }}
                accessibilityLabel={`${planAdi(p)}, ${fiyatMetni(p)}`}
                onPress={() => setSecili(p.kind)}
              >
                <Card padding="md" style={{ borderWidth: sec ? 2 : 1, borderColor: sec ? theme.colors.highlight : theme.colors.controlBorder }}>
                  <Row align="center" justify="space-between">
                    <Column gap="xxs" style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{planAdi(p)}</Text>
                      <Text variant="callout" tone="muted">{fiyatMetni(p)}</Text>
                    </Column>
                    {sec ? <Icon name="check" size={20} color={theme.colors.highlight} /> : null}
                  </Row>
                </Card>
              </Pressable>
            );
          })}
          {planlar && planlar.length > 0 ? (
            <Button label={t('pro.buy')} size="lg" block loading={calisiyor} onPress={() => { void satinAl(); }} />
          ) : null}
        </Column>
      )}

      {sonuc ? <Banner tone={sonuc.tone} title={sonuc.title} style={{ marginTop: theme.spacing.md }} /> : null}

      <Button label={t('pro.restore')} variant="ghost" block disabled={calisiyor}
        onPress={() => { void geriYukle(); }} style={{ marginTop: theme.spacing.md }} />

      <Text variant="micro" tone="subtle" style={{ marginTop: theme.spacing.md }}>{t('pro.renewNote')}</Text>
      <Row gap="lg" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxl }}>
        <Pressable accessibilityRole="link" onPress={() => openLegalPage('terms')}>
          <Text variant="micro" tone="accent">{t('settings.terms')}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => openLegalPage('privacy')}>
          <Text variant="micro" tone="accent">{t('settings.privacy')}</Text>
        </Pressable>
      </Row>
    </Screen>
  );
}
