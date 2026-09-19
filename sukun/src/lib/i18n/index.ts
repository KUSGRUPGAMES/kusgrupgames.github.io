/** Yerelleştirme — tek giriş noktası. Şartname §61. */
export { tr, type StringKey, type Translations } from './strings/tr';
export { CORE_KEYS } from './strings/core';
export {
  translate, translateVerbose, resolveLanguage,
  LANGUAGES, LANGUAGE_NAMES, type Language, type TranslateResult,
} from './translate';
export {
  uiDirection, containsArabic, textDirection,
  RTL_LANGUAGES, SCRIPTURE_DIRECTION, SCRIPTURE_ALIGN,
  type UiLanguage, type Direction,
} from './direction';
export { FONT_ASSETS, ARABIC_FONT_LICENSE, scriptureFont, type ArabicFont } from './fonts';
export { LOCALE_TAGS, localeTag, useDateFormat } from './dates';
export { I18nProvider, useI18n, useT, type Translator, type I18nProviderProps } from './I18nProvider';
