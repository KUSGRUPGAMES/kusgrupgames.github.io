/**
 * Hicrî ay, dinî gün ve hesaplama yöntemi adlarının dil karşılıkları.
 *
 * Bu adlar veri dosyalarında Türkçe sabit olarak duruyor (`HIJRI_MONTHS`,
 * `RELIGIOUS_DAYS`, `METHODS`) — hesap mantığı dile bağlı olmasın diye. Ama
 * ekranda görünen şey dile bağlı olmak zorunda: arayüz beş dile çevrildikten
 * sonra tek Türkçe kalan yer bu adlardı.
 *
 * Veri katmanındaki `label` alanı Türkçe kaynak olarak kalır; ekranlar bu
 * kancaları kullanır.
 */
import { useT } from '@/lib/i18n';
import type { StringKey } from '@/lib/i18n/strings/tr';
import type { ReligiousDayId } from './calc';
import type { MethodId } from '../prayer/methods';

/** 1–12 arası hicrî ay numarasının adı. */
export function useHijriMonthName(): (month: number) => string {
  const t = useT();
  return (month) => {
    const n = Math.min(12, Math.max(1, Math.round(month)));
    return t(`hijriMonth.${n}` as StringKey);
  };
}

/** Dinî günün adı. */
export function useReligiousDayName(): (id: ReligiousDayId) => string {
  const t = useT();
  return (id) => t(`religiousDay.${id}` as StringKey);
}

/** Hesaplama yönteminin adı. */
export function useMethodName(): (id: MethodId) => string {
  const t = useT();
  return (id) => t(`method.${id}` as StringKey);
}
