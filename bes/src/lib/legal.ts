/**
 * Yasal sayfaların açılması — gizlilik ve kullanım koşulları.
 *
 * Neden ayrı bir dosya: bu bağlantı **iki ekrandan** açılıyor (Profil ve
 * Hesap) ve App Review'ın açıkça denediği tek bağlantı bu. Tek noktada
 * durması, birinin unutulmasını engelliyor.
 *
 * Bu bir hata düzeltmesidir: satırlar daha önce `chevron` ile çiziliyor ama
 * `onPress` almıyordu. `ListItem`, `onPress` yoksa dokunulabilir olmayan düz
 * bir `View` döndürüyor — yani ok işareti "dokun" diyor, dokunulunca hiçbir
 * şey olmuyordu. Apple gizlilik bağlantısının çalışmasını şart koşar.
 */
import { Linking } from 'react-native';
import { Brand } from '@/config/brand';
import { logger } from '@/lib/log';

const log = logger('legal');

export const LEGAL_URLS = {
  privacy: Brand.privacyUrl,
  terms: Brand.termsUrl,
} as const;

export type LegalPage = keyof typeof LEGAL_URLS;

/**
 * Yasal sayfayı sistem tarayıcısında açar.
 *
 * Başarısızlıkta **çökmez**: tarayıcısı olmayan ya da kısıtlanmış bir cihazda
 * `openURL` reddeder. Kullanıcıya gösterilecek bir şey yok; adres zaten
 * mağaza sayfasında da yazılı.
 */
export async function openLegalPage(page: LegalPage): Promise<boolean> {
  const url = LEGAL_URLS[page];
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    log.warn('yasal sayfa açılamadı', { page, error: String(error) });
    return false;
  }
}
