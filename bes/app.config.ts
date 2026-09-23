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

/**
 * Koyu açılış zemini — **logodan ölçülen** değer (D18).
 *
 * Paketin `brand.tokens.json`'u burada `#003F32` öneriyor ama logonun kendi
 * zemini o değil: masterın piksellerinde zemin `#000D08`–`#042B21` arasında
 * bir gradyan, ortancası `#011D13`. Düz `#003F32` ikonun yanında açık ve
 * yavan kalıyordu. İkon zemini, açılış ekranı, Android maskesi ve uygulama
 * teması aynı değeri kullanır (`palette.emerald900`); ayrışırlarsa açılıştan
 * ana ekrana geçerken renk sıçraması görünür.
 */
const ZEMIN = '#011D13';

/** Açık açılış zemini — açık masterın zemin ortancası (`palette.ivory100`). */
const ZEMIN_ACIK = '#F6F1E4';

/**
 * Android bildirim rozetinin tint rengi. Rozet beyaz bildirim zemininde
 * durur; açılış zemini kadar koyu bir yeşil orada okunmuyor, marka yüzeyi
 * rengi (`palette.emerald600`) kullanılır.
 */
const VURGU = '#0A4636';

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
  slug: 'bes',
  version: Brand.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'bes',
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
      // Android 13+ temalı ikonlar: launcher kullanıcının duvar kâğıdından
      // renk alır, bu yüzden tek renk (beyaz siluet) bir katman ister.
      monochromeImage: './assets/adaptive-icon-mono.png',
      backgroundColor: ZEMIN,
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    // Kütüphaneler kendi manifest'lerinde izin bildirir ve birleştirici
    // bunları uygulamaya taşır. Uygulama **mikrofon kullanmıyor** — kıraat
    // yalnız çalınır, hiçbir yerde kayıt yok; Play mikrofon iznini gerekçe
    // ister ve gerekçesizse yayını reddeder. Diğer üçü de kullanılmıyor.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      // Reklam kimliği: uygulamada reklam yok ve okunmuyor. Play, bu izni
      // bildirip kullanmayan uygulamayı da, kullanıp bildirmeyeni de
      // reddediyor. Google Play Services'i çeken herhangi bir bağımlılık
      // manifest'e sessizce ekleyebildiği için burada kapatılıyor.
      'com.google.android.gms.permission.AD_ID',
    ],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-splash-screen', {
      image: './assets/brand/splash-icon-light.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: ZEMIN_ACIK,
      // Koyu tema paketin koyu ikonuyla, açık tema açık ikonuyla aynı zemini
      // ve aynı sembol varyantını kullanır.
      dark: { image: './assets/splash-icon.png', backgroundColor: ZEMIN },
    }],
    // Bazı üçüncü taraf paketler (RNCAsyncStorage, RNSVG) kendi Pod
    // tanımlarında çok eski bir iOS hedefi bildiriyor (13.4, 12.4);
    // React Native'in kendi Podfile yardımcısı bunu normalde en düşük
    // desteklenen sürüme (15.1) çekiyor, ama daha yeni bir Xcode bu eski
    // hedefi doğrudan reddedip derlemeyi durdurabiliyor. Bu eklenti tüm
    // Pod'ları ana hedefle aynı, zaten çalışan sürüme sabitliyor.
    ['expo-build-properties', {
      ios: { deploymentTarget: '15.1' },
    }],
    // expo-build-properties yukarıdaki ile aynı temel mekanizmayı
    // (react_native_post_install) kullanıyor, o da yalnız ana Pod
    // hedeflerini düzeltiyor — CocoaPods'un resource bundle için ayrı
    // oluşturduğu hedeflere (RNSVG-RNSVGFilters, RNCAsyncStorage_resources
    // gibi) dokunmuyor. Bu ek eklenti tüm hedefleri zorla düzeltiyor.
    './plugins/withPodDeploymentTargetFix',
    // Yeni Xcode/iOS SDK'lar "scene-based life cycle" benimsemeyen
    // uygulamaları artık başlatmayı reddediyor (Expo'nun varsayılan
    // AppDelegate.swift şablonu hâlâ eski, sahnesiz UIWindow kurulumunu
    // kullanıyor). Bu eklenti pencere kurulumunu bir SceneDelegate'e taşır.
    './plugins/withSceneBasedLifecycle',
    'expo-localization',
    'expo-system-ui',
    // Android bildirim küçük ikonu **tek renk siluet** olmalı: sistem onu
    // alfa kanalından okur ve kendi rengiyle boyar. Renkli ikon verilirse
    // durum çubuğunda beyaz bir kare görünür (paket kuralı 5).
    ['expo-notifications', {
      icon: './assets/brand/notification-icon.png',
      color: VURGU,
    }],
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
    // `recordAudioAndroid: false` eklentinin izni hiç eklememesini sağlar;
    // kütüphanenin kendi manifest'indeki bildirim ise `blockedPermissions`
    // ile silinir. İkisi birden gerekiyor.
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false }],
    ['expo-font', { fonts: ['./assets/fonts/Amiri-Regular.ttf', './assets/fonts/AmiriQuran-Regular.ttf'] }],
  ],
  experiments: { typedRoutes: true },
  extra: { variant },
};

export default config;
