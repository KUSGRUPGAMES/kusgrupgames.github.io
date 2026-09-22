/**
 * Sanal liste — şartname §80.
 *
 * Uzun listeler (114 sure, 99 esmâ, 30 cüz) tek seferde çizilmez: görünen
 * kadarı çizilir, kaydırdıkça devamı gelir. Bunun `ScrollView` içindeki
 * `.map()` yerine kullanılmasının sebebi ölçülebilir: 114 satır = 114 kart,
 * 114 dokunma alanı ve her tema değişiminde 114 yeniden çizim.
 *
 * `Screen scroll` içinde **kullanılmaz**: iç içe kaydırma sanallaştırmayı
 * iptal eder. Bu bileşen kendi kaydırmasını yönetir.
 */
import React, { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Divider } from './Divider';

export interface VirtualListProps<T> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactElement | null;
  /** Satırlar arası ayırıcı çizgi. */
  separators?: boolean;
  /** Sabit satır yüksekliği biliniyorsa kaydırma hesabı ucuzlar. */
  itemHeight?: number;
  header?: React.ReactElement | null;
  footer?: React.ReactElement | null;
  empty?: React.ReactElement | null;
  /** Liste kendi kaydırmasını yönetmesin (kısa listeler için). */
  scrollEnabled?: boolean;
}

export function VirtualList<T>({
  data, keyExtractor, renderItem, separators = true, itemHeight,
  header, footer, empty, scrollEnabled = true,
}: VirtualListProps<T>) {
  const theme = useTheme();

  const ciz = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => renderItem(item, index),
    [renderItem],
  );

  return (
    <FlatList
      data={data as T[]}
      keyExtractor={keyExtractor}
      renderItem={ciz}
      scrollEnabled={scrollEnabled}
      ItemSeparatorComponent={separators ? Divider : null}
      ListHeaderComponent={header ?? null}
      ListFooterComponent={footer ?? null}
      ListEmptyComponent={empty ?? null}
      contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      // Ölçüm yapılmadan kaydırma konumu bilinir; uzun listede fark eder.
      {...(itemHeight
        ? { getItemLayout: (_d: ArrayLike<T> | null | undefined, i: number) => ({ length: itemHeight, offset: itemHeight * i, index: i }) }
        : {})}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
  );
}
