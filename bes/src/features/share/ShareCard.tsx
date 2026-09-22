/**
 * Paylaşım kartı bileşeni — şartname §62.
 * `card.ts` üretilen SVG'yi çizer; ekran dışında ölçeklenmiş olarak durur ve
 * `react-native-view-shot` ile PNG'ye çevrilir.
 */
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { buildCardSvg, CARD_SIZES, type BuildCardOptions } from './card';

export interface ShareCardProps extends BuildCardOptions {
  /** Önizleme genişliği; gerçek çıktı her zaman tam çözünürlüktür. */
  previewWidth?: number;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { previewWidth, ...options },
  ref,
) {
  const { width, height } = CARD_SIZES[options.format];
  const svg = buildCardSvg(options);
  const olcek = previewWidth ? previewWidth / width : 1;

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
    </View>
  );
});
