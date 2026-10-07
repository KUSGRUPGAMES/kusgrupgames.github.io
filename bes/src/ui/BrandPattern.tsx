/** Marka karosunu herhangi bir yüzeyi esnetmeden kaplayacak şekilde döşer. */
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import brandTile from '../../assets/brand/pattern-tile.png';

const TILE_SIZE = 136;

export function BrandPattern({ opacity }: { opacity: number }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const columns = Math.ceil(size.width / TILE_SIZE);
  const rows = Math.ceil(size.height / TILE_SIZE);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // Son sütun ve satır karosu kenardan taşar; kırpılmazsa web'de her alt
      // sayfada yatay kaydırma çıkıyordu (320 pikselde 88 px).
      style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}
      onLayout={({ nativeEvent: { layout } }) => {
        const width = Math.ceil(layout.width);
        const height = Math.ceil(layout.height);
        setSize((previous) => previous.width === width && previous.height === height
          ? previous : { width, height });
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => (
        <Image
          key={index}
          source={brandTile}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            left: (index % columns) * TILE_SIZE,
            top: Math.floor(index / columns) * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        />
      ))}
    </View>
  );
}
