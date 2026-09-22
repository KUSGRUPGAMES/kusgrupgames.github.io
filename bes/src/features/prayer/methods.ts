/**
 * Hesaplama yöntemleri — şartname §15.
 * Fecir ve yatsı güneş açıları tek kaynaktır; yeni yöntem eklemek bu tabloya
 * bir satır yazmaktır.
 */
export type MethodId =
  | 'diyanet' | 'mwl' | 'isna' | 'egypt' | 'karachi' | 'makkah' | 'tehran';

export interface CalculationMethod {
  id: MethodId;
  /** Arayüzde görünen ad. */
  label: string;
  /** Fecir için güneşin ufuk altı açısı (derece). */
  fajrAngle: number;
  /** Yatsı için açı. `ishaMinutes` verilmişse kullanılmaz. */
  ishaAngle?: number;
  /** Ümmü'l-Kurâ yatsıyı açıyla değil, akşamdan N dakika sonra hesaplar. */
  ishaMinutes?: number;
}

export const METHODS: Record<MethodId, CalculationMethod> = {
  diyanet: { id: 'diyanet', label: 'Diyanet (Türkiye)', fajrAngle: 18, ishaAngle: 17 },
  mwl: { id: 'mwl', label: 'Müslüman Dünya Birliği', fajrAngle: 18, ishaAngle: 17 },
  isna: { id: 'isna', label: 'ISNA (Kuzey Amerika)', fajrAngle: 15, ishaAngle: 15 },
  egypt: { id: 'egypt', label: 'Mısır Genel Araştırma', fajrAngle: 19.5, ishaAngle: 17.5 },
  karachi: { id: 'karachi', label: 'Karaçi Üniversitesi', fajrAngle: 18, ishaAngle: 18 },
  makkah: { id: 'makkah', label: 'Ümmü’l-Kurâ (Mekke)', fajrAngle: 18.5, ishaMinutes: 90 },
  tehran: { id: 'tehran', label: 'Tahran Jeofizik', fajrAngle: 17.7, ishaAngle: 14 },
};

/** İkindi gölge oranı: 1 = Şâfiî/Mâlikî/Hanbelî (ve Diyanet), 2 = Hanefî. */
export type AsrShadow = 1 | 2;

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle',
  asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı',
};

/** Güneş bir namaz vakti değildir; kaza ve takip beş vakit üzerinden işler. */
export const OBLIGATORY_KEYS: readonly PrayerKey[] =
  ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
