/** Konum modeli — şartname §13. */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place extends Coordinates {
  /** Kararlı kimlik: 'tr-34', 'world-mekke'. */
  id: string;
  name: string;
  /** Ülke adı (arayüzde gösterilir). */
  country: string;
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  /** IANA saat dilimi adı — sabit UTC farkı **kullanılmaz** (yaz saati). */
  timezone: string;
  /** Rakım (metre); ufuk düzeltmesinde kullanılır. */
  elevation?: number;
}

/** Kullanıcının kaydettiği konum: bir yer + ona özel hesap ayarları. */
export interface SavedLocation extends Place {
  label: string;
  isPrimary: boolean;
  /** GPS'ten mi geldi, elle mi seçildi. */
  origin: 'gps' | 'manual';
  savedAt: number;
}

export function isValidCoordinates(c: Coordinates): boolean {
  return (
    Number.isFinite(c.latitude) && Number.isFinite(c.longitude) &&
    c.latitude >= -90 && c.latitude <= 90 &&
    c.longitude >= -180 && c.longitude <= 180
  );
}
