/**
 * Çevrimdışı öncelikli eşitleme ve çakışma çözümü — şartname §58.
 *
 * ⛔B5: Supabase projesi yok. Ama eşitlemenin **zor kısmı** ağ değil, iki
 * cihazın aynı kaydı farklı değiştirmesidir. O mantık burada, saf ve
 * sınanabilir biçimde yazıldı; bağlantı geldiğinde yalnız taşıma katmanı
 * eklenecek.
 *
 * Kurallar:
 * 1. **Veri kaybı olmaz.** Silme bile "silindi" işaretiyle taşınır (tombstone);
 *    aksi hâlde çevrimdışı cihaz, sunucuda silineni geri diriltir.
 * 2. **Çakışmada en son yazan kazanır**, ama eşit zaman damgasında kararlı bir
 *    ayraç kullanılır (kimlik karşılaştırması) — yoksa iki cihaz sonsuza kadar
 *    birbirini ezer.
 * 3. **Sayaçlar ezilmez, birleştirilir.** Kaza sayacı ve zikir toplamı gibi
 *    biriken değerlerde "son yazan kazanır" yanlıştır: iki cihazda kılınan
 *    namazlardan biri kaybolur.
 */

export interface SyncRecord<T = unknown> {
  id: string;
  /** Son değişiklik anı (ms). */
  updatedAt: number;
  /** Silindi mi — silinen kayıt listeden atılmaz, işaretlenir. */
  deleted?: boolean;
  data: T;
}

export type MergeOutcome = 'local' | 'remote' | 'equal';

/** Tek kayıt için çakışma çözümü. */
export function resolve<T>(local: SyncRecord<T>, remote: SyncRecord<T>): { winner: SyncRecord<T>; outcome: MergeOutcome } {
  if (local.updatedAt > remote.updatedAt) return { winner: local, outcome: 'local' };
  if (remote.updatedAt > local.updatedAt) return { winner: remote, outcome: 'remote' };
  // Eşit zaman damgası: kararlı bir kural gerekir, yoksa iki cihaz salınır.
  const karsilastirma = JSON.stringify(local.data).localeCompare(JSON.stringify(remote.data));
  if (karsilastirma === 0) return { winner: local, outcome: 'equal' };
  return karsilastirma > 0 ? { winner: local, outcome: 'local' } : { winner: remote, outcome: 'remote' };
}

export interface MergeReport {
  added: number;
  updated: number;
  deleted: number;
  conflicts: number;
}

export interface MergeResult<T> {
  merged: SyncRecord<T>[];
  report: MergeReport;
}

/** İki koleksiyonu birleştirir. Sıra: kimliğe göre kararlı. */
export function mergeCollections<T>(
  local: readonly SyncRecord<T>[],
  remote: readonly SyncRecord<T>[],
): MergeResult<T> {
  const harita = new Map<string, SyncRecord<T>>();
  const report: MergeReport = { added: 0, updated: 0, deleted: 0, conflicts: 0 };

  for (const r of local) harita.set(r.id, r);

  for (const r of remote) {
    const mevcut = harita.get(r.id);
    if (!mevcut) {
      harita.set(r.id, r);
      if (r.deleted) report.deleted++; else report.added++;
      continue;
    }
    const { winner, outcome } = resolve(mevcut, r);
    if (outcome !== 'equal') report.conflicts++;
    if (winner !== mevcut) {
      harita.set(r.id, winner);
      if (winner.deleted && !mevcut.deleted) report.deleted++;
      else report.updated++;
    }
  }

  const merged = [...harita.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { merged, report };
}

/** Görünür kayıtlar: silinmişler gizlenir ama depoda kalır. */
export function visible<T>(records: readonly SyncRecord<T>[]): SyncRecord<T>[] {
  return records.filter((r) => !r.deleted);
}

/**
 * Mezar taşı temizliği: belli bir süre geçmiş silme işaretleri atılır.
 * Süre, en uzun çevrimdışı kalma ihtimalinden uzun seçilir (90 gün).
 */
export const TOMBSTONE_TTL_MS = 90 * 86400000;

export function pruneTombstones<T>(
  records: readonly SyncRecord<T>[],
  now = Date.now(),
  ttl = TOMBSTONE_TTL_MS,
): SyncRecord<T>[] {
  return records.filter((r) => !(r.deleted && now - r.updatedAt > ttl));
}

/**
 * Biriken sayaçların birleşimi — şartname §58.
 *
 * Kaza sayacı iki cihazda ayrı ayrı azaltılmışsa, "son yazan kazanır"
 * kuralı bir cihazda kılınan namazları yok sayar. Bunun yerine **ortak
 * atadan bu yana yapılan değişiklikler** toplanır.
 */
export interface CounterState {
  value: number;
  /** Son eşitlemede iki tarafın da bildiği değer. */
  base: number;
}

export function mergeCounter(local: CounterState, remote: CounterState): number {
  const yerelFark = local.value - local.base;
  const uzakFark = remote.value - remote.base;
  // Taban aynı olmalı; değilse en güvenli davranış küçük olanı seçmek değil,
  // iki tarafın değişimini de uygulamaktır.
  const taban = Math.min(local.base, remote.base);
  return Math.max(0, taban + yerelFark + uzakFark);
}

/** Toplanan sayaçlar (zikir toplamı gibi) için: iki tarafın toplamı. */
export function mergeAccumulator(local: CounterState, remote: CounterState): number {
  return Math.max(0, mergeCounter(local, remote));
}
