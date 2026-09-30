/**
 * İzin hatırlatmaları — kararlar (saf, sınanır).
 *
 * Konum, bildirim ya da canlı etkinlik izni verilmediyse uygulama bunu ara
 * ara, kısa bir gerekçeyle yeniden hatırlatır: vakitlerin bulunduğun yere
 * göre doğru olması ve ezanın zamanında okunması buna bağlı. Kullanıcıyı
 * bıktırmamak için sınırlı: en sık 3 günde bir, her izin için toplam en çok 5
 * kez; "Şimdi değil" demek sayaca girer.
 */

export type IzinTuru = 'konum' | 'bildirim' | 'canliEtkinlik';

export interface HatirlatmaKaydi {
  sonGosterim: number;
  sayi: number;
}

export type HatirlatmaKayitlari = Partial<Record<IzinTuru, HatirlatmaKaydi>>;

export const HATIRLATMA_ARALIGI_MS = 3 * 24 * 60 * 60 * 1000;
export const EN_COK_HATIRLATMA = 5;

export function hatirlatilabilir(kayit: HatirlatmaKaydi | undefined, simdi: number): boolean {
  if (!kayit) return true;
  if (kayit.sayi >= EN_COK_HATIRLATMA) return false;
  return simdi - kayit.sonGosterim >= HATIRLATMA_ARALIGI_MS;
}

export interface IzinDurumu {
  /** Konum izni verilmiş mi. */
  konum: boolean;
  bildirim: boolean;
  /** iOS canlı etkinlikleri açık mı; ayarda kapalıysa ya da platform desteklemiyorsa null. */
  canliEtkinlik: boolean | null;
}

/**
 * Ekranda en çok **bir** hatırlatma gösterilir; öncelik vakitlerin
 * doğruluğuna göre: konum > bildirim > canlı etkinlik.
 */
export function siradakiHatirlatma(durum: IzinDurumu, kayitlar: HatirlatmaKayitlari, simdi: number): IzinTuru | null {
  const adaylar: IzinTuru[] = [];
  if (!durum.konum) adaylar.push('konum');
  if (!durum.bildirim) adaylar.push('bildirim');
  if (durum.canliEtkinlik === false) adaylar.push('canliEtkinlik');
  return adaylar.find((a) => hatirlatilabilir(kayitlar[a], simdi)) ?? null;
}

export function kaydet(kayitlar: HatirlatmaKayitlari, tur: IzinTuru, simdi: number): HatirlatmaKayitlari {
  const eski = kayitlar[tur];
  return { ...kayitlar, [tur]: { sonGosterim: simdi, sayi: (eski?.sayi ?? 0) + 1 } };
}
