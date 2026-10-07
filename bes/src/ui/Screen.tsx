/** Ekran kabuğu — güvenli alan, arka plan, isteğe bağlı motif. Şartname §8. */
import React from 'react';
import { ScrollView, View, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandPattern } from './BrandPattern';
import { Gradient } from './Gradient';
import type { MotifAdi } from './motif/Motif';
import type { Spacing } from '@/theme/tokens';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  motif?: MotifAdi;
  padding?: Spacing;
  /** Üst güvenli alan boşluğu uygulansın mı (kendi başlığı olan ekranlarda kapatılır). */
  topInset?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
}

export function Screen({
  children, scroll = false, padding = 'lg', topInset = true, onRefresh, refreshing = false, style,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pad = theme.spacing[padding];
  const content: ViewStyle = {
    paddingHorizontal: pad,
    paddingTop: topInset ? insets.top + pad : pad,
    paddingBottom: insets.bottom + pad,
    // İçerik ekrandan kısaysa kapsayıcı yine de ekranı doldurur; böylece
    // esnek bir boşluk düğmeleri alta itebilir (açılış akışı). İçerik
    // uzunsa hiçbir şey değişmez.
    flexGrow: 1,
  };
  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}>
      {/* Aynı zümrüt/fildişi zemin ve gerçek döşenmiş marka motifi her ekranda. */}
      <Gradient colors={theme.colors.backgroundGradient} />
      <BrandPattern opacity={theme.opacity.motifEkran} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh
              ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
              : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {/* Durum çubuğu zemini: başlıksız ekranlarda (sekmeler) kaydırılan
          içerik saatin ve pilin altına giriyor, açık temada yazılar birbirine
          karışıyordu. Zemin rengiyle örtülür; başlıklı ekranlarda başlık
          çubuğu bu işi zaten yapar. */}
      {topInset && insets.top > 0 ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top,
          backgroundColor: theme.colors.backgroundGradient[0], opacity: 0.96 }} />
      ) : null}
    </View>
  );
}
