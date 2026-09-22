# Android derleme — adım adım

Gereken: Node 18+, Android Studio (son sürüm), JDK 21.

## 1. Projeyi hazırla
```bash
npm install
npx cap add android
npx cap sync android
```

## 2. Tek komutla native ayarlar (onerilen)
```bash
bash tools/android-prepare.sh
```
Bu script asagidaki 2-6 arasi TUM adimlari (simgeler, Manifest, strings.xml,
SDK seviyeleri, surum numaralari, imzalama blogu) otomatik uygular ve
`app.config.json` icindeki degerleri kullanir. `android/` klasorunu her
silip yeniden olusturdugunda tekrar calistir. Adimlari elle yapmak
istersen veya ne yaptigini gormek istersen asagisi durusunu koruyor.

> Bulutta derleme: depoda `.github/workflows/android.yml` var. Her pushta
> GitHub Actions ayni scripti calistirip AAB ve debug APK uretir - kendi
> bilgisayarina Android Studio kurman gerekmez. Imzali AAB icin 4 secret
> ekle: `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`,
> `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

## 2b. Simgeleri kopyala (script bunu zaten yapiyor)
```bash
cp -r assets/android/res/* android/app/src/main/res/
cp assets/splash-2732.png android/app/src/main/res/drawable/splash.png
```

## 3. `android/app/src/main/AndroidManifest.xml`

> **Lull reklamsız ve satın almasızdır.** Bu yüzden `AD_ID` ve `BILLING` izinleri
> ile AdMob `APPLICATION_ID` meta-data'sı **eklenmez**. `tools/android-prepare.sh`
> bunu `app.config.json` içindeki `admob.enabled` / `iap.enabled` bayraklarından
> okuyup otomatik uyguluyor; elle ekleme.
>
> Neden önemli: Play, `AD_ID` iznini gören uygulamanın Veri Güvenliği formunda
> "hiçbir veri toplanmıyor" demesini **çelişki** sayıp yayını durduruyor.

`MainActivity` etiketine dikey moda kilitleme ekle:
```xml
android:screenOrientation="portrait"
```

## 4. `android/app/src/main/res/values/strings.xml`
```xml
<string name="app_name">Lull</string>
<string name="title_activity_main">Lull</string>
<string name="package_name">com.kusgrupgames.lull</string>
<string name="custom_url_scheme">com.kusgrupgames.lull</string>
```
> Cihazın ana ekranında görünen ad `app_name`. Play mağaza adı ("Lull: Breathe Yourself Down")
> ile aynı olmak zorunda değil; ana ekranda kısa ad daha iyi durur.

## 5. `android/variables.gradle`
Play'in o an zorunlu kıldığı API seviyesini kullan (2026 için **36**; Play Console
yükleme sırasında daha düşükse uyarır):
```gradle
minSdkVersion = 23
compileSdkVersion = 36
targetSdkVersion = 36
```

## 6. İmzalama anahtarı (BU DOSYAYI KAYBETME)
```bash
keytool -genkey -v -keystore lull-release.jks -keyalg RSA -keysize 2048 \
        -validity 10000 -alias lull
```
> `lull-release.jks` dosyasını ve parolasını yedekle. Kaybedersen bu uygulamayı
> bir daha **asla** güncelleyemezsin (Play App Signing kaydı olsa bile yükleme anahtarı gerekir).
> Depoya **commit etme** — `.gitignore` zaten engelliyor.

`android/keystore.properties` (bu dosya da commit edilmez):
```properties
storeFile=../../lull-release.jks
storePassword=PAROLAN
keyAlias=lull
keyPassword=PAROLAN
```

`android/app/build.gradle` içinde `android { }` bloğunun başına:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```
ve `buildTypes { release { ... } }` içine:
```gradle
signingConfig signingConfigs.release
minifyEnabled false
```

Sürüm numaraları — aynı blokta `defaultConfig` içinde:
```gradle
versionCode 1
versionName "1.0.0"
```
> Her Play yüklemesinde `versionCode` **bir artmalı**. Aynı numarayla ikinci kez yükleyemezsin.

## 7. AAB üret
```bash
npx cap sync android
cd android && ./gradlew bundleRelease
# çıktı: android/app/build/outputs/bundle/release/app-release.aab
```

## 8. Gerçek cihazda test
```bash
cd android && ./gradlew installDebug
```
Test reklamları görünmeli ("Test Ad" etiketiyle). Görünmüyorsa `CFG.ads.useTest` değerini
ve Manifest'teki `APPLICATION_ID` satırını kontrol et.

## Sık karşılaşılan hatalar
| Belirti | Sebep / çözüm |
|---|---|
| Play "AD_ID izni ile veri beyanı çelişiyor" uyarısı | Manifest'e elle `AD_ID` izni eklenmiş. Kaldır: Lull reklamsız |
| Uygulama yatay dönüyor | `MainActivity` içine `android:screenOrientation="portrait"` eklenmemiş |
| Parmak basılı tutulunca ip kopuyor | Bazı cihazlarda uzun basış sistem olayina donusuyor; `touch-action:none` ve `user-scalable=no` ayarlarini silme |
