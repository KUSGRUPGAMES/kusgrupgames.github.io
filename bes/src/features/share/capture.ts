/**
 * Kartı görsele çevirip paylaşır — şartname §62.
 *
 * SVG doğrudan paylaşılmaz: WhatsApp ve Instagram SVG kabul etmez. Kart
 * görünmez bir katmanda tam çözünürlükte çizilir, PNG'ye alınır ve
 * sistemin paylaşım tepsisine verilir.
 */
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { logger } from '@/lib/log';
import type { RefObject } from 'react';
import type { View } from 'react-native';

const log = logger('paylasim');

export type ShareOutcome =
  | { ok: true; uri: string }
  | { ok: false; reason: 'capture' | 'unavailable' };

export async function shareCard(ref: RefObject<View | null>, fileName = 'bes-kart'): Promise<ShareOutcome> {
  if (!ref.current) return { ok: false, reason: 'capture' };

  let uri: string;
  try {
    uri = await captureRef(ref, { format: 'png', quality: 1, fileName });
  } catch (e) {
    log.warn('kart görsele çevrilemedi', { error: e });
    return { ok: false, reason: 'capture' };
  }

  try {
    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'unavailable' };
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: fileName });
    return { ok: true, uri };
  } catch (e) {
    // Kullanıcı paylaşımı iptal ettiyse de buraya düşülür; hata değildir.
    log.debug('paylaşım tamamlanmadı', { error: e });
    return { ok: true, uri };
  }
}
