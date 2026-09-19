/**
 * İkon seti — şartname §8, §9.
 * Dış ikon paketi yok: her ikon burada SVG yolu olarak durur, çizgi
 * kalınlığı ve rengi temadan gelir. Hepsi 24×24 birim kutuda tanımlıdır.
 * Figüratif ikon yoktur; ürünün geometrik diline uygun, sade konturdur.
 */
import React from 'react';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export type IconName =
  | 'clock' | 'compass' | 'book' | 'beads' | 'heart' | 'settings'
  | 'chevronRight' | 'chevronLeft' | 'chevronDown' | 'check' | 'close'
  | 'bell' | 'bellOff' | 'share' | 'lock' | 'plus' | 'minus' | 'search'
  | 'moon' | 'sun' | 'location' | 'calendar' | 'user' | 'users'
  | 'sparkle' | 'play' | 'pause' | 'bookmark' | 'info' | 'alert' | 'refresh' | 'star' | 'copy';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;
  const common = { stroke, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image" accessibilityElementsHidden>
      {render(name, common)}
    </Svg>
  );
}

type P = {
  stroke: string; strokeWidth: number; fill: string;
  strokeLinecap: 'round'; strokeLinejoin: 'round';
};

function render(name: IconName, p: P): React.ReactNode {
  switch (name) {
    case 'clock':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Polyline points="12,7 12,12 16,14" {...p} /></>;
    case 'compass':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M15.5 8.5 13.2 13.2 8.5 15.5 10.8 10.8Z" {...p} /></>;
    case 'book':
      return <Path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5ZM4 20.5A1.5 1.5 0 0 1 5.5 19H19v2H5.5A1.5 1.5 0 0 1 4 20.5Z" {...p} />;
    case 'beads':
      return <><Path d="M12 3a9 9 0 1 0 0 18" {...p} /><Circle cx={12} cy={3} r={1.6} {...p} /><Circle cx={4.6} cy={8.4} r={1.6} {...p} /><Circle cx={4.6} cy={15.6} r={1.6} {...p} /><Circle cx={12} cy={21} r={1.6} {...p} /></>;
    case 'heart':
      return <Path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9Z" {...p} />;
    case 'settings':
      return <><Circle cx={12} cy={12} r={3} {...p} /><Path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" {...p} /></>;
    case 'chevronRight': return <Polyline points="9,5 16,12 9,19" {...p} />;
    case 'chevronLeft': return <Polyline points="15,5 8,12 15,19" {...p} />;
    case 'chevronDown': return <Polyline points="5,9 12,16 19,9" {...p} />;
    case 'check': return <Polyline points="4,12.5 9.5,18 20,6.5" {...p} />;
    case 'close': return <Path d="M6 6l12 12M18 6L6 18" {...p} />;
    case 'bell':
      return <><Path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2.5h-15Z" {...p} /><Path d="M10 21h4" {...p} /></>;
    case 'bellOff':
      return <><Path d="M6 17V11a6 6 0 0 1 8.5-5.4M18 13v4l1.5 2.5H8" {...p} /><Line x1={4} y1={4} x2={20} y2={20} {...p} /></>;
    case 'share':
      return <><Path d="M12 15V4M12 4 8.5 7.5M12 4l3.5 3.5" {...p} /><Path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" {...p} /></>;
    case 'lock':
      return <><Path d="M6 11h12v9H6z" {...p} /><Path d="M8.5 11V8a3.5 3.5 0 1 1 7 0v3" {...p} /></>;
    case 'plus': return <Path d="M12 5v14M5 12h14" {...p} />;
    case 'minus': return <Path d="M5 12h14" {...p} />;
    case 'search':
      return <><Circle cx={11} cy={11} r={6.5} {...p} /><Line x1={16} y1={16} x2={20.5} y2={20.5} {...p} /></>;
    case 'moon': return <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" {...p} />;
    case 'sun':
      return <><Circle cx={12} cy={12} r={4.2} {...p} /><Path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" {...p} /></>;
    case 'location':
      return <><Path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" {...p} /><Circle cx={12} cy={10} r={2.6} {...p} /></>;
    case 'calendar':
      return <><Path d="M4 6.5h16v14H4z" {...p} /><Path d="M4 11h16M8.5 3.5v4M15.5 3.5v4" {...p} /></>;
    case 'user':
      return <><Circle cx={12} cy={8.5} r={3.8} {...p} /><Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" {...p} /></>;
    case 'users':
      return <><Circle cx={9} cy={8.5} r={3.4} {...p} /><Path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" {...p} /><Path d="M16 5.5a3.4 3.4 0 0 1 0 6.6M17 14.6a6.2 6.2 0 0 1 4.2 5.4" {...p} /></>;
    case 'sparkle':
      return <Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9ZM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" {...p} />;
    case 'play': return <Path d="M8 5.5 18 12 8 18.5Z" {...p} />;
    case 'pause': return <Path d="M9 5.5v13M15 5.5v13" {...p} />;
    case 'bookmark': return <Path d="M7 3.5h10v17l-5-3.7-5 3.7Z" {...p} />;
    case 'info':
      return <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 11v6" {...p} /><Circle cx={12} cy={7.8} r={0.9} fill={p.stroke} stroke="none" /></>;
    case 'alert':
      return <><Path d="M12 3.5 21.5 20h-19Z" {...p} /><Path d="M12 10v4.5" {...p} /><Circle cx={12} cy={17.4} r={0.9} fill={p.stroke} stroke="none" /></>;
    case 'refresh':
      return <><Path d="M20 12a8 8 0 1 1-2.6-5.9" {...p} /><Polyline points="20,3.5 20,7 16.5,7" {...p} /></>;
    case 'copy':
      return <><Path d="M9 9h10v12H9z" {...p} /><Path d="M15 9V3H5v12h4" {...p} /></>;
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 8.6 : 3.7;
        pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
      }
      return <Path d={`M${pts.join('L')}Z`} {...p} />;
    }
  }
}
