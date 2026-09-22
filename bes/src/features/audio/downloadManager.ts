/**
 * Kıraat indirme yöneticisi — şartname §33.
 *
 * Bir sureyi indirmek, o surenin âyet dosyalarını cihaza kopyalamaktır.
 * Depolama hesabı gerçek dosya boyutlarından gelir, tahminden değil:
 * kullanıcıya "şu kadar yer açılacak" derken yanılmamak gerekir.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '@/lib/log';
import { ayahAudioUrl } from './source';

const log = logger('indirme');

const KOK = `${FileSystem.documentDirectory ?? ''}recitation/`;

export interface DownloadProgress {
  done: number;
  total: number;
}

function klasor(reciterId: string, bitrate: number): string {
  return `${KOK}${reciterId}-${bitrate}/`;
}

export function localPath(reciterId: string, bitrate: number, globalAyah: number): string {
  return `${klasor(reciterId, bitrate)}${globalAyah}.mp3`;
}

async function klasorHazirla(dizin: string): Promise<void> {
  const bilgi = await FileSystem.getInfoAsync(dizin);
  if (!bilgi.exists) await FileSystem.makeDirectoryAsync(dizin, { intermediates: true });
}

/** Dosya cihazda var mı. */
export async function isDownloaded(reciterId: string, bitrate: number, globalAyah: number): Promise<boolean> {
  try {
    return (await FileSystem.getInfoAsync(localPath(reciterId, bitrate, globalAyah))).exists;
  } catch {
    return false;
  }
}

/**
 * Bir sureyi indirir. Var olan dosyalar atlanır; yarıda kesilirse indirilmiş
 * kısım kalır ve tekrar denendiğinde kaldığı yerden sürer.
 */
export async function downloadSurah(
  reciterId: string,
  bitrate: number,
  firstGlobalAyah: number,
  ayahCount: number,
  onProgress?: (p: DownloadProgress) => void,
  signal?: { cancelled: boolean },
): Promise<{ downloaded: number; failed: number }> {
  await klasorHazirla(klasor(reciterId, bitrate));
  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < ayahCount; i++) {
    if (signal?.cancelled) break;
    const global = firstGlobalAyah + i;
    const hedef = localPath(reciterId, bitrate, global);

    try {
      if ((await FileSystem.getInfoAsync(hedef)).exists) {
        downloaded++;
      } else {
        const url = ayahAudioUrl(reciterId, global, bitrate);
        if (!url) { failed++; continue; }
        const sonuc = await FileSystem.downloadAsync(url, hedef);
        if (sonuc.status === 200) downloaded++;
        else { failed++; await FileSystem.deleteAsync(hedef, { idempotent: true }); }
      }
    } catch (e) {
      failed++;
      log.warn('âyet indirilemedi', { global, error: e });
    }
    onProgress?.({ done: i + 1, total: ayahCount });
  }

  return { downloaded, failed };
}

/** Bir okuyucunun indirilmiş dosyalarının toplam boyutu (bayt). */
export async function usedBytes(reciterId?: string, bitrate?: number): Promise<number> {
  try {
    const kok = reciterId && bitrate ? klasor(reciterId, bitrate) : KOK;
    const bilgi = await FileSystem.getInfoAsync(kok);
    if (!bilgi.exists) return 0;
    let toplam = 0;
    const yigin = [kok];
    while (yigin.length > 0) {
      const dizin = yigin.pop()!;
      for (const ad of await FileSystem.readDirectoryAsync(dizin)) {
        const yol = `${dizin}${ad}`;
        const d = await FileSystem.getInfoAsync(yol);
        if (!d.exists) continue;
        if (d.isDirectory) yigin.push(`${yol}/`);
        // `size` yalnız var olan dosyada bulunur; tip daraltması bunu gerektirir.
        else toplam += (d as { size?: number }).size ?? 0;
      }
    }
    return toplam;
  } catch {
    return 0;
  }
}

/** İndirmeleri siler. Okuyucu verilmezse hepsi. */
export async function clearDownloads(reciterId?: string, bitrate?: number): Promise<void> {
  try {
    const hedef = reciterId && bitrate ? klasor(reciterId, bitrate) : KOK;
    await FileSystem.deleteAsync(hedef, { idempotent: true });
  } catch (e) {
    log.warn('indirmeler silinemedi', { error: e });
  }
}
