/**
 * Paylaşım kartı bileşeni — şartname §62.
 *
 * Ana sayfadaki kemerli vakit panosuyla aynı dil: marka motifli zemin, altın
 * çizgili kemer çerçevesi (marka paketinin özgün çizimi, `OrnateFrame`),
 * kemerin içinde zümrüt zemin, altta cami silueti. Metin gerçek metin
 * bileşenleriyle yazılır: Arapça harfler birleşir, satırlar doğru kırılır ve
 * sığmayan metin kendiliğinden küçülür.
 *
 * Kart her boyutta 360 birim genişlik esas alınarak tasarlanır; önizleme ve
 * çıktı aynı yerleşimi `olcek` ile büyütür/küçültür.
 */
import React, { forwardRef } from 'react';
import { View, Image, Text } from 'react-native';
import { Gradient, OrnateFrame } from '@/ui';
import { BrandPattern } from '@/ui/BrandPattern';
import { palette as token } from '@/theme/tokens';
import { scriptureFont } from '@/lib/i18n/fonts';
import {
  CARD_SIZES, cardTypography, decodeEntities, truncateBody, MAX_ARABIC_CHARS,
  type CardContent, type CardFormat,
} from './card';
// D17: logo yalnız verilen bitmiş master'dan gelir, burada çizilmez.
import symbolLight from '../../../assets/brand/symbol-micro-light.png';
import symbolDark from '../../../assets/brand/symbol-micro-dark.png';
import camiSiluet from '../../../assets/brand/hero-mosque-sunset.png';

const TABAN = 360;

export interface ShareCardProps {
  format: CardFormat;
  content: CardContent;
  /** Dış zemin: koyu zümrüt ya da açık fildişi. Kemer her zaman zümrüttür. */
  dark?: boolean;
  /** Marka motifi dış zeminde görünsün mü. */
  motif?: boolean;
  /** Kemerin dibinde cami silueti. */
  scene?: boolean;
  /** Çizim genişliği (birim). Varsayılan 360. */
  width?: number;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { format, content, dark = true, motif = true, scene = true, width = TABAN },
  ref,
) {
  const oran = CARD_SIZES[format].height / CARD_SIZES[format].width;
  const W = width;
  const H = Math.round(W * oran);
  const s = W / TABAN;

  const arapca = content.arabic ? truncateBody(decodeEntities(content.arabic), MAX_ARABIC_CHARS) : '';
  const govde = truncateBody(decodeEntities(content.body));
  const punto = cardTypography(format, govde.length, arapca.length);

  const ust = Math.round(58 * s);
  const alt = Math.round(46 * s);
  const cerceveGen = W - Math.round(28 * s);
  const cerceveYuk = H - ust - alt;

  const zemin: readonly [string, string] = dark
    ? [token.emerald800, token.emerald950]
    : [token.ivory50, token.ivory200];
  const ikincil = dark ? token.gold300 : token.gold600;
  const soluk = dark ? 'rgba(251,246,236,0.62)' : 'rgba(1,29,19,0.62)';

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: W, height: H, overflow: 'hidden', backgroundColor: zemin[1] }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={govde}
    >
      <Gradient colors={zemin} />
      {motif ? <BrandPattern opacity={dark ? 0.16 : 0.22} /> : null}
      {/* İnce altın iç kenar: kartı çerçeveler, kenara taşan kırpmayı gizler. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 8 * s, left: 8 * s, right: 8 * s, bottom: 8 * s,
        borderRadius: 18 * s, borderWidth: 1, borderColor: dark ? 'rgba(211,182,133,0.45)' : 'rgba(138,106,42,0.35)' }} />

      <Image
        source={dark ? symbolLight : symbolDark}
        resizeMode="contain"
        style={{ position: 'absolute', top: 14 * s, left: W / 2 - 18 * s, width: 36 * s, height: 36 * s }}
      />

      <View style={{ position: 'absolute', top: ust, left: (W - cerceveGen) / 2 }}>
        <OrnateFrame width={cerceveGen} height={cerceveYuk} {...(scene ? { siluet: camiSiluet } : {})}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 * s,
            // Kemerin tepesindeki bezemeye değmesin: karede alan dar.
            paddingTop: (format === 'square' ? 24 : 12) * s }}>
            {content.eyebrow ? (
              <Text style={{ color: token.gold400, fontSize: 10 * s, fontWeight: '700', letterSpacing: 2 * s,
                marginBottom: 8 * s, textAlign: 'center' }}>
                {content.eyebrow.toLocaleUpperCase('tr-TR')}
              </Text>
            ) : null}
            {arapca ? (
              <Text
                numberOfLines={format === 'square' ? 3 : 5}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                style={{ fontFamily: scriptureFont(), fontSize: punto.arabic * s, lineHeight: punto.arabic * 1.75 * s,
                  color: token.ivory50, textAlign: 'center', writingDirection: 'rtl', marginBottom: 10 * s }}
              >
                {arapca}
              </Text>
            ) : null}
            <Text
              numberOfLines={format === 'square' ? 8 : 12}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={{ fontSize: punto.body * s, lineHeight: punto.body * 1.42 * s, color: token.ivory50,
                textAlign: 'center', fontWeight: arapca ? '400' : '600' }}
            >
              {govde}
            </Text>
            {content.reference ? (
              <Text style={{ color: token.gold400, fontSize: 12 * s, fontWeight: '700', marginTop: 10 * s,
                textAlign: 'center' }}>
                {content.reference}
              </Text>
            ) : null}
          </View>
        </OrnateFrame>
      </View>

      <View style={{ position: 'absolute', left: 22 * s, right: 22 * s, bottom: 16 * s, flexDirection: 'row',
        alignItems: 'center', gap: 8 * s }}>
        <Text numberOfLines={2} style={{ flex: 1, fontSize: 8.5 * s, lineHeight: 11 * s, color: soluk }}>
          {content.source}
        </Text>
        <Text style={{ fontSize: 11 * s, fontWeight: '800', letterSpacing: 1.5 * s, color: ikincil }}>
          {content.brand}
        </Text>
      </View>
    </View>
  );
});
