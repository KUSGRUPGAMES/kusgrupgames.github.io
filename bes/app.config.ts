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
 * zemini o değil: masterın piksellerinde zemin `#01140B`–`#023023` arasında
 * bir gradyan, ortancası `#002419`. Düz `#003F32` ikonun yanında açık ve
 * yavan kalıyordu. İkon zemini, açılış ekranı, Android maskesi ve uygulama
 * teması aynı değeri kullanır (`palette.emerald900`); ayrışırlarsa açılıştan
 * ana ekrana geçerken renk sıçraması görünür.
 */
const ZEMIN = '#002419';


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

const bundleIos = Brand.bundleId.ios + suffix[variant];

/**
 * AdMob uygulama kimlikleri (D33). Gerçek kimlikler derleme ortamından gelir.
 * Yoksa geliştirmede Google'ın herkese açık test kimlikleri kullanılır;
 * mağazaya yükleme iş akışı (`BES_STORE_RELEASE`) test kimliğiyle
 * **derlenmez** — test kimliğiyle yayına çıkan uygulama hiç gelir getirmez ve
 * bunu kimse fark etmez. CI'daki doğrulama derlemeleri bayraksız çalışır.
 */
const ADMOB_TEST = { ios: 'ca-app-pub-3940256099942544~1458002511', android: 'ca-app-pub-3940256099942544~3347511713' };
const ADMOB = {
  ios: process.env.ADMOB_IOS_APP_ID ?? ADMOB_TEST.ios,
  android: process.env.ADMOB_ANDROID_APP_ID ?? ADMOB_TEST.android,
};
// `BES_STORE_RELEASE`: 'ios' | 'android' | '1' (ikisi). Yalnız yayınlanan
// platformun gerçek kimliği istenir: iOS önce yayınlanıyor, Android sonra.
const MAGAZA = process.env.BES_STORE_RELEASE;
if ((MAGAZA === 'ios' || MAGAZA === '1') && ADMOB.ios === ADMOB_TEST.ios) {
  throw new Error('iOS mağaza derlemesi için ADMOB_IOS_APP_ID gerekli (D33).');
}
if ((MAGAZA === 'android' || MAGAZA === '1') && ADMOB.android === ADMOB_TEST.android) {
  throw new Error('Android mağaza derlemesi için ADMOB_ANDROID_APP_ID gerekli (D33).');
}
/**
 * Uygulama ile widget eklentisinin paylaştığı alan (D30). Varyant başına
 * ayrı: geliştirme ve mağaza sürümü aynı telefonda birbirinin verisini okumaz.
 */
const APP_GROUP = `group.${bundleIos}`;

