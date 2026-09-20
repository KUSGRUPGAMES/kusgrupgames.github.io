/**
 * Expo yapılandırması — şartname §7, §96.
 * Marka bilgisi tek noktadan (`src/config/brand.ts`) okunur; burada
 * kopyalanmaz. Ortam ayrımı `APP_VARIANT` ile yapılır.
 */
import type { ExpoConfig } from 'expo/config';
import Brand from './src/config/brand.json';

type Variant = 'development' | 'staging' | 'production';
const variant = (process.env.APP_VARIANT as Variant) ?? 'development';

const suffix: Record<Variant, string> = {
  development: '.dev',
  staging: '.staging',
  production: '',
};

/** Zümrüt zemin (palette.emerald900). İkon, açılış ekranı ve Android maskesi
 *  aynı rengi kullanır; üçü ayrışırsa açılışta renk sıçraması görünür. */
const ZEMIN = '#04211B';

/**
 * Mağaza, aynı (sürüm, build) çiftini ikinci kez kabul etmez. CI her
 * çalıştırmada artan `run_number`'ı buraya verir; yerelde 1 kalır.
 * Kullanıcıya görünen sürüm `Brand.version`'dan gelmeye devam eder.
 */
const BUILD = process.env.BUILD_NUMBER ?? '1';

const nameSuffix: Record<Variant, string> = {
  development: ' (dev)',
  staging: ' (staging)',
  production: '',
};

const config: ExpoConfig = {
  name: Brand.appName + nameSuffix[variant],
  slug: 'sukun',
  version: Brand.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'sukun',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: Brand.bundleId.ios + suffix[variant],
    supportsTablet: true,
    // App Store ikonu saydamlık kabul etmez; icon.png zeminli üretilir.
    icon: './assets/icon.png',
    buildNumber: BUILD,
    infoPlist: {
      // Kıraat arka planda sürsün ve kilit ekranından yönetilebilsin (§32).
      UIBackgroundModes: ['audio'],
      NSMotionUsageDescription:
        'Kıble pusulası, telefonun yönünü okumak için hareket algılayıcısını kullanır.',
    },
  },
  android: {
    package: Brand.bundleId.android + suffix[variant],
    versionCode: Number(BUILD),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: ZEMIN,
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-splash-screen', {
      image: './assets/splash-icon.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: ZEMIN,
      // Koyu temada da aynı zemin: açılıştan ana ekrana geçerken sıçrama olmaz.
      dark: { image: './assets/splash-icon.png', backgroundColor: ZEMIN },
    }],
    'expo-localization',
    // Konum izni yalnız **uygulama açıkken**. expo-location eklentisi kendi
    // İngilizce varsayılanlarıyla üç anahtar birden yazıyor; "Always" izni
    // hiç kullanılmadığı hâlde beyan edilmiş oluyordu. App Review kullanılmayan
    // arka plan konum iznini sorar ve reddeder — `false` anahtarı siler.
    ['expo-location', {
      locationWhenInUsePermission:
        'Namaz vakitleri ve kıble yönü bulunduğun konuma göre hesaplanır. İzin vermezsen şehri elle seçebilirsin.',
      locationAlwaysAndWhenInUsePermission: false,
      locationAlwaysPermission: false,
      isIosBackgroundLocationEnabled: false,
      isAndroidBackgroundLocationEnabled: false,
    }],
    ['expo-audio', { microphonePermission: false }],
    ['expo-font', { fonts: ['./assets/fonts/Amiri-Regular.ttf', './assets/fonts/AmiriQuran-Regular.ttf'] }],
  ],
  experiments: { typedRoutes: true },
  extra: { variant },
};

export default config;
