/**
 * Ana sayfa bildirimleri: konumun kendiliğinden güncellenmesi ve izin
 * hatırlatmaları. Kararlar saf dosyalarda (`location/autoUpdate.ts`,
 * `permissions/nudge.ts`); bu bileşen yalnız okur, uygular ve gösterir.
 *
 * Aynı anda en çok bir kart görünür: önce konum bilgisi/uyarısı, yoksa en
 * öncelikli izin hatırlatması.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { Banner, Button, Card, Column, Row, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { kv } from '@/boot/storage';
import { KEYS, type Codec } from '@/lib/storage/kv';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { placeLabel } from '@/features/location/places';
import { konumKarari, KONTROL_ARALIGI_MS, type KonumKarari } from '@/features/location/autoUpdate';
import {
  locationCanAskAgain, locationPermissionStatus, readDeviceLocationSilently, requestDeviceLocation,
} from '@/features/location/device';
import { hasPermission, notificationCanAskAgain, requestPermission } from '@/features/notifications/service';
import { liveActivity } from '../../../modules/bes-live-activity';
import {
  kaydet, siradakiHatirlatma, type HatirlatmaKayitlari, type IzinTuru,
} from './nudge';


const kayitCodec: Codec<HatirlatmaKayitlari> = {
  parse: (raw) => (raw && typeof raw === 'object' ? (raw as HatirlatmaKayitlari) : {}),
  fallback: {},
};
/** Elle seçilmiş şehir uyarısı kapatıldıysa: hangi yer için, ne zaman. */
const reddCodec: Codec<{ id: string; at: number } | null> = {
  parse: (raw) => (raw && typeof raw === 'object' && 'id' in raw ? (raw as { id: string; at: number }) : null),
  fallback: null,
};
const UYARI_SUSKUNLUK_MS = 3 * 24 * 60 * 60 * 1000;

let sonKontrol = 0;

