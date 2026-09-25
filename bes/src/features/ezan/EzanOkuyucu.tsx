/**
 * Vakitte ezan — D29.
 *
 * - **Uygulama kapalıyken:** vakit bildirimi pakete gömülü ezanın ilk 29,5
 *   saniyesini çalar (iOS bildirim sesine en çok 30 sn izin verir). O sesi
 *   sistem çalar; uygulama müdahale edemez.
 * - **Uygulama açıkken:** bildirim sessiz gösterilir, ezanın **tamamı**
 *   burada çalınır. Üstte "Durdur" çubuğu çıkar; telefonun ses tuşlarından
 *   birine basmak da ezanı susturur (müsait olmayan kullanıcı için).
 *
 * Görünmez olduğunda hiçbir şey çizmez; uygulama ağacında bir kez durur.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { VolumeManager } from 'react-native-volume-manager';
import { Icon, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { logger } from '@/lib/log';
import { useEzanStore } from './ezanStore';
import ezanTam from '../../../assets/sounds/ezan-tam.m4a';

const log = logger('ezan');

export function EzanOkuyucu() {
  const t = useT();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { caliyor, vakit, istek, durdur, bitti } = useEzanStore();
  const ezanAcik = useSettingsStore((s) => s.settings.notifications.ezan);
  const oynatici = useRef<AudioPlayer | null>(null);
  const ezanAcikRef = useRef(ezanAcik);
  ezanAcikRef.current = ezanAcik;

  // Ön plandaki bildirim: ezanlıysa sessiz gösterilir ve tam ezan burada
  // başlar; diğerleri kendi sesiyle gösterilir. Eskiden hiç işleyici yoktu
  // ve uygulama açıkken gelen bildirim hiç görünmüyordu.
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (n) => {
        const ezanli = (n.request.content.data as { ezan?: unknown } | undefined)?.ezan === true;
        if (ezanli && ezanAcikRef.current) useEzanStore.getState().baslat(n.request.content.title ?? null);
        return {
          shouldShowBanner: true, shouldShowList: true,
          shouldPlaySound: !ezanli, shouldSetBadge: false,
        };
      },
    });
  }, []);

  useEffect(() => {
    const p = createAudioPlayer(ezanTam);
    oynatici.current = p;
    const sub = p.addListener('playbackStatusUpdate', (s) => { if (s.didJustFinish) bitti(); });
    return () => { sub.remove(); p.remove(); oynatici.current = null; };
  }, [bitti]);

  useEffect(() => {
    const p = oynatici.current;
    if (!p) return;
    if (caliyor) {
      void setAudioModeAsync({ playsInSilentMode: true }).catch(() => log.warn('ses kipi ayarlanamadı'));
      void p.seekTo(0).then(() => p.play()).catch((e: unknown) => log.warn('ezan çalınamadı', { error: e }));
    } else {
      p.pause();
    }
  }, [caliyor, istek]);

  // Ses tuşları: çalarken herhangi bir ses değişimi ezanı durdurur.
  useEffect(() => {
    if (!caliyor) return undefined;
    let sub: { remove: () => void } | null = null;
    try {
      sub = VolumeManager.addVolumeListener(() => useEzanStore.getState().durdur());
    } catch (e) {
      log.warn('ses tuşu dinlenemiyor', { error: e });
    }
    return () => { try { sub?.remove(); } catch { /* yok */ } };
  }, [caliyor]);

  if (!caliyor) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ezan.stop')}
        onPress={durdur}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18,
          backgroundColor: theme.colors.accentSurface, borderWidth: 1, borderColor: theme.colors.onAccentHighlight,
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
      >
        <Icon name="mosque" size={26} color={theme.colors.onAccentHighlight} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" tone="onAccent" lines={1}>{vakit ?? t('ezan.playing')}</Text>
          <Text variant="caption" tone="onAccent" lines={1}>{t('ezan.stopHint')}</Text>
        </View>
        <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.onAccentHighlight }}>
          <Text variant="bodyStrong" style={{ color: theme.colors.accentSurface }}>{t('ezan.stop')}</Text>
        </View>
      </Pressable>
    </View>
  );
}
