/**
 * Konumun kendiliğinden güncellenmesi — kararlar (saf, sınanır).
 *
 * İlk sürümde konum yalnız ilk kurulumda bir kez okunuyordu; başka şehre
 * giden kullanıcı eski şehrin vakitlerini ve imsakiyesini görüyordu. Artık
 * uygulama öne geldikçe (en sık 20 dakikada bir) konum izni **varsa** — izin
 * istenmeden — cihazın konumuna bakılır:
 *
 * - Etkin konum GPS'ten geldiyse ve kullanıcı başka bir şehre geçtiyse,
 *   konum kendiliğinden yeni şehre geçer; ana sayfada kısa bir bilgi çıkar.
 *   Vakit bildirimleri, canlı etkinlik ve widget etkin konumu izlediği için
 *   hepsi yeni şehre göre yeniden kurulur.
 * - Etkin konum elle seçildiyse kullanıcının seçimine dokunulmaz; bulunduğu
 *   yer belirgin biçimde farklıysa uyarı gösterilir ve tek dokunuşla geçiş
 *   önerilir (vakitler şehirden şehre dakikalarca değişir).
 */
import { distanceKm } from './search';
import type { Place, SavedLocation } from './types';

/** Bu mesafenin altında "aynı yer" sayılır: il içi hareket vakti değiştirmez. */
export const AYNI_YER_KM = 25;

/** Konum en sık bu aralıkla kontrol edilir (pil). */
export const KONTROL_ARALIGI_MS = 20 * 60 * 1000;

export type KonumKarari =
  | { kind: 'ayni' }
  /** GPS kökenli konum: kendiliğinden yeni şehre geçilir. */
  | { kind: 'tasindi'; yeni: Place }
  /** Elle seçilmiş konum: dokunulmaz, uyarı gösterilir. */
  | { kind: 'uyusmuyor'; burada: Place };

export function konumKarari(aktif: SavedLocation | null, burada: Place | null): KonumKarari {
  if (!burada) return { kind: 'ayni' };
  if (!aktif) return { kind: 'tasindi', yeni: burada };
  if (burada.id === aktif.id) return { kind: 'ayni' };
  if (distanceKm(aktif, burada) < AYNI_YER_KM) return { kind: 'ayni' };
  return aktif.origin === 'gps' ? { kind: 'tasindi', yeni: burada } : { kind: 'uyusmuyor', burada };
}
