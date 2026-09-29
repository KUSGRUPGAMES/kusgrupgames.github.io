/**
 * Hesap ve veri — şartname §57, §59, §69.
 *
 * Bu ekran bir "giriş yap" ekranı değildir çünkü hesap **yoktur**. Kullanıcının
 * bilmek istediği asıl soruyu yanıtlar: verilerim nerede, ne oluyor, nasıl
 * silinir (DECISIONS D12).
 *
 * Tek istisna Topluluk (D31, `/community`): kullanıcının kendi isteğiyle
 * açtığı, takma adlı, ayrı bir katman — buradaki "hesapsız" ilkesini bozmaz
 * çünkü varsayılan kapalıdır. Topluluk için Google/Apple girişi (D32) bu
 * ekranda yönetilir: çıkış ve **hesabı silme** (App Review 5.1.1(v): hesap
 * açtıran uygulama silmeyi uygulama içinde sunmak zorunda).
 */
import React, { useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Banner, ListItem, Divider, Button, Sheet,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { useReadingStore } from '@/store/reading';
import { useFavoriteStore } from '@/store/favorites';
import { Brand } from '@/config/brand';
import { openLegalPage } from '@/lib/legal';
import { useDateFormat } from '@/lib/i18n/dates';
import { restore, totalAdded, type Backup, type RestoreMode } from '@/features/backup/backup';
import { exportBackup, pickBackup, type ImportFailure } from '@/features/backup/file';
import { snapshotAll, applySnapshot } from '@/boot/persistence';
import { communityAvailable } from '@/features/community/client';
import { useOturum, cikisYap, hesabiSil } from '@/features/community/auth';
import { SignInButtons } from '@/features/community/SignInButtons';
import { useSettingsStore } from '@/store/settings';

export default function AccountScreen() {
  const t = useT();
  const theme = useTheme();
  const tarihBicimi = useDateFormat({ dateStyle: 'medium', timeStyle: 'short' });
  const konumlar = useLocationStore((s) => s.locations);
  const oturumlar = useWorshipStore((s) => s.sessions);
  const gunler = useWorshipStore((s) => s.days);
  const yerImleri = useReadingStore((s) => s.bookmarks);
  const favoriler = useFavoriteStore((s) => s.items);
  const oturum = useOturum();
  const ayarlar = useSettingsStore((s) => s.settings);
  const ayarGuncelle = useSettingsStore((s) => s.update);
  const [silmeOnayi, setSilmeOnayi] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);
  const [oturumSonuc, setOturumSonuc] = useState<{ tone: 'success' | 'warning'; title: string } | null>(null);

  const toplulugaKapat = () => ayarGuncelle({ community: { ...ayarlar.community, enabled: false } });

  const cik = async () => {
    await cikisYap();
    toplulugaKapat();
    setOturumSonuc(null);
  };

  const sil = async () => {
    setSiliniyor(true);
    const ok = await hesabiSil();
    setSiliniyor(false);
    setSilmeOnayi(false);
    if (ok) toplulugaKapat();
    setOturumSonuc(ok
      ? { tone: 'success', title: t('auth.deleted') }
      : { tone: 'warning', title: t('auth.deleteFailed') });
  };

  // Yedekleme durumu — DECISIONS D19.
  const [calisiyor, setCalisiyor] = useState(false);
  const [bekleyen, setBekleyen] = useState<Backup | null>(null);
  const [sonuc, setSonuc] = useState<{ tone: 'success' | 'warning'; title: string; description?: string } | null>(null);

  const disaAktar = async () => {
    setCalisiyor(true);
    setSonuc(null);
    const cikti = await exportBackup(snapshotAll(), Brand.version);
    setCalisiyor(false);
    setSonuc(cikti.ok
      ? { tone: 'success', title: t('backup.exported'), description: cikti.fileName }
      : { tone: 'warning', title: t('backup.exportFailed') });
  };

  const HATA: Record<ImportFailure, string> = {
    cancelled: '', read: t('backup.errorRead'), json: t('backup.errorCorrupt'),
    format: t('backup.errorNotBackup'), version: t('backup.errorNewer'), schema: t('backup.errorCorrupt'),
  };

  const dosyaSec = async () => {
    setCalisiyor(true);
    setSonuc(null);
    const cikti = await pickBackup();
    setCalisiyor(false);
    if (cikti.ok) { setBekleyen(cikti.backup); return; }
    if (cikti.reason === 'cancelled') return;
    setSonuc({ tone: 'warning', title: t('backup.importFailed'), description: HATA[cikti.reason] });
  };

  const geriYukle = (mode: RestoreMode) => {
    if (!bekleyen) return;
    const { payload, report } = restore(snapshotAll(), bekleyen.payload, mode);
    applySnapshot(payload);
    setBekleyen(null);
    setSonuc({
      tone: 'success',
      title: t('backup.restored'),
      description: mode === 'replace'
        ? t('backup.restoredReplace')
        : t('backup.restoredMerge', { count: totalAdded(report) })
          + (report.countersFromBackup ? '' : ` ${t('backup.countersKept')}`),
    });
  };

  const satir = (baslik: string, adet: number) => (
    <Row justify="space-between" style={{ paddingVertical: theme.spacing.xs }}>
      <Text tone="muted">{baslik}</Text>
      <Text variant="bodyStrong">{String(adet)}</Text>
    </Row>
  );

  return (
    <Screen topInset={false} scroll motif="marka">
      <Stack.Screen options={{ headerShown: true, title: t('account.title') }} />

      <Card accent>
        <Column gap="sm">
          <Text variant="title3" tone="onAccent">{t('account.guestOnly', { app: Brand.appName })}</Text>
          <Text variant="body" tone="onAccent">{t('account.guestBody')}</Text>
        </Column>
      </Card>

      {communityAvailable && oturum.hazir ? (
        <>
          <SectionHeader title={t('auth.sectionTitle')} subtitle={t('auth.sectionHint')} />
          {oturum.girisli ? (
            <Card padding="sm">
              <ListItem
                title={t(oturum.saglayici === 'apple' ? 'auth.viaApple' : 'auth.viaGoogle')}
                // E-posta yalnız kullanıcının kendisine, bu ekranda gösterilir.
                {...(oturum.email ? { subtitle: oturum.email } : {})}
                icon="user"
                chevron={false}
              />
              <Divider />
              <ListItem title={t('auth.signOut')} icon="close" chevron={false} onPress={() => { void cik(); }} />
              <Divider />
              <ListItem title={t('auth.deleteAccount')} subtitle={t('auth.deleteHint')} icon="trash"
                chevron={false} onPress={() => setSilmeOnayi(true)} />
            </Card>
          ) : (
            <Card padding="md">
              <SignInButtons />
            </Card>
          )}
          {oturumSonuc ? <Banner tone={oturumSonuc.tone} title={oturumSonuc.title} /> : null}
        </>
      ) : null}

      <Sheet visible={silmeOnayi} onClose={() => setSilmeOnayi(false)} title={t('auth.deleteTitle')}>
        <Column gap="md" style={{ paddingVertical: theme.spacing.lg }}>
          <Text tone="muted">{t('auth.deleteBody')}</Text>
          <Button label={t('auth.deleteConfirm')} variant="danger" loading={siliniyor}
            onPress={() => { void sil(); }} block />
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setSilmeOnayi(false)} block />
        </Column>
      </Sheet>

      <SectionHeader title={t('account.dataLocation')} />
      <Card>
        <Column gap="xxs">
          {satir(t('location.saved'), konumlar.length)}
          <Divider />
          {satir(t('quran.bookmarks'), yerImleri.length)}
          <Divider />
          {satir(t('quran.favorites'), favoriler.length)}
          <Divider />
          {satir(t('dhikr.stats'), oturumlar.length)}
          <Divider />
          {satir(t('log.title'), Object.keys(gunler).length)}
        </Column>
      </Card>

      <Banner tone="info" title={t('settings.privacy')} description={t('account.exportHint')} />

      <SectionHeader title={t('backup.title')} subtitle={t('backup.why')} />
      <Card padding="sm">
        <ListItem
          title={t('backup.export')}
          subtitle={t('backup.exportBody')}
          icon="share"
          chevron={false}
          disabled={calisiyor}
          onPress={() => { void disaAktar(); }}
        />
        <Divider />
        <ListItem
          title={t('backup.import')}
          subtitle={t('backup.importBody')}
          icon="download"
          chevron={false}
          disabled={calisiyor}
          onPress={() => { void dosyaSec(); }}
        />
      </Card>
      {sonuc ? <Banner tone={sonuc.tone} title={sonuc.title} {...(sonuc.description ? { description: sonuc.description } : {})} /> : null}
      <Banner tone="info" title={t('sync.title')} description={t('account.noSync')} />

      <Sheet visible={bekleyen !== null} onClose={() => setBekleyen(null)} title={t('backup.restoreTitle')}>
        <Column gap="md" style={{ paddingVertical: theme.spacing.lg }}>
          {bekleyen ? (
            <Text tone="muted">
              {t('backup.fileInfo', {
                date: tarihBicimi.format(new Date(bekleyen.createdAt)),
                version: bekleyen.app,
              })}
            </Text>
          ) : null}
          <Button label={t('backup.modeMerge')} onPress={() => geriYukle('merge')} block />
          <Text variant="caption" tone="muted">{t('backup.modeMergeBody')}</Text>
          <Button label={t('backup.modeReplace')} variant="ghost" onPress={() => geriYukle('replace')} block />
          <Text variant="caption" tone="muted">{t('backup.modeReplaceBody')}</Text>
        </Column>
      </Sheet>

      <SectionHeader title={t('settings.about')} />
      <Card padding="sm">
        <ListItem title={t('settings.publisher')} value={Brand.publisher} chevron={false} />
        <ListItem title={t('settings.version')} value={Brand.version} chevron={false} />
        <ListItem title={t('diagnostics.title')} icon="info" onPress={() => router.push('/diagnostics')} />
        <ListItem title={t('settings.privacy')} icon="lock" onPress={() => openLegalPage('privacy')} />
        <ListItem title={t('settings.terms')} icon="book" onPress={() => openLegalPage('terms')} />
      </Card>
    </Screen>
  );
}