export function HomeNotices() {
  const t = useT();
  const theme = useTheme();
  const aktif = useLocationStore((s) => s.active());
  const ekle = useLocationStore((s) => s.add);
  const canliAyar = useSettingsStore((s) => s.settings.notifications.liveActivity);

  const [konumBilgisi, setKonumBilgisi] = useState<KonumKarari | null>(null);
  const [eskiAd, setEskiAd] = useState<string | null>(null);
  const [hatirlatma, setHatirlatma] = useState<IzinTuru | null>(null);
  const aktifRef = useRef(aktif);
  aktifRef.current = aktif;

  const konumuDenetle = useCallback(async (zorla = false) => {
    const simdi = Date.now();
    if (!zorla && simdi - sonKontrol < KONTROL_ARALIGI_MS) return;
    sonKontrol = simdi;
    const burada = await readDeviceLocationSilently();
    const onceki = aktifRef.current;
    const karar = konumKarari(onceki, burada);
    if (karar.kind === 'tasindi') {
      ekle(karar.yeni, { origin: 'gps', makePrimary: onceki?.isPrimary ?? true });
      // Eski GPS kaydı listede birikmesin (her ilçe değişiminde yeni kayıt açılıyordu).
      if (onceki?.origin === 'gps' && onceki.id !== karar.yeni.id) useLocationStore.getState().remove(onceki.id);
      setEskiAd(onceki?.label ?? null);
      setKonumBilgisi(onceki ? karar : null);
    } else if (karar.kind === 'uyusmuyor') {
      const redd = await kv.read(KEYS.locationNoticeDismissed, reddCodec);
      const susuyor = redd && redd.id === karar.burada.id && simdi - redd.at < UYARI_SUSKUNLUK_MS;
      setKonumBilgisi(susuyor ? null : karar);
    } else {
      setKonumBilgisi(null);
    }
  }, [ekle]);

  const izinleriDenetle = useCallback(async () => {
    const [konum, bildirim, kayitlar] = await Promise.all([
      locationPermissionStatus(), hasPermission(), kv.read(KEYS.permissionNudges, kayitCodec),
    ]);
    const canli = Platform.OS === 'ios' && canliAyar ? liveActivity.supported() : null;
    setHatirlatma(siradakiHatirlatma({ konum: konum === 'granted', bildirim, canliEtkinlik: canli }, kayitlar, Date.now()));
  }, [canliAyar]);

  useEffect(() => {
    void konumuDenetle();
    void izinleriDenetle();
    const sub = AppState.addEventListener('change', (d) => {
      if (d === 'active') { void konumuDenetle(); void izinleriDenetle(); }
    });
    return () => sub.remove();
  }, [konumuDenetle, izinleriDenetle]);

  /** Hatırlatma gösterildi/cevaplandı: sayaç ilerler, kart kalkar. */
  const hatirlatmaBitti = async (tur: IzinTuru) => {
    const kayitlar = await kv.read(KEYS.permissionNudges, kayitCodec);
    await kv.write(KEYS.permissionNudges, kaydet(kayitlar, tur, Date.now()));
    setHatirlatma(null);
  };

  const izinVer = async (tur: IzinTuru) => {
    if (tur === 'konum') {
      if (await locationCanAskAgain()) {
        const sonuc = await requestDeviceLocation();
        if (sonuc.kind === 'ok') {
          const onceki = aktifRef.current;
          if (!onceki || konumKarari(onceki, sonuc.place).kind !== 'ayni') {
            ekle(sonuc.place, { origin: 'gps', makePrimary: onceki?.isPrimary ?? true });
          }
        }
      } else {
        await Linking.openSettings();
      }
    } else if (tur === 'bildirim') {
      if (await notificationCanAskAgain()) await requestPermission();
      else await Linking.openSettings();
    } else {
      await Linking.openSettings();
    }
    await hatirlatmaBitti(tur);
  };

  // Boşluk yalnız bir kart görünürken: kart yoksa ana sayfada aralık kalmaz.
  const sar = (icerik: React.ReactElement) => <View style={{ marginBottom: theme.spacing.sm }}>{icerik}</View>;

  if (konumBilgisi?.kind === 'tasindi') {
    return sar(
      <Banner
        tone="success"
        title={t('locauto.movedTitle', { city: placeLabel(konumBilgisi.yeni) })}
        description={eskiAd ? t('locauto.movedBody', { from: eskiAd }) : t('locauto.movedBodyShort')}
        actionLabel={t('common.ok')}
        onAction={() => setKonumBilgisi(null)}
      />
    );
  }

  if (konumBilgisi?.kind === 'uyusmuyor' && aktif) {
    const burada = konumBilgisi.burada;
    return sar(
      <Card padding="md" style={{ borderColor: theme.colors.warning }}>
        <Column gap="sm">
          <Text variant="bodyStrong">{t('locauto.mismatchTitle', { city: burada.name })}</Text>
          <Text variant="callout" tone="muted">{t('locauto.mismatchBody', { active: aktif.label, city: burada.name })}</Text>
          <Row gap="sm" wrap>
            <Button
              label={t('locauto.switchTo', { city: burada.name })}
              size="sm"
              onPress={() => {
                ekle(burada, { origin: 'gps', makePrimary: aktif.isPrimary });
                setKonumBilgisi(null);
              }}
            />
            <Button
              label={t('locauto.keep', { city: aktif.label })}
              size="sm"
              variant="ghost"
              onPress={() => {
                void kv.write(KEYS.locationNoticeDismissed, { id: burada.id, at: Date.now() });
                setKonumBilgisi(null);
              }}
            />
          </Row>
        </Column>
      </Card>
    );
  }

  if (hatirlatma) {
    const anahtar = hatirlatma === 'konum' ? 'location' : hatirlatma === 'bildirim' ? 'notification' : 'liveActivity';
    return sar(
      <Card padding="md">
        <Column gap="sm">
          <Text variant="bodyStrong">{t(`permnudge.${anahtar}Title`)}</Text>
          <Text variant="callout" tone="muted">{t(`permnudge.${anahtar}Body`)}</Text>
          <Row gap="sm" wrap>
            <Button label={t('permnudge.allow')} size="sm" onPress={() => { void izinVer(hatirlatma); }} />
            <Button label={t('permnudge.later')} size="sm" variant="ghost" onPress={() => { void hatirlatmaBitti(hatirlatma); }} />
          </Row>
        </Column>
      </Card>
    );
  }

  return null;
}
