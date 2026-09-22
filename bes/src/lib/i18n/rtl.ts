/**
 * Yön köprüsü — şartname §10.
 * `direction.ts` saf mantığı tutar; platforma dokunan tek yer burasıdır.
 */
import { I18nManager } from 'react-native';
import { uiDirection, type UiLanguage } from './direction';

/** Arayüz şu an aynalanmış mı (yeniden başlatma sonrası geçerli olur). */
export function isUiRtl(): boolean {
  return I18nManager.isRTL;
}

/**
 * Arayüz dilini uygular. React Native'de yön değişimi **uygulamanın yeniden
 * başlatılmasını** gerektirir; bu yüzden değişiklik gerekiyorsa `true` döner
 * ve çağıran taraf kullanıcıya yeniden başlatma bilgisini gösterir.
 */
export function applyUiDirection(lang: UiLanguage): boolean {
  const wantRtl = uiDirection(lang) === 'rtl';
  if (I18nManager.isRTL === wantRtl) return false;
  I18nManager.allowRTL(wantRtl);
  I18nManager.forceRTL(wantRtl);
  return true;
}
