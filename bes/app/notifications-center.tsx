/** Bildirim merkezi — şartname §65. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Column, Row, Text, Button, Banner, EmptyState, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useNotificationSync } from '@/features/notifications/useNotificationSync';
import { requestPermission, installedRecords } from '@/features/notifications/service';

interface Satir { id: string; baslik: string; an: Date; kurulu: boolean }

export default function NotificationsCenterScreen() {
  const t = useT();
  const theme = useTheme();
  const { plan, esitle } = useNotificationSync();
  const [kuruluKimlikler, setKuruluKimlikler] = useState<Set<string>>(new Set());
  const [izin, setIzin] = useState(true);

  /**
   * Liste **cihazda kurulu olanı** yansıtır.
   *
   * Eskiden ekran planı yeniden hesaplayıp gösteriyordu; o bir tahmindi.
   * Kullanıcı hiç kurulmamış satırları kurulu sanıyordu. Artık istenen plan
   * ile cihazdan okunan kimlikler karşılaştırılıyor ve kurulu olmayan satır
   * işaretleniyor.
   */
  const durumOku = useCallback(async () => {
    const kayitlar = await installedRecords();
    setKuruluKimlikler(new Set(kayitlar.map((k) => k.id)));
  }, []);
  useEffect(() => { void durumOku(); }, [durumOku, plan]);

  const liste = useMemo<Satir[]>(
    () => plan.map((n) => ({
      id: n.id,
      baslik: n.title,
      an: n.at,
      kurulu: kuruluKimlikler.has(n.id),
    })),
    [plan, kuruluKimlikler],
  );

  const kurulu = liste.filter((s) => s.kurulu).length;

  const yenidenKur = useCallback(async () => {
    // İzin isteme **burada** olur: kullanıcı düğmeye bastı. Açılıştaki
    // eşitleme izin istemez, yalnız varsa kurar.
    const verildi = await requestPermission();
    setIzin(verildi);
    if (!verildi) return;
    await esitle();
    await durumOku();
  }, [esitle, durumOku]);

  const bicim = useDateFormat({ dateStyle: 'short', timeStyle: 'short' });

  return (
    <Screen topInset={false} motif="octagonGrid" padding="lg">
      <Stack.Screen options={{ headerShown: true, title: t('notification.center') }} />
      <View style={{ flex: 1 }}>
        <VirtualList
          data={liste}
          keyExtractor={(s) => s.id}
          itemHeight={56}
          header={
            <Column gap="md" style={{ paddingBottom: theme.spacing.md }}>
              <SectionHeader
                title={t('notification.upcoming')}
                subtitle={t('notification.pending', { count: kurulu })}
              />
              {!izin ? <Banner tone="warning" title={t('notification.permissionMissing')} /> : null}
              <Banner tone="info" title={t('notification.center')} description={t('notification.coverageNote')} />
              <Row>
                <Button
                  label={t('notification.refresh')}
                  icon="refresh"
                  variant="secondary"
                  size="sm"
                  onPress={() => { void yenidenKur(); }}
                />
              </Row>
            </Column>
          }
          renderItem={(s) => (
            <Row align="center" justify="space-between" style={{ paddingVertical: theme.spacing.sm }}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>{s.baslik}</Text>
              <Text variant="caption" tone="muted">{bicim.format(s.an)}</Text>
            </Row>
          )}
          empty={<EmptyState icon="bellOff" title={t('notification.none')} description={t('notification.coverageNote')} />}
        />
      </View>
    </Screen>
  );
}
