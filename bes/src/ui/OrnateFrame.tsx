/** Ana sayfanın tek parça kemerli vakit panosu.
 * Marka paketindeki TAM çerçevenin tepesi ve altı kendi oranlarında kalır.
 * İki parçanın arasında yalnız düz yan hat uzatılır; bütün köşeler birleşir.
 */
import React from 'react';
import { View, Image, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import frame from '../../assets/brand/paket/ui_cerceveleri_01.png';

const FRAME_RATIO = 585 / 973;

export interface OrnateFrameProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  /** Çerçevenin tabanında, metnin arkasında kalan saydam sahne. */
  siluet?: number;
  /** Siluetin yüksekliği (birim). Verilmezse ana sayfa oranı kullanılır. */
  siluetHeight?: number;
  /** İçerik alanının alt boşluğu (birim). Verilmezse ana sayfa oranı. */
  contentBottom?: number;
  style?: StyleProp<ViewStyle>;
}

export function OrnateFrame({ width, height, children, siluet, siluetHeight, contentBottom, style }: OrnateFrameProps) {
  const theme = useTheme();
  const pictureHeight = width * FRAME_RATIO;
  const topHeight = pictureHeight * 0.75;
  const bottomHeight = pictureHeight - topHeight;
  const middleHeight = Math.max(0, height - pictureHeight);
  const edge = width * 0.014;

  // Dolgu çerçevenin dışına taşmasın; tepenin konturunu takip eder.
  // Bezeme PNG'deki özgün çizimdir, bu yol yalnız zemini maskeler.
  const silhouette = `M ${edge} ${height - 8} L ${edge} ${width * 0.36}
    C ${edge} ${width * 0.29}, ${width * 0.055} ${width * 0.245}, ${width * 0.15} ${width * 0.245}
    C ${width * 0.17} ${width * 0.13}, ${width * 0.27} ${width * 0.10}, ${width * 0.34} ${width * 0.10}
    C ${width * 0.43} ${width * 0.078}, ${width * 0.48} ${width * 0.025}, ${width * 0.5} ${width * 0.012}
    C ${width * 0.52} ${width * 0.025}, ${width * 0.57} ${width * 0.078}, ${width * 0.66} ${width * 0.10}
    C ${width * 0.73} ${width * 0.10}, ${width * 0.83} ${width * 0.13}, ${width * 0.85} ${width * 0.245}
    C ${width * 0.945} ${width * 0.245}, ${width - edge} ${width * 0.29}, ${width - edge} ${width * 0.36}
    L ${width - edge} ${height - 8} Z`;

  return (
    <View style={[{ width, height }, style]}>
      <Svg pointerEvents="none" width={width} height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="heroEmerald" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.accentGradient[0]} />
            <Stop offset="1" stopColor={theme.colors.accentGradient[1]} />
          </LinearGradient>
        </Defs>
        <Path d={silhouette} fill="url(#heroEmerald)" />
      </Svg>

      {siluet ? (
        <Image source={siluet} resizeMode="contain" accessible={false}
          style={{ position: 'absolute', bottom: 5, left: 4, width: width - 8,
            height: siluetHeight ?? Math.min(height * 0.57, width * 0.48), opacity: 0.87 }} />
      ) : null}

      {/* İki kırpma aynı tam çerçeve PNG'sini kullanır; dosyaya dokunulmaz. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0,
        width, height: topHeight, overflow: 'hidden' }}>
        <Image source={frame} resizeMode="stretch" style={{ width, height: pictureHeight }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', top: topHeight - 1,
        left: edge, right: edge, height: middleHeight + 2,
        borderLeftWidth: 1.5, borderRightWidth: 1.5,
        borderColor: theme.colors.onAccentHighlight }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0,
        width, height: bottomHeight, overflow: 'hidden' }}>
        <Image source={frame} resizeMode="stretch" style={{ position: 'absolute',
          top: -topHeight, left: 0, width, height: pictureHeight }} />
      </View>

      <View style={{ position: 'absolute', top: pictureHeight * 0.30,
        bottom: contentBottom ?? Math.max(48, height * 0.21), left: 20, right: 20 }}>
        {children}
      </View>
    </View>
  );
}
