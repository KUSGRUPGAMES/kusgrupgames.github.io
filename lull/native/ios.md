# iOS derleme — adım adım

Gereken: macOS, Xcode (son sürüm), CocoaPods, Apple Developer üyeliği.

## 1. Projeyi hazırla
```bash
npm install
npx cap add ios
npx cap sync ios     # pod install'u da çalıştırır
npx cap open ios
```

## 2. Xcode → App hedefi → General
- **Display Name:** `Lull`
- **Bundle Identifier:** `com.kusgrupgames.lull`
- **Version:** `1.0.0` · **Build:** `1`
- **Supported Destinations:** yalnız **iPhone** (iPad'i kaldır — yoksa App Store iPad ekran görüntüsü ister)
- **Device Orientation:** yalnız **Portrait**
- **Minimum Deployments:** iOS 14.0

## 3. Signing & Capabilities
- Team'i seç, "Automatically manage signing" açık
- ~~`+ Capability` → In-App Purchase~~ — **gerekmiyor**, Lull v1 ücretsiz ve satın almasız

## 4. Simge ve açılış ekranı
- `assets/icon-1024.png` → Xcode `Assets.xcassets` → `AppIcon` (tek kutu, 1024×1024)
- `assets/splash-2732.png` → `Assets.xcassets` → `Splash` (üç boyuta da aynı dosya verilebilir)

## 5. `ios/App/App/Info.plist` — eklenecek anahtarlar
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>

<key>UIRequiresFullScreen</key>
<true/>

<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
</array>
```
> **Lull reklamsızdır:** `GADApplicationIdentifier`, `NSUserTrackingUsageDescription`
> ve `SKAdNetworkItems` **eklenmez**. `tools/ios-prepare.sh` bunu `app.config.json`
> içindeki `admob.enabled: false` bayrağından okuyup otomatik atlıyor. Elle ekleme:
> ATT istemi çıkan bir uygulamanın App Privacy formunda "veri toplanmıyor" demesi
> çelişki sayılır.

> `ITSAppUsesNonExemptEncryption = false` sayesinde her yüklemede ihracat uyumluluğu sorusu sorulmaz.
> Bu doğru bir beyandır: uygulama yalnızca işletim sisteminin standart HTTPS'ini kullanır.

## 6. Arşivle ve gönder

**Normal yol — Mac gerekmez.** GitHub → **Actions** → **iOS yayin** → *Run workflow*
→ uygulamayı seç → *Run*. Hat imzalar, IPA üretir ve App Store Connect'e yükler.
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
| ATT istemi çıkıyor | Reklam kodu sızmış demektir. Lull'da bu istem **hiç çıkmamalı**; Info.plist'ten `NSUserTrackingUsageDescription` anahtarını kaldır |
| Reddedilme: "Guideline 1.4.1 — sağlık iddiası" | Mağaza metninde tedavi/teşhis çağrıştıran cümle var. `store/app-store.md` içindeki onaylı metni kullan |
| Reddedilme: "Guideline 2.1 — Information Needed / IDFA" | App Store Connect'te IDFA kullanımı beyan edilmemiş. `store/app-store.md` formuna bak |
| Basılı tutma algılanmıyor | WKWebView'de `pointerup` bazı durumlarda gelmez; uygulama `pointercancel` olayını da dinliyor, bu satırı silme |
