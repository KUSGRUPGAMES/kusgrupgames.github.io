/**
 * Günün âyeti seçimi — ana sayfa kartı ve widget aynı işlevi kullanır.
 *
 * Panelde âyet havuzu tanımlıysa (D36) âyet havuzdan, değilse bütün
 * Kur'an'dan seçilir. İkisinde de seçim tarihten türetilir (aynı gün aynı âyet).
 */
import { dailyIndex, pickDaily } from './pick';
import {
  getAyah, getAyahByIndex, getQuranIndexSize, getSurah, getTranslation, getTranslationByIndex,
} from '@/features/quran/data';

export interface DailyVerse { surah: number; ayah: number; text: string; surahName: string; meal: string | null }

export function pickDailyVerse(
  g: { year: number; month: number; day: number },
  pool: readonly { surah: number; ayah: number }[],
): DailyVerse | null {
  if (pool.length) {
    const v = pickDaily(pool, { ...g, salt: 313 });
    const a = v ? getAyah(v.surah, v.ayah) : undefined;
    if (v && a) {
      return { surah: v.surah, ayah: v.ayah, text: a.text, surahName: getSurah(v.surah)?.nameTr ?? '', meal: getTranslation(v.surah, v.ayah) };
    }
  }
  const i = dailyIndex({ ...g, length: getQuranIndexSize(), salt: 313 });
  const a = i < 0 ? null : getAyahByIndex(i);
  if (!a) return null;
  return { surah: a.surah, ayah: a.ayah, text: a.text, surahName: a.surahName, meal: getTranslationByIndex(i) };
}
