/** Yer arama — şartname §13, §78. */
import { ALL_PLACES } from './places';
import { matchScore, normalizeSearch } from './normalize';
import type { Coordinates, Place } from './types';

export interface SearchOptions {
  limit?: number;
  /** Yalnız bu ülke kodundakiler. */
  countryCode?: string;
}

export function searchPlaces(query: string, options: SearchOptions = {}): Place[] {
  const limit = options.limit ?? 20;
  const q = normalizeSearch(query);
  const havuz = options.countryCode
    ? ALL_PLACES.filter((p) => p.countryCode === options.countryCode)
    : ALL_PLACES;

  if (!q) return havuz.slice(0, limit);

  // Şehir adıyla eşleşen her sonuç, ülke adıyla eşleşen her sonucun
  // üstündedir. Eskiden ikisi tek bir puanda toplanıyordu: "İs" yazınca
  // İstanbul'un hemen ardında Kahire (Mısır) ve Karaçi (Pakistan)
  // sıralanıyordu — ülke adında "is" geçtiği için.
  return havuz
    .map((p) => {
      const ad = matchScore(p.name, q);
      const ulke = matchScore(p.country, q);
      return { p, score: ad > 0 ? ad + 3 : (ulke > 0 ? 1 : 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => (b.score - a.score) || a.p.name.localeCompare(b.p.name, 'tr'))
    .slice(0, limit)
    .map((x) => x.p);
}

/** İki nokta arası büyük daire uzaklığı (km). */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * GPS noktasına en yakın yerleşik şehir. Ters coğrafi kodlama ağ ister;
 * bu işlev **çevrimdışı** çalışır ve saat dilimini de getirir.
 */
export function nearestPlace(point: Coordinates, maxKm = 400): Place | null {
  let best: Place | null = null;
  let bestKm = Infinity;
  for (const p of ALL_PLACES) {
    const km = distanceKm(point, p);
    if (km < bestKm) { bestKm = km; best = p; }
  }
  return bestKm <= maxKm ? best : null;
}
