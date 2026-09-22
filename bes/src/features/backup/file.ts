/**
 * Yedek dosyasının cihazla teması — yazma, paylaşma, seçme, okuma.
 *
 * Birleştirme mantığı burada **yoktur** (`backup.ts`): o saf ve Node'da
 * sınanabilir kalsın diye platform bağımlılıkları bu dosyada toplanır.
 *
 * `expo-file-system/legacy` kullanılıyor; depodaki indirme yöneticisi de aynı
 * API'yi kullanıyor ve ikisinin ayrı API sürümleri konuşması bakım yükü olur.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { logger } from '@/lib/log';
import { backupFileName, createBackup, parseBackup, type Backup, type BackupPayload } from './backup';

const log = logger('yedek');

export type ExportOutcome =
  | { ok: true; uri: string; fileName: string }
  | { ok: false; reason: 'write' | 'unavailable' };

/**
 * Yedeği dosyaya yazar ve sistemin paylaşım tepsisine verir.
 *
 * Önbellek dizinine yazılır: kullanıcı dosyayı nereye koyacağına kendisi karar
 * verir (kendi bulutu, e-posta, mesajlaşma). Uygulama hiçbir yere göndermez.
 */
export async function exportBackup(payload: BackupPayload, app: string): Promise<ExportOutcome> {
  const fileName = backupFileName();
  const uri = `${FileSystem.cacheDirectory ?? ''}${fileName}`;
  const yedek: Backup = createBackup(payload, app);

  try {
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(yedek, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    log.warn('yedek yazılamadı', { error: e });
    return { ok: false, reason: 'write' };
  }

  try {
    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'unavailable' };
    await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: fileName });
  } catch (e) {
    // Kullanıcı tepsiyi kapattıysa da buraya düşülür; dosya yazıldı, hata değil.
    log.debug('paylaşım tamamlanmadı', { error: e });
  }
  return { ok: true, uri, fileName };
}

export type ImportFailure = 'cancelled' | 'read' | 'json' | 'format' | 'version' | 'schema';

export type ImportOutcome =
  | { ok: true; backup: Backup }
  | { ok: false; reason: ImportFailure };

/** Kullanıcıdan bir yedek dosyası ister ve çözümler. */
export async function pickBackup(): Promise<ImportOutcome> {
  let uri: string;
  try {
    const secim = await DocumentPicker.getDocumentAsync({
      // JSON dışında bir tür de seçilebilsin: bazı bulut sağlayıcıları
      // dosyayı `application/octet-stream` diye işaretliyor ve tür süzgeci
      // yedeği listede göstermiyor. Doğrulamayı içerik yapıyor, uzantı değil.
      type: ['application/json', 'text/plain', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (secim.canceled) return { ok: false, reason: 'cancelled' };
    const dosya = secim.assets[0];
    if (!dosya) return { ok: false, reason: 'cancelled' };
    uri = dosya.uri;
  } catch (e) {
    log.warn('dosya seçilemedi', { error: e });
    return { ok: false, reason: 'read' };
  }

  let metin: string;
  try {
    metin = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (e) {
    log.warn('yedek okunamadı', { error: e });
    return { ok: false, reason: 'read' };
  }

  const sonuc = parseBackup(metin);
  if (!sonuc.ok) return { ok: false, reason: sonuc.reason };
  return { ok: true, backup: sonuc.backup };
}
