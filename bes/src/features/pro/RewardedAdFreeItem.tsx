/**
 * "Reklam izle, 4 saat reklamsız kullan" — ödüllü reklam (1 Ekim kararı).
 * Kullanıcı kendi isteğiyle başlatır; reklamı sonuna kadar izlerse 4 saat
 * hiçbir reklam görmez. Pro'da ya da birim yokken görünmez.
 *
 * Reklamsız süre sürerken kalan süre saniye saniye geri sayılır (5 Ekim):
 * kullanıcı ne zaman biteceğini görüp yeniden izleyip izlemeyeceğine karar
 * verir. Yeniden izlemek süreyi üst üste eklemez, izlenen andan itibaren
 * yeniden 4 saate çıkarır. Geri sayım reklam hazır olmasa da görünür.
 */
import React, { useEffect, useState } from 'react';
import { Card, ListItem, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { formatCountdown } from '@/features/prayer/calc';
import { usePro } from './purchases';
import { REWARDED_UNIT, useAdsStore, watchRewardedForAdFree } from './adsRuntime';
import { isAdFree } from './ads';

/** Reklamsız süre sürerken saniyede bir yenilenen "şimdi"; süre yokken sayaç çalışmaz. */
function useSimdi(bitis: number | null): number {
  const [simdi, setSimdi] = useState(() => Date.now());
  const aktif = isAdFree(bitis, simdi);
  useEffect(() => {
    if (!aktif) return undefined;
    const z = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(z);
  }, [aktif, bitis]);
  // Yeni ödül alınınca beklemeden güncel süreden başla.
  useEffect(() => { setSimdi(Date.now()); }, [bitis]);
  return simdi;
}

/** `kart`: kendi kutusuyla çizilir (Pro ekranı); görünmezken boş kutu kalmaz. */
export function RewardedAdFreeItem({ kart = false }: { kart?: boolean }) {
  const t = useT();
  const theme = useTheme();
  const sar = (el: React.ReactElement) => (kart ? <Card padding="sm" style={{ marginTop: theme.spacing.md }}>{el}</Card> : el);
  const pro = usePro();
  const hazir = useAdsStore((s) => s.ready);
  const bitis = useAdsStore((s) => s.adFreeUntil);
  const simdi = useSimdi(bitis);
  const [bekliyor, setBekliyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);

  if (pro || !REWARDED_UNIT) return null;
  const aktif = isAdFree(bitis, simdi);
  if (!aktif && !hazir) return null;

  const izle = () => {
    setBekliyor(true);
    setSonuc(null);
    void watchRewardedForAdFree().then((s) => {
      setBekliyor(false);
      if (s === 'vazgecildi') setSonuc(t('reward.cancelled'));
      if (s === 'hata') setSonuc(t('reward.failed'));
    });
  };

  if (aktif && bitis !== null) {
    return sar(
      <>
        <ListItem
          title={t('reward.activeTitle')}
          subtitle={t('reward.activeBody')}
          icon="check"
          chevron={false}
          right={(
            <Text variant="numericSmall" accessibilityLabel={`${t('reward.activeBody')} ${formatCountdown((bitis - simdi) / 1000)}`}>
              {formatCountdown((bitis - simdi) / 1000)}
            </Text>
          )}
        />
        {hazir ? (
          <ListItem
            title={t('reward.renewTitle')}
            subtitle={sonuc ?? t('reward.renewBody')}
            icon="play"
            chevron={false}
            disabled={bekliyor}
            onPress={izle}
          />
        ) : null}
      </>
    );
  }

  return sar(
    <ListItem
      title={t('reward.title')}
      subtitle={sonuc ?? t('reward.body')}
      icon="play"
      chevron={false}
      disabled={bekliyor}
      onPress={izle}
    />
  );
}
