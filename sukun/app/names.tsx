/** Esmâü'l-Hüsnâ — şartname §26, §80. 99 satır sanallaştırılmıştır. */
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Field, Row, Column, Text, IconButton, Banner, EmptyState, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { DIVINE_NAMES, type DivineName } from '@/content/names';
import { normalizeSearch } from '@/features/location/normalize';
import { useFavoriteStore } from '@/store/favorites';

export default function NamesScreen() {
  const t = useT();
  const theme = useTheme();
  const [sorgu, setSorgu] = useState('');
  const fav = useFavoriteStore();

  const liste = useMemo(() => {
    const q = normalizeSearch(sorgu);
    if (!q) return DIVINE_NAMES;
    return DIVINE_NAMES.filter(
      (n) => normalizeSearch(n.transliteration).includes(q) || normalizeSearch(n.meaning).includes(q),
    );
  }, [sorgu]);

  const satir = useCallback((n: DivineName) => {
    const secili = fav.has('name', String(n.ordinal));
    return (
      <Row align="center" gap="md" style={{ paddingVertical: theme.spacing.sm }}>
        <Text variant="micro" tone="subtle" style={{ width: 24 }}>{String(n.ordinal)}</Text>
        <Column flex={1} gap="xxs">
          <Text variant="bodyStrong" tone="accent">{n.transliteration}</Text>
          <Text variant="caption" tone="muted">{n.meaning}</Text>
        </Column>
        <IconButton
          name="heart"
          label={secili ? t('favorite.remove') : t('favorite.add')}
          size={18}
          color={secili ? theme.colors.highlight : theme.colors.textSubtle}
          onPress={() => fav.toggle('name', String(n.ordinal))}
        />
      </Row>
    );
  }, [fav, t, theme]);

  const baslik = (
    <Column gap="md" style={{ paddingBottom: theme.spacing.md }}>
      <SectionHeader title={t('names.subtitle')} />
      <Field label={t('common.search')} hint={t('names.searchHint')} value={sorgu} onChangeText={setSorgu} />
      <Banner tone="info" title={t('common.source')} description={t('names.arabicPending')} />
    </Column>
  );

  return (
    <Screen motif="starLattice" padding="lg">
      <Stack.Screen options={{ headerShown: true, title: t('names.title') }} />
      <View style={{ flex: 1 }}>
        <VirtualList
          data={liste}
          keyExtractor={(n) => String(n.ordinal)}
          renderItem={satir}
          itemHeight={72}
          header={baslik}
          empty={<EmptyState icon="search" title={t('empty.title')} description={t('names.searchHint')} />}
        />
      </View>
    </Screen>
  );
}
