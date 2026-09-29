/**
 * Alt şerit reklamı — D33, §68. Kural kararı `adAllowedNow` ile verilir ve
 * dakikada bir yenilenir: vakte 15 dk kala şerit kendiliğinden kaybolur.
 * Pro kullanıcıda, izin verilmeyen ekranda ya da reklam yüklenemezse hiçbir
 * şey çizilmez — boş kutu bırakılmaz.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '@/theme/ThemeProvider';
import { usePro } from './purchases';
import { adAllowedNow, BANNER_UNIT, useAdsStore } from './adsRuntime';
import type { AdSurface } from './ads';

export function AdBanner({ surface }: { surface: AdSurface }) {
  const theme = useTheme();
  const pro = usePro();
  const hazir = useAdsStore((s) => s.ready);
  const [izin, setIzin] = useState(false);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    const bak = () => setIzin(adAllowedNow(surface));
    bak();
    const t = setInterval(bak, 60_000);
    return () => clearInterval(t);
  }, [surface, pro, hazir]);

  if (!BANNER_UNIT || !hazir || pro || !izin || hata) return null;
  return (
    <View style={{ alignItems: 'center', marginTop: theme.spacing.lg }}>
      <BannerAd unitId={BANNER_UNIT} size={BannerAdSize.BANNER} onAdFailedToLoad={() => setHata(true)} />
    </View>
  );
}
