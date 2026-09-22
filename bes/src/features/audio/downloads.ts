/**
 * Kıraat indirme yöneticisi — şartname §33.
 *
 * ⛔B4: indirilecek kayıt yok. Burada olan, kayıt geldiğinde değişmeyecek
 * kısım: hangi parçalar indirilmiş, ne kadar yer tutuyor, silince ne kadar
 * yer açılır. Depolama hesabı kullanıcıya **gerçek** rakam göstermek zorunda;
 * bu yüzden tahmin değil, dosya boyutlarının toplamı kullanılır.
 */

export interface DownloadItem {
  /** Kaynak kimliği: okuyucu + sure. */
  id: string;
  reciterId: string;
  surah: number;
  bytes: number;
  downloadedAt: number;
}

export interface StorageSummary {
  itemCount: number;
  totalBytes: number;
  byReciter: { reciterId: string; itemCount: number; bytes: number }[];
}

export function summarize(items: readonly DownloadItem[]): StorageSummary {
  const harita = new Map<string, { itemCount: number; bytes: number }>();
  let toplam = 0;
  for (const it of items) {
    toplam += Math.max(0, it.bytes);
    const mevcut = harita.get(it.reciterId) ?? { itemCount: 0, bytes: 0 };
    mevcut.itemCount += 1;
    mevcut.bytes += Math.max(0, it.bytes);
    harita.set(it.reciterId, mevcut);
  }
  return {
    itemCount: items.length,
    totalBytes: toplam,
    byReciter: [...harita.entries()]
      .map(([reciterId, v]) => ({ reciterId, ...v }))
      .sort((a, b) => b.bytes - a.bytes),
  };
}

/** İnsan okur biçim. Birim adları çeviriye bağlı değildir (KB/MB/GB evrensel). */
export function formatBytes(bytes: number): string {
  const b = Math.max(0, Math.round(bytes));
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Silinecek parçaların açacağı yer. */
export function bytesFreedBy(items: readonly DownloadItem[], ids: readonly string[]): number {
  const kume = new Set(ids);
  return items.filter((i) => kume.has(i.id)).reduce((t, i) => t + Math.max(0, i.bytes), 0);
}
