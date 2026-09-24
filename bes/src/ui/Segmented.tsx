/** Segment seçici — ikiden dörde kadar seçenek. Şartname §8. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /**
   * Dar ekranda gösterilecek kısa karşılık. Erişilebilirlik adı **her zaman**
   * uzun `label`tır; ekran okuyucu kısaltmayı okumaz.
   */
  short?: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Seçicinin **görünen** başlığı; aynı zamanda erişilebilirlik adı olur.
   * `accessibilityLabel` yalnız ekran okuyucuya konuşuyordu: gören kullanıcı
   * "Altın / Gümüş" yazan bir çubuğu neyin seçtiğini bilmeden görüyordu
   * (zekât ekranında nisap ölçüsü tam olarak böyleydi). Seçeneklerin kendisi
   * neyi seçtiğini anlatıyorsa (Sureler/Cüzler gibi) başlık verilmez.
   */
  label?: string;
  accessibilityLabel?: string;
}

export function Segmented<T extends string>({
  options, value, onChange, label, accessibilityLabel,
}: SegmentedProps<T>) {
  const theme = useTheme();
  // Dört seçenekte hücre ~70 piksele düşüyor; `callout` taşıyor.
  const variant = options.length >= 4 ? 'caption' : 'callout';
  const cubuk = (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.colors.bezemeSolgun,
        padding: theme.spacing.xxs,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              // `min-width: auto` esnek hücrenin içeriğinden küçülmesini
              // engelliyor; dört uzun etiketli seçici 320 piksellik ekranda
              // birbirinin üstüne biniyordu (ibadet defteri). Sıfırlanmazsa
              // hücre metin genişliğinin altına inemez.
              minWidth: 0,
              // 44, Apple HIG'in en küçük dokunma hedefi; Android 48dp istiyor
              // ama listede sıkışık durmasın diye hitSlop ile tamamlanıyor.
              minHeight: 44,
              paddingHorizontal: theme.spacing.xs,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              backgroundColor: active ? theme.colors.accentSurface : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: theme.colors.onAccentHighlight,
            }}
          >
            <Text variant={variant} tone={active ? 'onAccent' : 'muted'} align="center" lines={1}>
              {o.short ?? o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
  if (!label) return cubuk;
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="caption" tone="muted">{label}</Text>
      {cubuk}
    </View>
  );
}
