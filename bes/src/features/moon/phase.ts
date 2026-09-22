/**
 * Ay durumu — şartname §46.
 *
 * Kullanılan model **aritmetik**tir: ortalama kavuşum (sinodik) ayına dayanır.
 * Gerçek yeni ay anından ±14 saate kadar sapabilir; bu, "ayın görünümü"
 * göstergesi için yeterlidir ama **rüyet (hilal görme) kararı değildir** ve
 * arayüzde de böyle sunulur. Dinî günler için ayrı bir katman vardır (§45).
 */

/** Ortalama sinodik ay (gün). */
export const SYNODIC_MONTH = 29.530588853;

/** Referans yeni ay: 6 Ocak 2000, 18:14 UTC (JD 2451550.26). */
const EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export type PhaseName =
  | 'newMoon' | 'waxingCrescent' | 'firstQuarter' | 'waxingGibbous'
  | 'fullMoon' | 'waningGibbous' | 'lastQuarter' | 'waningCrescent';

export interface MoonState {
  /** Kavuşum ayı içindeki konum, 0..1 (0 = yeni ay, 0.5 = dolunay). */
  phase: number;
  /** Ayın yaşı (gün). */
  ageDays: number;
  /** Aydınlanma oranı 0..1. */
  illumination: number;
  name: PhaseName;
  /** Bir sonraki yeni ay (yaklaşık). */
  nextNewMoon: Date;
  /** Bir sonraki dolunay (yaklaşık). */
  nextFullMoon: Date;
}

function normalize(x: number): number {
  return ((x % 1) + 1) % 1;
}

export function phaseName(phase: number): PhaseName {
  const p = normalize(phase);
  // Kesin evreler (yeni ay, ilk dördün, dolunay, son dördün) dar bir pencere
  // alır; aradaki geniş bölgeler hilal/şişkin evrelerdir.
  const esik = 0.02;
  if (p < esik || p > 1 - esik) return 'newMoon';
  if (Math.abs(p - 0.25) < esik) return 'firstQuarter';
  if (Math.abs(p - 0.5) < esik) return 'fullMoon';
  if (Math.abs(p - 0.75) < esik) return 'lastQuarter';
  if (p < 0.25) return 'waxingCrescent';
  if (p < 0.5) return 'waxingGibbous';
  if (p < 0.75) return 'waningGibbous';
  return 'waningCrescent';
}

export function moonState(date: Date = new Date()): MoonState {
  const gun = (date.getTime() - EPOCH_MS) / 86400000;
  const phase = normalize(gun / SYNODIC_MONTH);
  const ageDays = phase * SYNODIC_MONTH;
  // Aydınlanma: faz açısının kosinüsünden. 0 = karanlık, 1 = dolunay.
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;

  const sonrakiYeni = new Date(date.getTime() + (1 - phase) * SYNODIC_MONTH * 86400000);
  const dolunayFarki = normalize(0.5 - phase);
  const sonrakiDolunay = new Date(date.getTime() + dolunayFarki * SYNODIC_MONTH * 86400000);

  return {
    phase,
    ageDays,
    illumination,
    name: phaseName(phase),
    nextNewMoon: sonrakiYeni,
    nextFullMoon: sonrakiDolunay,
  };
}
