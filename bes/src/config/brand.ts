/**
 * Marka yapılandırması — şartname §7.
 * Uygulama adı, iletişim ve kimlik bilgileri YALNIZ `brand.json` içinde
 * değişir. Başka bir dosyada marka adı düz metin olarak geçmemelidir.
 *
 * Neden JSON: bu değerleri hem uygulama kodu (TypeScript), hem Expo
 * yapılandırması (`app.config.ts`, Node tarafında değerlendirilir), hem de
 * derleme betikleri okur. JSON üçünün de sorunsuz çözdüğü tek biçim —
 * `.ts` dosyası Expo'nun yapılandırma değerlendiricisi tarafından
 * çözülemiyor (bu bir kez `expo export` sırasında patladı).
 */
import brand from './brand.json';

export const Brand = brand;
export type BrandConfig = typeof Brand;
