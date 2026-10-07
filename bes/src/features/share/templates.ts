/**
 * Hazır kartı paylaşım kartı içeriğine çevirir. Âyet kartlarında metin
 * uygulamanın doğrulanmış paketinden okunur (Tanzil + Elmalılı); bulunamazsa
 * kart **üretilmez** (null) — metin asla elle doldurulmaz.
 */
import { getAyah, getSurah, getTranslation, getTranslationInfo } from '@/features/quran/data';
import type { CardTemplate } from '@/content/cardTemplates';
import type { CardContent } from './card';

export interface TemplateLabels {
  /** "Tebrik mesajı" gibi künye. */
  greetingSource: string;
  /** "{name} meali · {rights}" biçimli meal künyesi. */
  translationSource: (name: string) => string;
  brand: string;
}

export function resolveTemplate(t: CardTemplate, labels: TemplateLabels): CardContent | null {
  if (t.kind === 'greeting') {
    return {
      eyebrow: t.eyebrow,
      ...(t.arabic ? { arabic: t.arabic } : {}),
      body: t.body,
      source: labels.greetingSource,
      brand: labels.brand,
    };
  }
  const ayet = getAyah(t.surah, t.ayah);
  const meal = getTranslation(t.surah, t.ayah);
  const sure = getSurah(t.surah);
  if (!ayet || !meal || !sure) return null;
  return {
    eyebrow: t.eyebrow,
    arabic: ayet.text,
    body: meal,
    reference: `${sure.nameTr} ${t.ayah}`,
    source: labels.translationSource(getTranslationInfo().name),
    brand: labels.brand,
  };
}
