/** Ekran kabuğu — güvenli alan, arka plan, isteğe bağlı motif. Şartname §8. */
import React from 'react';
import { ScrollView, View, type ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Motif } from './motif/Motif';
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
  children, scroll = false, motif, padding = 'lg', topInset = true, onRefresh, refreshing = false, style,
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
      {/* Zemin logonun kendi inişini taşır; düz renk yavan duruyordu (D18). */}
      <Gradient colors={theme.colors.backgroundGradient} />
      {motif ? <Motif name={motif} /> : null}
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
    </View>
  );
}
