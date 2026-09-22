/**
 * Çeviri çekirdeği — şartname §61. Saf mantık: React Native'e bağlı değildir.
 *
 * Kurallar:
 * - Türkçe kaynak dildir; eksik çeviri Türkçeye düşer, asla anahtar adı ya da
 *   boş metin gösterilmez.
 * - Yer tutucular `{ad}` biçimindedir. Karşılığı verilmeyen yer tutucu
 *   **olduğu gibi bırakılmaz**: geliştirme sırasında yakalansın diye
 *   `missingParams` listesine yazılır ve metinden temizlenir.
 */
import { tr, type StringKey } from './strings/tr';
import { en } from './strings/en';
import { ar } from './strings/ar';
import { de } from './strings/de';
import { fr } from './strings/fr';
import type { UiLanguage } from './direction';

export type Language = UiLanguage | 'de' | 'fr';

export const LANGUAGES: readonly Language[] = ['tr', 'en', 'ar', 'de', 'fr'];

export const LANGUAGE_NAMES: Record<Language, string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
  fr: 'Français',
};

const TABLES: Record<Language, Partial<Record<StringKey, string>>> = { tr, en, ar, de, fr };

export interface TranslateResult {
  text: string;
  /** Çeviri bulunamadığı için Türkçeye düşüldü mü. */
  fellBack: boolean;
  /** Metindeki karşılığı verilmemiş yer tutucular. */
  missingParams: string[];
}

const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

/** Ayrıntılı çeviri — sınama ve tanılama için. */
export function translateVerbose(
  lang: Language,
  key: StringKey,
  params?: Readonly<Record<string, string | number>>,
): TranslateResult {
  const table = TABLES[lang];
  const raw = table[key];
  const fellBack = raw === undefined;
  /**
   * Türkçede de yoksa boş metin döner ve **çökmez**.
   *
   * Anahtarların çoğu derleme anında denetleniyor (`StringKey`), ama bir kısmı
   * çalışma anında kuruluyor: ay evresi adı, ana sayfa kart kimliği, arama
   * sonucu türü. Oralarda bir uyuşmazlık olursa ekranın komple çökmesi kabul
   * edilemez; hiç olmazsa boş kalır. Anahtar adı asla kullanıcıya gösterilmez.
   */
  const source = raw ?? tr[key] ?? '';
  const missingParams: string[] = [];
  const text = source.replace(PLACEHOLDER, (_whole, name: string) => {
    const value = params?.[name];
    if (value === undefined) {
      missingParams.push(name);
      return '';
    }
    return String(value);
  }).replace(/\s{2,}/g, ' ').trim();
  return { text, fellBack, missingParams };
}

/** Uygulamanın kullandığı biçim. */
export function translate(
  lang: Language,
  key: StringKey,
  params?: Readonly<Record<string, string | number>>,
): string {
  return translateVerbose(lang, key, params).text;
}

/**
 * Cihaz dil etiketinden ('tr-TR', 'de_DE', 'en') desteklenen dili seçer.
 * Tanımadığı etikette Türkçeye döner — ürünün birincil pazarı Türkiye.
 */
export function resolveLanguage(tag: string | null | undefined): Language {
  if (!tag) return 'tr';
  const base = tag.toLowerCase().replace('_', '-').split('-')[0];
  const found = LANGUAGES.find((l) => l === base);
  return found ?? 'tr';
}
