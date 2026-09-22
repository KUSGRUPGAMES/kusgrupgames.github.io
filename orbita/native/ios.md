# iOS derleme — adım adım

Gereken: macOS, Xcode (son sürüm), CocoaPods, Apple Developer üyeliği.

## 1. Projeyi hazırla
```bash
npm install
npx cap add ios
npx cap sync ios     # pod install'u da çalıştırır
npx cap open ios
```

## 1b. Tek komutla Info.plist ayarlari (onerilen)
```bash
bash tools/ios-prepare.sh
```
Asagidaki 5. adimdaki tum anahtarlari (AdMob kimligi, ATT metni, ihracat
beyani, dikey yon, SKAdNetwork listesi) ve sadece-iPhone/surum ayarlarini
otomatik yazar. macOS gerektirir. Depo kokundeki iOS is akisi da bunu kullanir.

## 2. Xcode → App hedefi → General
- **Display Name:** `Orbita`
- **Bundle Identifier:** `com.kusgrupgames.orbita`
- **Version:** `1.0.0` · **Build:** `1`
- **Supported Destinations:** yalnız **iPhone** (iPad'i kaldır — yoksa App Store iPad ekran görüntüsü ister)
- **Device Orientation:** yalnız **Portrait**
- **Minimum Deployments:** iOS 14.0

## 3. Signing & Capabilities
- Team'i seç, "Automatically manage signing" açık
- `+ Capability` → **In-App Purchase** ekle

## 4. Simge ve açılış ekranı
- `assets/icon-1024.png` → Xcode `Assets.xcassets` → `AppIcon` (tek kutu, 1024×1024)
- `assets/splash-2732.png` → `Assets.xcassets` → `Splash` (üç boyuta da aynı dosya verilebilir)

## 5. `ios/App/App/Info.plist` — eklenecek anahtarlar
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>

<key>NSUserTrackingUsageDescription</key>
<string>Your choice here only affects how relevant the ads in Orbita are. The game itself works exactly the same either way.</string>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>

<key>UIRequiresFullScreen</key>
<true/>

<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
</array>

<key>SKAdNetworkItems</key>
<array>
  <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
  <!-- Buraya Google'ın güncel tam listesini yapıştır:
       https://developers.google.com/admob/ios/quick-start#update_your_infoplist
       Liste eksik olursa reklam gelirin düşer, uygulama reddedilmez. -->
</array>
```
> `GADApplicationIdentifier` şu an **test** kimliğidir. Gerçek AdMob hesabın açılınca
> hem burayı hem `www/index.html` içindeki `CFG.ads.real.ios` alanını doldur ve `useTest: false` yap.

> `ITSAppUsesNonExemptEncryption = false` sayesinde her yüklemede ihracat uyumluluğu sorusu sorulmaz.
> Bu doğru bir beyandır: uygulama yalnızca işletim sisteminin standart HTTPS'ini kullanır.

## 6. Arşivle ve gönder

**Normal yol — Mac gerekmez.** GitHub → **Actions** → **iOS yayin** → *Run workflow*
→ oyunu seç → *Run*. Hat imzalar, IPA üretir ve App Store Connect'e yükler.
Build numarası her çalıştırmada kendiliğinden artar, bu yüzden "build already
exists" hatası yapısal olarak imkânsızdır.

Önce bir kez şu dört secret girilmeli (Settings → Secrets and variables → Actions):

| Secret | Nereden |
|---|---|
| `APPSTORE_ISSUER_ID` | App Store Connect → Integrations → Keys → **Issuer ID** |
| `APPSTORE_KEY_ID` | aynı sayfadaki **Key ID** |
| `APPSTORE_PRIVATE_KEY` | indirilen `AuthKey_XXX.p8` dosyasının **tam içeriği** |
| `APPSTORE_TEAM_ID` | Membership → **Team ID** (10 karakter) |

> `.p8` dosyası **bir kez** indirilir, tekrar indirilemez. Yedeğini güvenli bir
> yerde tut ve depoya asla koyma.

**Yedek yol — Xcode ile elle.** Hat bir sebeple çalışmazsa:
- Xcode → Product → **Destination: Any iOS Device (arm64)** → **Archive**
- Organizer → **Distribute App** → App Store Connect → Upload

App Store Connect'te build işlendikten sonra (5-30 dk) sürüme eklenir.

## 7. Gerçek cihazda test
- Reklamlar "Test Ad" etiketiyle görünmeli
- IAP testi için App Store Connect → Users and Access → **Sandbox Tester** hesabı oluştur,
  cihazda Ayarlar → App Store → Sandbox Account ile giriş yap

## Sık karşılaşılan hatalar
| Belirti | Sebep / çözüm |
|---|---|
| Build "GADApplicationIdentifier missing" diye çöküyor | Info.plist anahtarı eklenmemiş |
| ATT istemi hiç çıkmıyor | iOS Ayarlar → Gizlilik → İzleme → "Uygulamaların istemesine izin ver" kapalı olabilir; ayrıca istem uygulama başına yalnız bir kez gösterilir (silip yeniden kur) |
| Reddedilme: "Guideline 3.1.1 — IAP" | "Remove Ads" ürünü App Store Connect'te oluşturulmamış veya incelemeye gönderilmemiş. Ürünü ilk sürümle birlikte gönder |
| Reddedilme: "Guideline 2.1 — Information Needed / IDFA" | App Store Connect'te IDFA kullanımı beyan edilmemiş. `store/app-store.md` formuna bak |
