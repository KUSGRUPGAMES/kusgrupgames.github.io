/**
 * Yerleşik yer listesi — şartname §13.
 *
 * Amaç: **hesapsız ve internetsiz** kullanılabilmek. Kullanıcı konum izni
 * vermezse ya da GPS yoksa buradan şehir seçer ve vakitler yine hesaplanır.
 *
 * Saat dilimi IANA adıyla tutulur; sabit UTC farkı tutulmaz. (Sabit fark
 * `seher/` içinde bir kez hataya yol açtı: yaz saatinde Avrupa şehirleri bir
 * saat kaydı.)
 */
import type { Place } from './types';

/** Türkiye'nin 81 ili. Hepsi Europe/Istanbul. */
export const TURKEY_PROVINCES: readonly Place[] = [
  ['01', 'Adana', 36.9914, 35.3308], ['02', 'Adıyaman', 37.7648, 38.2786],
  ['03', 'Afyonkarahisar', 38.7507, 30.5567], ['04', 'Ağrı', 39.7191, 43.0503],
  ['05', 'Amasya', 40.6499, 35.8353], ['06', 'Ankara', 39.9334, 32.8597],
  ['07', 'Antalya', 36.8969, 30.7133], ['08', 'Artvin', 41.1828, 41.8183],
  ['09', 'Aydın', 37.8560, 27.8416], ['10', 'Balıkesir', 39.6484, 27.8826],
  ['11', 'Bilecik', 40.1506, 29.9833], ['12', 'Bingöl', 38.8854, 40.4980],
  ['13', 'Bitlis', 38.4006, 42.1095], ['14', 'Bolu', 40.7350, 31.6061],
  ['15', 'Burdur', 37.7203, 30.2908], ['16', 'Bursa', 40.1885, 29.0610],
  ['17', 'Çanakkale', 40.1553, 26.4142], ['18', 'Çankırı', 40.6013, 33.6134],
  ['19', 'Çorum', 40.5506, 34.9556], ['20', 'Denizli', 37.7765, 29.0864],
  ['21', 'Diyarbakır', 37.9144, 40.2306], ['22', 'Edirne', 41.6818, 26.5623],
  ['23', 'Elazığ', 38.6810, 39.2264], ['24', 'Erzincan', 39.7500, 39.5000],
  ['25', 'Erzurum', 39.9000, 41.2700], ['26', 'Eskişehir', 39.7767, 30.5206],
  ['27', 'Gaziantep', 37.0662, 37.3833], ['28', 'Giresun', 40.9128, 38.3895],
  ['29', 'Gümüşhane', 40.4386, 39.5086], ['30', 'Hakkâri', 37.5744, 43.7408],
  ['31', 'Hatay', 36.2025, 36.1606], ['32', 'Isparta', 37.7648, 30.5566],
  ['33', 'Mersin', 36.8000, 34.6333], ['34', 'İstanbul', 41.0082, 28.9784],
  ['35', 'İzmir', 38.4237, 27.1428], ['36', 'Kars', 40.6013, 43.0975],
  ['37', 'Kastamonu', 41.3887, 33.7827], ['38', 'Kayseri', 38.7312, 35.4787],
  ['39', 'Kırklareli', 41.7333, 27.2167], ['40', 'Kırşehir', 39.1425, 34.1709],
  ['41', 'Kocaeli', 40.8533, 29.8815], ['42', 'Konya', 37.8667, 32.4833],
  ['43', 'Kütahya', 39.4167, 29.9833], ['44', 'Malatya', 38.3552, 38.3095],
  ['45', 'Manisa', 38.6191, 27.4289], ['46', 'Kahramanmaraş', 37.5858, 36.9371],
  ['47', 'Mardin', 37.3212, 40.7245], ['48', 'Muğla', 37.2153, 28.3636],
  ['49', 'Muş', 38.9462, 41.7539], ['50', 'Nevşehir', 38.6939, 34.6857],
  ['51', 'Niğde', 37.9667, 34.6833], ['52', 'Ordu', 40.9839, 37.8764],
  ['53', 'Rize', 41.0201, 40.5234], ['54', 'Sakarya', 40.7569, 30.3781],
  ['55', 'Samsun', 41.2867, 36.3300], ['56', 'Siirt', 37.9333, 41.9500],
  ['57', 'Sinop', 42.0231, 35.1531], ['58', 'Sivas', 39.7477, 37.0179],
  ['59', 'Tekirdağ', 40.9833, 27.5167], ['60', 'Tokat', 40.3167, 36.5500],
  ['61', 'Trabzon', 41.0015, 39.7178], ['62', 'Tunceli', 39.1079, 39.5401],
  ['63', 'Şanlıurfa', 37.1591, 38.7969], ['64', 'Uşak', 38.6823, 29.4082],
  ['65', 'Van', 38.4891, 43.4089], ['66', 'Yozgat', 39.8181, 34.8147],
  ['67', 'Zonguldak', 41.4564, 31.7987], ['68', 'Aksaray', 38.3687, 34.0370],
  ['69', 'Bayburt', 40.2552, 40.2249], ['70', 'Karaman', 37.1759, 33.2287],
  ['71', 'Kırıkkale', 39.8468, 33.5153], ['72', 'Batman', 37.8812, 41.1351],
  ['73', 'Şırnak', 37.5164, 42.4611], ['74', 'Bartın', 41.6344, 32.3375],
  ['75', 'Ardahan', 41.1105, 42.7022], ['76', 'Iğdır', 39.9237, 44.0450],
  ['77', 'Yalova', 40.6500, 29.2667], ['78', 'Karabük', 41.2061, 32.6204],
  ['79', 'Kilis', 36.7184, 37.1212], ['80', 'Osmaniye', 37.0742, 36.2464],
  ['81', 'Düzce', 40.8438, 31.1565],
].map(([code, name, lat, lng]) => ({
  id: `tr-${code as string}`,
  name: name as string,
  country: 'Türkiye',
  countryCode: 'TR',
  timezone: 'Europe/Istanbul',
  latitude: lat as number,
  longitude: lng as number,
}));

