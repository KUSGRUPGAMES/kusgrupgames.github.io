/**
 * Kıble kadranı — şartname §9, §36.
 * Kadran geometrik dille çizilir: daire, derece çentikleri, sekiz kollu
 * yıldız iğnesi. Kâbe fotoğrafı ya da figüratif öge yoktur.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export interface QiblaDialProps {
  /** Kıblenin kuzeyden derecesi. */
  qibla: number;
  /** Cihazın baktığı yön; null ise kadran kuzeye sabitlenir. */
  heading: number | null;
  aligned: boolean;
  size?: number;
  /** Ana yön harfleri — çeviriden gelir. */
  labels: { n: string; e: string; s: string; w: string };
}

export function QiblaDial({ qibla, heading, aligned, size = 280, labels }: QiblaDialProps) {
  const theme = useTheme();
  const c = size / 2;
  const r = c - 18;
  const donme = heading === null ? 0 : -heading;
  const okAci = qibla + donme;

  const centikler = [];
  for (let d = 0; d < 360; d += 15) {
    const buyuk = d % 45 === 0;
    const a = (d - 90) * (Math.PI / 180);
    const dis = r;
    const ic = r - (buyuk ? 14 : 7);
    centikler.push(
      <Line
        key={d}
        x1={c + dis * Math.cos(a)}
        y1={c + dis * Math.sin(a)}
        x2={c + ic * Math.cos(a)}
        y2={c + ic * Math.sin(a)}
        stroke={theme.colors.hairline}
        strokeWidth={buyuk ? 2 : 1}
        strokeLinecap="round"
      />,
    );
  }

  const yonYazisi = (metin: string, derece: number) => {
    const a = (derece - 90) * (Math.PI / 180);
    const rr = r - 30;
    return (
      <SvgText
        key={metin}
        x={c + rr * Math.cos(a)}
        y={c + rr * Math.sin(a) + 5}
        fill={theme.colors.textMuted}
        fontSize={13}
        textAnchor="middle"
      >
        {metin}
      </SvgText>
    );
  };

  // Sekiz kollu yıldız biçiminde iğne ucu.
  const okUzunluk = r - 34;
  const ok = `M${c},${c - okUzunluk} L${c + 12},${c - 18} L${c},${c + 30} L${c - 12},${c - 18} Z`;

  return (
    <View
      accessible
      accessibilityRole="image"
      style={{ width: size, height: size, alignSelf: 'center' }}
    >
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={theme.colors.hairline} strokeWidth={2} fill="none" />
        <G transform={`rotate(${donme} ${c} ${c})`}>
          {centikler}
          {yonYazisi(labels.n, 0)}
          {yonYazisi(labels.e, 90)}
          {yonYazisi(labels.s, 180)}
          {yonYazisi(labels.w, 270)}
        </G>
        <G transform={`rotate(${okAci} ${c} ${c})`}>
          <Path
            d={ok}
            fill={aligned ? theme.colors.success : theme.colors.highlight}
            stroke={aligned ? theme.colors.success : theme.colors.highlight}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </G>
        <Circle cx={c} cy={c} r={6} fill={theme.colors.accent} />
      </Svg>
    </View>
  );
}
