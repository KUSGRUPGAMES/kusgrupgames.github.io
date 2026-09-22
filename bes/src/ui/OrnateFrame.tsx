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
  const tepe = 0;
  const lob = omuz * 0.46;          // yan lobun tepesi
  return `M0,${h - r}`
    + `L0,${omuz}`
    // sol yan lob
    + `C0,${lob} ${w * 0.10},${lob} ${w * 0.16},${lob * 0.72}`
    // sol yükseliş, sivri tepeye
    + `C${w * 0.24},${lob * 0.30} ${orta - w * 0.16},${tepe + h * 0.012} ${orta},${tepe}`
    // sağ iniş
    + `C${orta + w * 0.16},${tepe + h * 0.012} ${w * 0.76},${lob * 0.30} ${w * 0.84},${lob * 0.72}`
    // sağ yan lob
    + `C${w * 0.90},${lob} ${w},${lob} ${w},${omuz}`
    + `L${w},${h - r}`
    + `Q${w},${h} ${w - r},${h}`
    + `L${r},${h}`
    + `Q0,${h} 0,${h - r}Z`;
}

/** Kemerin tepesindeki sekiz yapraklı rozet. */
function rozet(cx: number, cy: number, r: number): string {
  const yaprak = (a: number) => {
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const x1 = cx + r * 0.42 * Math.cos(a - 0.42);
    const y1 = cy + r * 0.42 * Math.sin(a - 0.42);
    const x2 = cx + r * 0.42 * Math.cos(a + 0.42);
    const y2 = cy + r * 0.42 * Math.sin(a + 0.42);
    return `M${cx.toFixed(1)},${cy.toFixed(1)}Q${x1.toFixed(1)},${y1.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
      + `Q${x2.toFixed(1)},${y2.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}Z`;
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
        <Path d={rozet(width / 2, omuz * 0.30, Math.max(9, height * 0.032))} fill={altin} opacity={0.92} />
      </Svg>
      <View style={{ flex: 1, paddingTop: omuz * 0.72 }}>{children}</View>
    </View>
  );
}