const config: ExpoConfig = {
  name: Brand.appName + nameSuffix[variant],
  slug: 'bes',
  version: Brand.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'bes',
  // D34: yalnız koyu tema. Sistem arayüzü (klavye, uyarı pencereleri,
  // durum çubuğu) de koyu çizilsin.
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: bundleIos,
    // Widget eklentisi de aynı ekiple imzalanır (withDevelopmentTeam ile aynı).
    appleTeamId: 'C4NUF2G789',
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
      // Ezan bildirimi "Rahatsız Etmeyin"/odak modlarını kırabilsin diye
      // (D29 devamı — bildirim geliyor ama ses çalmıyor şikâyeti odak modu
      // ezan bildirimini pasif seviyede tuttuğu için oluyordu). Apple'dan
      // özel onay istemez (Critical Alerts'ten farklı); yalnız bu yetkiyi
      // ve içerikte `interruptionLevel: 'timeSensitive'`i gerektirir.
      'com.apple.developer.usernotifications.time-sensitive': true,
    },
    supportsTablet: true,
    // Topluluk girişi (D32). App Review 4.8: Google girişi sunan iOS
    // uygulaması Apple girişini de sunmak zorunda. Bu anahtar
    // `com.apple.developer.applesignin` yetkisini ekler.
    usesAppleSignIn: true,
    // Yalnız standart HTTPS: ihracat kontrolünden muaf. Yazılmazsa App Store
    // Connect her derlemede şifreleme sorusunu elle sorar ve derleme bekler.
    config: { usesNonExemptEncryption: false },
    // App Store ikonu saydamlık kabul etmez; icon.png zeminli üretilir.
    icon: './assets/icon.png',
    buildNumber: BUILD,
    infoPlist: {
      // Kıraat arka planda sürsün ve kilit ekranından yönetilebilsin (§32).
      UIBackgroundModes: ['audio', 'fetch'],
      // Canlı etkinliği uygulama uyurken sıradaki vakte geçiren arka plan
      // yenilemesi (modules/bes-live-activity → BesVakitYenileme.kimlik).
      BGTaskSchedulerPermittedIdentifiers: ['bes.vakit-yenile'],
      // Dinamik Ada ve kilit ekranında vakte geri sayım (D30).
      NSSupportsLiveActivities: true,
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
      // AD_ID artık engellenmiyor (D33): AdMob reklam kimliğini kullanır ve
      // Play Console'daki reklam kimliği beyanı "evet" olarak doldurulur.
    ],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-splash-screen', {
      // D34: yalnız koyu tema — açılış da her zaman koyu.
      image: './assets/splash-icon.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: ZEMIN,
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
    // Widget'a veri taşıyan ExtensionStorage native modülü (@bacons/
    // apple-targets), podspec'i 16.4 istediği için Expo'nun otomatik
    // bağlama kontrolünde (proje hedefi 15.1) sessizce atlanıyordu —
    // widget hep yalnız logo gösteriyordu. Bu eklenti pod'u elle ekleyip
    // o kontrolü atlatıyor.
    './plugins/withExtensionStoragePod',
    // Yeni Xcode/iOS SDK'lar "scene-based life cycle" benimsemeyen
    // uygulamaları artık başlatmayı reddediyor (Expo'nun varsayılan
    // AppDelegate.swift şablonu hâlâ eski, sahnesiz UIWindow kurulumunu
    // kullanıyor). Bu eklenti pencere kurulumunu bir SceneDelegate'e taşır.
    './plugins/withSceneBasedLifecycle',
    // expo prebuild --clean ios/ klasörünü sıfırdan üretiyor; Xcode'da elle
    // seçilen Development Team ayarı da bu sıfırlamada kayboluyor. Bu
    // eklenti Team ID'yi build ayarlarına kalıcı olarak yazıyor.
    './plugins/withDevelopmentTeam',
    // Widget'lar ve canlı etkinlik: targets/widget (D30).
    '@bacons/apple-targets',
    'expo-localization',
    // Google girişi sistemin güvenli tarayıcı oturumunda açılır (D32).
    'expo-web-browser',
    'expo-apple-authentication',
    'expo-system-ui',
    // Android bildirim küçük ikonu **tek renk siluet** olmalı: sistem onu
    // alfa kanalından okur ve kendi rengiyle boyar. Renkli ikon verilirse
    // durum çubuğunda beyaz bir kare görünür (paket kuralı 5).
    ['expo-notifications', {
      icon: './assets/brand/notification-icon.png',
      color: VURGU,
      // Vakit girişinde ezan (D29). Bildirim sesi pakette olmak zorunda:
      // uygulama kapalıyken çalınır.
      sounds: ['./assets/sounds/ezan.caf'],
    }],
    // expo-notifications yukarıdaki `sounds` dosyasını Xcode projesine
    // "Copy Bundle Resources" listesine ekliyor (ve diskte doğru yere
    // kopyalıyor) ama gerçek cihazda derlenen pakette dosya yine de
    // görünmüyor — aynı listedeki font dosyaları kopyalanırken bu sessizce
    // atlanıyor (Xcode 27 uyumsuzluğu, kesin sebep doğrulanamadı). Bu
    // eklenti dosyayı açık bir Run Script adımıyla elle kopyalayıp garantiye
    // alıyor.
    './plugins/withEzanSoundCopyFix',
    // Ezan bildirimi kilitli ekranda sessiz kalıyordu: `interruptionLevel:
    // 'timeSensitive'` içerikte yazılı olsa da expo-notifications'ın iOS
    // izin isteği bu yetkiyi JS'ten hiç almıyordu (bkz. eklentinin kendi
    // yorumu) — uygulama gerçekte hiç `.timeSensitive` yetkisine sahip
    // değildi, iOS sessizce `active` seviyeye düşürüyordu.
    './plugins/withTimeSensitiveNotificationFix',
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
    // Reklam (D33). İçerik derecesi ve engellenen kategoriler `features/pro`
    // içinde; ATT metni kullanıcıya neden sorulduğunu dürüstçe söyler.
    ['react-native-google-mobile-ads', {
      iosAppId: ADMOB.ios,
      androidAppId: ADMOB.android,
      delayAppMeasurementInit: true,
      skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
    }],
    ['expo-tracking-transparency', {
      userTrackingPermission:
        'Bu izin yalnız reklamların sana daha uygun olması için kullanılır. İzin vermezsen de reklamlar gösterilir, uygulamanın hiçbir özelliği kısıtlanmaz.',
    }],
    ['expo-font', { fonts: ['./assets/fonts/Amiri-Regular.ttf', './assets/fonts/AmiriQuran-Regular.ttf'] }],
  ],
  experiments: { typedRoutes: true },
  // proSales: Pro satışı açık mı (1 Ekim kararı). 1.0'da kapalı — banka/ücretli
  // uygulama sözleşmesi bekleniyor, Pro özellikleri herkese ücretsiz. Sözleşme
  // etkin olunca 1.0.1 `BES_PRO_SALES=1` ile derlenir: satış ve 14 günlük deneme açılır.
  extra: { variant, appGroup: APP_GROUP, proSales: process.env.BES_PRO_SALES === '1' },
};

export default config;
