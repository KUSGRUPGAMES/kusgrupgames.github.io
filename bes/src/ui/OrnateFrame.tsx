/**
 * Sivri kemerli süslü çerçeve — ana sayfadaki "sıradaki vakit" kartı.
 *
 * Tasarım kaynağı ürün sahibinin onayladığı ana sayfa taslağıdır: üstte çok
 * loblu sivri kemer, kenarında ince altın hat, kemerin tepesinde küçük bir
 * rozet, altta cami silüeti.
 *
 * **Kemer SVG ile çizilir, köşe yarıçapıyla taklit edilmez.** React Native'in
 * `borderRadius`'u yalnız dairesel köşe verir; sivri kemer iki merkezli bir
 * eğridir ve yuvarlatılmış köşeyle yanına bile yaklaşılmıyor.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

let uid = 0;

/**
 * Kemerli kutunun dış hattı.
 *
 * Üst kenar: omuzdan çıkan iki yan lob, ortada sivri tepe. Alt kenar düz,
 * köşeler yumuşak. `w`/`h` kutunun ölçüsü, `omuz` kemerin başladığı yükseklik.
 */
export function kemerYolu(w: number, h: number, omuz: number, r = 18): string {
  const orta = w / 2;
  // Sivri kemer üç parçadır: omuzdan çıkan yan lob, lobdan tepeye yükselen
  // uzun yay, ve tepede iki yayın **teğetleri kesişerek** yaptığı sivri uç.
  // İlk sürümde tepe denetim noktaları yataydı; kemer tepede yuvarlanıyor,
  // sivrilik kayboluyordu. Denetim noktaları artık tepenin hemen altında ve
  // ortaya yakın: iki yay tepede dik açıyla buluşuyor.
  const lobY = omuz * 0.52;         // yan lobun en üst noktası
  const lobX = w * 0.19;            // yan lobun yatay yeri
  const boyunY = omuz * 0.34;       // lobdan sonra daralan boyun
  return `M0,${h - r}`
    + `L0,${omuz}`
    + `C0,${lobY} ${lobX * 0.30},${lobY} ${lobX},${lobY * 0.86}`
    + `C${lobX * 1.5},${boyunY} ${orta - w * 0.085},${omuz * 0.30} ${orta - w * 0.055},${omuz * 0.16}`
    + `C${orta - w * 0.030},${omuz * 0.055} ${orta - w * 0.012},0 ${orta},0`
    + `C${orta + w * 0.012},0 ${orta + w * 0.030},${omuz * 0.055} ${orta + w * 0.055},${omuz * 0.16}`
    + `C${orta + w * 0.085},${omuz * 0.30} ${w - lobX * 1.5},${boyunY} ${w - lobX},${lobY * 0.86}`
    + `C${w - lobX * 0.30},${lobY} ${w},${lobY} ${w},${omuz}`
    + `L${w},${h - r}`
    + `Q${w},${h} ${w - r},${h}`
    + `L${r},${h}`
    + `Q0,${h} 0,${h - r}Z`;
}

/**
 * Sekiz yapraklı rozet — kemerin tepesindeki mühür.
 *
 * Yapraklar **dolgun** olmalı. İlk sürümde denetim noktaları merkeze çok
 * yakındı (0.42r) ve yapraklar iğne gibi çıkıp rozet bir "kıvılcım"a
 * dönüşüyordu. Denetim noktaları artık yaprak ucunun yanında ve dışarıda:
 * yaprak damla biçiminde açılıyor.
 */
function rozet(cx: number, cy: number, r: number): string {
  const yaprak = (a: number) => {
    const uc = (m: number, ac: number) => [cx + r * m * Math.cos(ac), cy + r * m * Math.sin(ac)] as const;
    const [x, y] = uc(1, a);
    const [x1, y1] = uc(0.78, a - 0.62);
    const [x2, y2] = uc(0.78, a + 0.62);
    const [b1, b2] = uc(0.16, a);
    return `M${b1.toFixed(1)},${b2.toFixed(1)}`
      + `C${x1.toFixed(1)},${y1.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
      + `C${x.toFixed(1)},${y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${b1.toFixed(1)},${b2.toFixed(1)}Z`;
  };
  return Array.from({ length: 8 }, (_, i) => yaprak((Math.PI / 4) * i)).join(' ');
}

export interface OrnateFrameProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function OrnateFrame({ width, height, children, style }: OrnateFrameProps) {
  const theme = useTheme();
  const id = React.useMemo(() => `of${(uid += 1)}`, []);
  const omuz = Math.round(height * 0.26);
  const yol = kemerYolu(width, height, omuz);
  const altin = theme.colors.onAccentHighlight;
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.accentGradient[0]} />
            <Stop offset="1" stopColor={theme.colors.accentGradient[1]} />
          </LinearGradient>
          <ClipPath id={`${id}c`}><Path d={yol} /></ClipPath>
        </Defs>
        <Path d={yol} fill={`url(#${id}g)`} />
        <G clipPath={`url(#${id}c)`}>
          <Rect x={0} y={0} width={width} height={height} fill="transparent" />
        </G>
        {/* Dış hat: kalın altın. İç hat: iki piksel içeride, daha soluk —
            gerçek tezhipte kenar çift çizgidir, tek çizgi çıplak duruyor. */}
        <Path d={yol} fill="none" stroke={altin} strokeWidth={2} opacity={0.95} />
        <G transform={`translate(${width * 0.014} ${height * 0.012}) scale(${1 - 0.028} ${1 - 0.024})`}>
          <Path d={yol} fill="none" stroke={altin} strokeWidth={1} opacity={0.42} />
        </G>
        <Path d={rozet(width / 2, omuz * 0.34, Math.max(11, height * 0.040))} fill={altin} opacity={0.92} />
        <Path
          d={rozet(width / 2, omuz * 0.34, Math.max(5, height * 0.017))}
          fill={theme.colors.accentGradient[1]}
          opacity={0.75}
        />
      </Svg>
      <View style={{ flex: 1, paddingTop: omuz * 0.72 }}>{children}</View>
    </View>
  );
}
