/**
 * Pro kapıları — D33. Saf kurallar; yerel modül yok, düğüm ortamında sınanır.
 *
 * İbadetin kendisi kilitlenmez (`entitlements.ts` → `ALWAYS_FREE`). Burada
 * yalnız "çoğaltan" yetenekler var: Öğren'in ileri üniteleri ve Topluluğun
 * yazma/kurma yetenekleri.
 */

/** 1-3. üniteler (harfler, bitişme, harekeler) herkese açık. */
export const FREE_LEARN_UNITS = 3;

export function isLessonFree(unit: number): boolean {
  return unit <= FREE_LEARN_UNITS;
}

export interface CommunityLimits {
  /** Günlük dua isteği. Sunucudaki üst sınır 5 (0001_community.sql). */
  duaRequestsPerDay: number;
  /** Sohbet odalarına yazabilir mi (okumak herkese açık). */
  canChat: boolean;
  /** Hatim grubu kurabilir mi (katılıp cüz almak herkese açık). */
  canCreateKhatm: boolean;
}

export function communityLimits(pro: boolean): CommunityLimits {
  return pro
    ? { duaRequestsPerDay: 5, canChat: true, canCreateKhatm: true }
    : { duaRequestsPerDay: 1, canChat: false, canCreateKhatm: false };
}

/**
 * Son 24 saatteki kayıt sayısı. Sunucudaki sınır da kayan 24 saatle sayıyor
 * (0001_community.sql → `now() - interval '24 hours'`); ikisi aynı kurala
 * bakmazsa istemci izin verip sunucu reddeder.
 */
export function countInLast24h(createdAts: readonly string[], now: number = Date.now()): number {
  const sinir = now - 24 * 60 * 60 * 1000;
  return createdAts.filter((c) => Date.parse(c) > sinir).length;
}
