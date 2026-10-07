/**
 * Yön köprüsü — şartname §10.
 * `direction.ts` saf mantığı tutar; platforma dokunan tek yer burasıdır.
 *
 * Gerçek hata (cihazda görüldü): `I18nManager.isRTL` oturum boyunca sabittir.
 * Eski kod "istenen yön zaten `isRTL` ise hiçbir şey yazma" diyordu. Aynı
 * oturumda Türkçe → Arapça → Türkçe yapan kullanıcıda ikinci geçişte
 * `isRTL` hâlâ `false` olduğu için `forceRTL(false)` hiç yazılmıyor, diskte
 * `forceRTL(true)` kalıyordu. Sonraki her açılışta arayüz Türkçe seçiliyken
 * sağdan sola aynalanıyordu ve açılışta bunu düzelten hiçbir şey yoktu.
 *
 * Şimdi: istenen yön **her zaman** diske yazılır ve açılışta dil ile yön
 * uzlaştırılır (`reconcileUiDirection`).
 */
import { I18nManager } from 'react-native';
import { uiDirection, type UiLanguage } from './direction';

/** Arayüz şu an aynalanmış mı (yeniden başlatma sonrası geçerli olur). */
export function isUiRtl(): boolean {
  return I18nManager.isRTL;
}

/**
 * Dilin yönünü kalıcı ayara yazar. Çalışan oturumun yönü bundan farklıysa
 * `true` döner: değişiklik ancak yeniden yüklemeyle görünür.
 */
export function applyUiDirection(lang: UiLanguage): boolean {
  const wantRtl = uiDirection(lang) === 'rtl';
  I18nManager.allowRTL(wantRtl);
  I18nManager.forceRTL(wantRtl);
  return I18nManager.isRTL !== wantRtl;
}
