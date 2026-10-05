/**
 * "Reklam izle, 4 saat reklamsız kullan" — ödüllü reklam (1 Ekim kararı).
 * Kullanıcı kendi isteğiyle başlatır; reklamı sonuna kadar izlerse 4 saat
 * hiçbir reklam görmez. Pro'da, reklam hazır değilken ya da birim yokken
 * görünmez; reklamsız süre sürerken kalan süreyi gösterir.
 */
import React, { useState } from 'react';
import { Card, ListItem } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { usePro } from './purchases';
import { REWARDED_UNIT, useAdsStore, watchRewardedForAdFree } from './adsRuntime';
import { isAdFree } from './ads';

/** `kart`: kendi kutusuyla çizilir (Pro ekranı); görünmezken boş kutu kalmaz. */
export function RewardedAdFreeItem({ kart = false }: { kart?: boolean }) {
  const t = useT();
  const theme = useTheme();
  const sar = (el: React.ReactElement) => (kart ? <Card padding="sm" style={{ marginTop: theme.spacing.md }}>{el}</Card> : el);
  const pro = usePro();
  const hazir = useAdsStore((s) => s.ready);
  const bitis = useAdsStore((s) => s.adFreeUntil);
  const [bekliyor, setBekliyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);

  if (pro || !hazir || !REWARDED_UNIT) return null;

  const simdi = Date.now();
  if (bitis !== null && isAdFree(bitis, simdi)) {
    const saat = Math.max(1, Math.ceil((bitis - simdi) / 3_600_000));
    return sar(<ListItem title={t('reward.activeTitle')} subtitle={t('reward.activeBody', { n: saat })} icon="check" chevron={false} />);
  }

  return sar(
    <ListItem
      title={t('reward.title')}
      subtitle={sonuc ?? t('reward.body')}
      icon="play"
      chevron={false}
      disabled={bekliyor}
      onPress={() => {
        setBekliyor(true);
        setSonuc(null);
        void watchRewardedForAdFree().then((s) => {
          setBekliyor(false);
          if (s === 'vazgecildi') setSonuc(t('reward.cancelled'));
          if (s === 'hata') setSonuc(t('reward.failed'));
        });
      }}
    />
  );
}
