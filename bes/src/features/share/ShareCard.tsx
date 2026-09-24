/**
 * Paylaşım kartı bileşeni — şartname §62.
 * `card.ts` üretilen SVG'yi çizer; ekran dışında ölçeklenmiş olarak durur ve
 * `react-native-view-shot` ile PNG'ye çevrilir.
 */
import React, { forwardRef } from 'react';
import { View, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { buildCardSvg, CARD_SIZES, type BuildCardOptions } from './card';
// D17: logo yalnız verilen bitmiş master'dan gelir, burada çizilmez. Çok
// küçük işaretler için paketin kendi önerdiği sadeleştirilmiş sembol
// kullanılır (CLAUDE_HANDOFF.md madde 10).
import symbolLight from '../../../assets/brand/symbol-micro-light.png';
import symbolDark from '../../../assets/brand/symbol-micro-dark.png';

export interface ShareCardProps extends BuildCardOptions {
  /** Önizleme genişliği; gerçek çıktı her zaman tam çözünürlüktür. */
  previewWidth?: number;
  /** Kart koyu zeminliyse açık renkli işaret, açık zeminliyse koyu işaret kullanılır. */
  dark?: boolean;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { previewWidth, dark = true, ...options },
  ref,
) {
  const { width, height } = CARD_SIZES[options.format];
  const svg = buildCardSvg(options);
  const olcek = previewWidth ? previewWidth / width : 1;
  // Üst kenar boşluğu metin alanının dışındadır (bkz. card.ts `ustSinir`),
  // işaret oraya, ortalanmış olarak konur.
  const kenar = Math.round(width * 0.09);
  const isaretBoyu = Math.round(kenar * 0.7);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: width * olcek, height: height * olcek }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={options.content.body}
    >
      <SvgXml xml={svg} width={width * olcek} height={height * olcek} />
      <Image
        source={dark ? symbolLight : symbolDark}
        resizeMode="contain"
        style={{
          position: 'absolute',
          top: (kenar - isaretBoyu / 2) * olcek,
          left: (width / 2 - isaretBoyu / 2) * olcek,
          width: isaretBoyu * olcek,
          height: isaretBoyu * olcek,
        }}
      />
    </View>
  );
});
