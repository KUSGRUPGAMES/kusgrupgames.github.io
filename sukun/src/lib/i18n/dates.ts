/**
 * Tarih biçimlendirme — şartname §61.
 *
 * Ekranlarda `new Intl.DateTimeFormat('tr-TR', …)` gömülü yazılıydı:
 * arayüz dilini İngilizce yapan kullanıcı yine "20 Eylül 2026" görüyordu.
 * Biçimlendirici artık seçili dilden gelir.
 *
 * Arapça için `-u-nu-latn` eklenir: saatler `formatHM` ile Latin rakamla
 * çizildiği için tarihlerin Hint-Arap rakamıyla gelmesi aynı ekranda iki
 * ayrı rakam kümesi demek olurdu.
 */
import { useMemo } from 'react';
import { useI18n } from './I18nProvider';
import type { Language } from './translate';

export const LOCALE_TAGS: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
  ar: 'ar-u-nu-latn',
  de: 'de-DE',
  fr: 'fr-FR',
};

export function localeTag(language: Language): string {
  return LOCALE_TAGS[language];
}

/** Seçili dile göre tarih biçimlendirici. */
export function useDateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const { language } = useI18n();
  const anahtar = JSON.stringify(options);
  return useMemo(
    () => new Intl.DateTimeFormat(localeTag(language), JSON.parse(anahtar) as Intl.DateTimeFormatOptions),
    [language, anahtar],
  );
}