/** Sık kullanılan dünya şehirleri — gurbetteki kullanıcı ve kutsal şehirler. */
export const WORLD_CITIES: readonly Place[] = [
  ['mekke', 'Mekke', 'Suudi Arabistan', 'SA', 'Asia/Riyadh', 21.4225, 39.8262],
  ['medine', 'Medine', 'Suudi Arabistan', 'SA', 'Asia/Riyadh', 24.4672, 39.6111],
  ['kudus', 'Kudüs', 'Filistin', 'PS', 'Asia/Hebron', 31.7767, 35.2345],
  ['kahire', 'Kahire', 'Mısır', 'EG', 'Africa/Cairo', 30.0444, 31.2357],
  ['baku', 'Bakü', 'Azerbaycan', 'AZ', 'Asia/Baku', 40.4093, 49.8671],
  ['lefkosa', 'Lefkoşa', 'Kuzey Kıbrıs', 'CY', 'Asia/Nicosia', 35.1856, 33.3823],
  ['uskup', 'Üsküp', 'Kuzey Makedonya', 'MK', 'Europe/Skopje', 41.9981, 21.4254],
  ['saraybosna', 'Saraybosna', 'Bosna-Hersek', 'BA', 'Europe/Sarajevo', 43.8563, 18.4131],
  ['berlin', 'Berlin', 'Almanya', 'DE', 'Europe/Berlin', 52.5200, 13.4050],
  ['koln', 'Köln', 'Almanya', 'DE', 'Europe/Berlin', 50.9375, 6.9603],
  ['munih', 'Münih', 'Almanya', 'DE', 'Europe/Berlin', 48.1351, 11.5820],
  ['frankfurt', 'Frankfurt', 'Almanya', 'DE', 'Europe/Berlin', 50.1109, 8.6821],
  ['hamburg', 'Hamburg', 'Almanya', 'DE', 'Europe/Berlin', 53.5511, 9.9937],
  ['viyana', 'Viyana', 'Avusturya', 'AT', 'Europe/Vienna', 48.2082, 16.3738],
  ['amsterdam', 'Amsterdam', 'Hollanda', 'NL', 'Europe/Amsterdam', 52.3676, 4.9041],
  ['rotterdam', 'Rotterdam', 'Hollanda', 'NL', 'Europe/Amsterdam', 51.9244, 4.4777],
  ['brüksel', 'Brüksel', 'Belçika', 'BE', 'Europe/Brussels', 50.8503, 4.3517],
  ['paris', 'Paris', 'Fransa', 'FR', 'Europe/Paris', 48.8566, 2.3522],
  ['londra', 'Londra', 'Birleşik Krallık', 'GB', 'Europe/London', 51.5074, -0.1278],
  ['zurih', 'Zürih', 'İsviçre', 'CH', 'Europe/Zurich', 47.3769, 8.5417],
  ['stokholm', 'Stockholm', 'İsveç', 'SE', 'Europe/Stockholm', 59.3293, 18.0686],
  ['kopenhag', 'Kopenhag', 'Danimarka', 'DK', 'Europe/Copenhagen', 55.6761, 12.5683],
  ['oslo', 'Oslo', 'Norveç', 'NO', 'Europe/Oslo', 59.9139, 10.7522],
  ['moskova', 'Moskova', 'Rusya', 'RU', 'Europe/Moscow', 55.7558, 37.6173],
  ['newyork', 'New York', 'ABD', 'US', 'America/New_York', 40.7128, -74.0060],
  ['sikago', 'Chicago', 'ABD', 'US', 'America/Chicago', 41.8781, -87.6298],
  ['losangeles', 'Los Angeles', 'ABD', 'US', 'America/Los_Angeles', 34.0522, -118.2437],
  ['toronto', 'Toronto', 'Kanada', 'CA', 'America/Toronto', 43.6532, -79.3832],
  ['dubai', 'Dubai', 'BAE', 'AE', 'Asia/Dubai', 25.2048, 55.2708],
  ['doha', 'Doha', 'Katar', 'QA', 'Asia/Qatar', 25.2854, 51.5310],
  ['tahran', 'Tahran', 'İran', 'IR', 'Asia/Tehran', 35.6892, 51.3890],
  ['bagdat', 'Bağdat', 'Irak', 'IQ', 'Asia/Baghdad', 33.3152, 44.3661],
  ['karaci', 'Karaçi', 'Pakistan', 'PK', 'Asia/Karachi', 24.8607, 67.0011],
  ['cakarta', 'Cakarta', 'Endonezya', 'ID', 'Asia/Jakarta', -6.2088, 106.8456],
  ['kualalumpur', 'Kuala Lumpur', 'Malezya', 'MY', 'Asia/Kuala_Lumpur', 3.1390, 101.6869],
  ['sidney', 'Sidney', 'Avustralya', 'AU', 'Australia/Sydney', -33.8688, 151.2093],
].map(([id, name, country, cc, tz, lat, lng]) => ({
  id: `world-${id as string}`,
  name: name as string,
  country: country as string,
  countryCode: cc as string,
  timezone: tz as string,
  latitude: lat as number,
  longitude: lng as number,
}));

export const ALL_PLACES: readonly Place[] = [...TURKEY_PROVINCES, ...WORLD_CITIES];

export function findPlace(id: string): Place | undefined {
  return ALL_PLACES.find((p) => p.id === id);
}
