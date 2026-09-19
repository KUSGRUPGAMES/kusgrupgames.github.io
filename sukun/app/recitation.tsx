/** Kıraat ayarları ve indirmeler — şartname §32, §33. */
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, ListItem, Segmented,
  Toggle, Button, Banner, Badge, ProgressBar, SourceNote, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { RECITERS, AUDIO_SOURCE, getReciter, resolveBitrate } from '@/features/audio/source';
import { usedBytes, clearDownloads, downloadSurah } from '@/features/audio/downloadManager';
import { formatBytes } from '@/features/audio/downloads';
import { getSurahs, surahFirstGlobalAyah } from '@/features/quran/data';

export default function RecitationScreen() {
  const t = useT();
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [kullanilan, setKullanilan] = useState(0);
  const [indirme, setIndirme] = useState<{ surah: number; done: number; total: number } | null>(null);

  const okuyucu = getReciter(settings.recitation.reciterId);
  const sureler = getSurahs();

  const boyutOku = useCallback(async () => setKullanilan(await usedBytes()), []);
  useEffect(() => { void boyutOku(); }, [boyutOku]);

  const sureIndir = async (surah: number, ayahCount: number) => {
    const ilk = surahFirstGlobalAyah(surah);
    if (!ilk || !okuyucu) return;
    const bit = resolveBitrate(okuyucu, settings.recitation.bitrate);
    setIndirme({ surah, done: 0, total: ayahCount });
    await downloadSurah(okuyucu.id, bit, ilk, ayahCount, (p) =>
      setIndirme({ surah, done: p.done, total: p.total }));
    setIndirme(null);
    void boyutOku();
  };

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('audio.title') }} />

      <Banner tone="info" title={t('audio.title')} description={t('audio.sourceNote')} />

      <SectionHeader title={t('audio.reciter')} />
      <Card padding="sm">
        {RECITERS.map((r) => (
          <ListItem
            key={r.id}
            title={r.name}
            subtitle={`${r.style === 'mucevved' ? t('audio.mucevved') : t('audio.murattal')} · ${r.bitrates.join(', ')} kbps`}
            chevron={false}
            {...(settings.recitation.reciterId === r.id ? { right: <Badge label={t('common.select')} tone="accent" /> } : {})}
            onPress={() => update({ recitation: { ...settings.recitation, reciterId: r.id } })}
          />
        ))}
      </Card>

      <SectionHeader title={t('audio.quality')} />
      <Segmented
        options={[
          { value: '64', label: t('audio.quality64') },
          { value: '128', label: t('audio.quality128') },
        ]}
        value={String(settings.recitation.bitrate)}
        onChange={(v) => update({ recitation: { ...settings.recitation, bitrate: v === '64' ? 64 : 128 } })}
        accessibilityLabel={t('audio.quality')}
      />

      <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
        <Toggle
          title={t('audio.wifiOnly')}
          value={settings.recitation.wifiOnlyDownload}
          onChange={(v) => update({ recitation: { ...settings.recitation, wifiOnlyDownload: v } })}
        />
      </Card>

      <SectionHeader
        title={t('audio.storage')}
        subtitle={t('audio.storageUsed', { size: formatBytes(kullanilan) })}
      />
      <Row gap="sm">
        <Button
          label={t('audio.deleteDownload')}
          icon="close"
          variant="secondary"
          size="sm"
          disabled={kullanilan === 0}
          onPress={async () => { await clearDownloads(); void boyutOku(); }}
        />
      </Row>

      <SectionHeader title={t('audio.download')} />
      {indirme ? (
        <Column gap="sm" style={{ marginBottom: theme.spacing.md }}>
          <Text variant="caption" tone="muted">
            {`${t('audio.downloading')} · ${indirme.done} / ${indirme.total}`}
          </Text>
          <ProgressBar value={indirme.done / Math.max(1, indirme.total)} />
        </Column>
      ) : null}
      {/* 114 satır: kendi kaydırmasını yönetmeden, sabit yükseklikte çizilir. */}
      <Card padding="sm" style={{ height: 420 }}>
        <VirtualList
          data={sureler}
          keyExtractor={(s) => String(s.number)}
          itemHeight={64}
          renderItem={(s) => (
            <ListItem
              title={`${s.number}. ${s.nameTr}`}
              subtitle={t('quran.ayahCount', { count: s.ayahCount })}
              chevron={false}
              right={
                <Button
                  label={t('audio.download')}
                  icon="share"
                  variant="ghost"
                  size="sm"
                  disabled={indirme !== null}
                  onPress={() => { void sureIndir(s.number, s.ayahCount); }}
                />
              }
            />
          )}
        />
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SourceNote source={AUDIO_SOURCE.name} license={AUDIO_SOURCE.note} />
      </View>
    </Screen>
  );
}
