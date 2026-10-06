/**
 * Şerit reklam — D33, §68. Kural kararı `adAllowedNow` ile verilir ve
 * dakikada bir yenilenir: vakte 15 dk kala şerit kendiliğinden kaybolur.
 * Pro kullanıcıda, ödüllü reklamla kazanılan reklamsız sürede, izin
 * verilmeyen ekranda ya da reklam yüklenemezse hiçbir şey çizilmez — boş
 * kutu bırakılmaz.
 *
 * `sabit`: sekme çubuğunun hemen üstünde, kaydırmadan bağımsız (1 Ekim
 * kararı). 7 Ekim: yalnız ana sayfa sekmesinde ve 320×50 boyutunda. Sayfa sonuna konan şerit çoğu zaman hiç görünmüyordu; Google
 * görünmeyen reklama çok daha az ödüyor.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '@/theme/ThemeProvider';
import { usePro } from './purchases';
import { adAllowedNow, BANNER_UNIT, useAdsStore } from './adsRuntime';
import type { AdSurface } from './ads';

export function AdBanner({ surface, sabit = false }: { surface: AdSurface; sabit?: boolean }) {
  const theme = useTheme();
  const pro = usePro();
  const hazir = useAdsStore((s) => s.ready);
  const reklamsiz = useAdsStore((s) => s.adFreeUntil);
  const [izin, setIzin] = useState(false);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    const bak = () => setIzin(adAllowedNow(surface));
    bak();
    const t = setInterval(bak, 60_000);
    return () => clearInterval(t);
  }, [surface, pro, hazir, reklamsiz]);

  if (!BANNER_UNIT || !hazir || pro || !izin || hata) return null;
  return (
    <View
      style={sabit
        ? { alignItems: 'center', backgroundColor: theme.colors.accentGradient[1], borderTopWidth: 1, borderTopColor: theme.colors.bezemeSolgun }
        : { alignItems: 'center', marginTop: theme.spacing.lg }}
    >
      <BannerAd
        unitId={BANNER_UNIT}
        // 7 Ekim: uyarlanır şerit (ekran genişliği, ~60-90 pt) çok göze batıyordu;
        // standart küçük şerit (320×50) her yerde.
        size={BannerAdSize.BANNER}
        onAdFailedToLoad={() => setHata(true)}
      />
    </View>
  );
}
