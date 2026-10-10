/**
 * Android ana ekran widget'larının görünümü — JSX, `react-native-android-widget`
 * tarafından RemoteViews'e çevrilir (gerçek React ağacı değil, headless görev
 * içinde çalışır). Renkler iOS widget'ındaki `BesRenk` paletiyle birebir aynı
 * (targets/widget/Paylasilan.swift) — tek koyu tema (D34), ekran bağlamı/tema
 * sağlayıcısı burada yok, bu yüzden sabit değerler.
 *
 * Android işletim sistemi widget yenilemesini 30 dakikadan sık izin vermiyor
 * (`updatePeriodMillis` tabanı) — iOS'taki gibi saniye saniye akan bir geri
 * sayım burada yok, "Sıradaki: İkindi 16:42" periyodik yenilenir.
 */
import type { ReactNode } from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { dateKey } from '@/features/dhikr/stats';
import { nextTwo, type WidgetPayload } from '../payload';

const RENK = {
  ust: '#023023',
  alt: '#01140B',
  altin: '#E6B965',
  fildisi: '#FBF6EC',
  soluk: 'rgba(251, 246, 236, 0.66)',
} as const;

function Zemin({ children }: { children: ReactNode }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        padding: 12,
        backgroundGradient: { from: RENK.ust, to: RENK.alt, orientation: 'TOP_BOTTOM' },
        borderRadius: 20,
      }}
      clickAction="OPEN_APP"
    >
      {children}
    </FlexWidget>
  );
}

export function VakitWidget({ payload, nowSec }: { payload: WidgetPayload | null; nowSec: number }) {
  if (!payload) {
    return (
      <Zemin>
        <TextWidget text="BEŞ" style={{ fontSize: 16, fontWeight: 'bold', color: RENK.fildisi }} />
      </Zemin>
    );
  }
  const iki = nextTwo(payload.times, nowSec);
  if (!iki) {
    return (
      <Zemin>
        <TextWidget text="BEŞ" style={{ fontSize: 16, fontWeight: 'bold', color: RENK.fildisi }} />
      </Zemin>
    );
  }
  const [sonraki] = iki;
  return (
    <Zemin>
      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent' }}>
        <TextWidget text={payload.city} style={{ fontSize: 11, fontWeight: '600', color: RENK.soluk }} maxLines={1} />
      </FlexWidget>
      <FlexWidget style={{ height: 6, width: 'match_parent' }} />
      <TextWidget
        text={payload.labels.next.toLocaleUpperCase('tr-TR')}
        style={{ fontSize: 9, fontWeight: 'bold', color: RENK.altin, letterSpacing: 1 }}
      />
      <TextWidget text={sonraki.n} style={{ fontSize: 22, fontWeight: '900', color: RENK.fildisi }} maxLines={1} />
      <TextWidget text={sonraki.hm} style={{ fontSize: 18, fontWeight: 'bold', color: RENK.altin }} />
    </Zemin>
  );
}

export function GununWidget({ payload }: { payload: WidgetPayload | null }) {
  if (!payload) {
    return (
      <Zemin>
        <TextWidget text="BEŞ" style={{ fontSize: 16, fontWeight: 'bold', color: RENK.fildisi }} />
      </Zemin>
    );
  }
  const simdi = new Date();
  const bugunAnahtari = dateKey(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
  const gun = payload.daily.find((d) => d.d === bugunAnahtari) ?? payload.daily[0];
  if (!gun || !gun.ar) {
    return (
      <Zemin>
        <TextWidget text="BEŞ" style={{ fontSize: 16, fontWeight: 'bold', color: RENK.fildisi }} />
      </Zemin>
    );
  }
  return (
    <Zemin>
      <TextWidget
        text={payload.labels.verseOfDay.toLocaleUpperCase('tr-TR')}
        style={{ fontSize: 9, fontWeight: 'bold', color: RENK.altin, letterSpacing: 1 }}
      />
      <FlexWidget style={{ height: 6, width: 'match_parent' }} />
      <TextWidget
        text={gun.tr}
        maxLines={4}
        truncate="END"
        style={{ fontSize: 13, color: RENK.fildisi, lineHeight: 18 }}
      />
      <FlexWidget style={{ height: 4, width: 'match_parent' }} />
      <TextWidget text={gun.ref} style={{ fontSize: 11, fontWeight: '600', color: RENK.soluk }} />
    </Zemin>
  );
}
