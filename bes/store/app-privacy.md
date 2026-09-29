# Gizlilik formu yanıtları — BEŞ v1.0.0 (D32, D33 sonrası)

İki mağaza da aynı soruyu farklı kelimelerle soruyor: **uygulama hangi veriyi
topluyor.** v1.0.0'ın ilk hâlinde cevap "hiçbirini" idi. Topluluk girişi
(D32), reklam ve Pro abonelik (D33) ile bu cevap değişti; bu dosya konsoldaki
her kutuya ne işaretleneceğini yazar. Tahminle doldurulmaz: her satırın kodda
ya da kullanılan SDK'nın yayımlanmış beyanında karşılığı vardır.

> **AdMob satırları** Google'ın "Apple App Privacy / Play Data safety için
> Google Mobile Ads SDK beyanı" belgelerine göre doldurulur. Google bu
> belgeleri SDK sürümüyle güncelliyor; konsolu doldurmadan önce güncel hâline
> bir kez bakılmalı:
> - <https://developers.google.com/admob/ios/privacy/data-disclosure>
> - <https://developers.google.com/admob/android/privacy/play-data-disclosure>

**Kimlik bilgileri** (iki konsolda da aynı yazılır):

| Alan | Değer |
|---|---|
| Uygulama adı | **BEŞ** |
| Mağaza adı | **BEŞ – Ezan & Namaz Vakitleri** |
| Yayıncı / geliştirici | **KUS GRUP GAMES** |
| Paket kimliği (iOS ve Android) | `com.kusgrupgames.bes` |
| Destek e-postası | `kusgrupgames@gmail.com` |
| Web sitesi | `https://kusgrupgames.github.io/bes` |

---

## Verinin nereye gittiği — özet

| Kaynak | Kim işliyor | Ne | Ne zaman |
|---|---|---|---|
| İbadet kayıtları, konum, ayarlar | **Hiç kimse** — telefonda kalır | — | Her zaman |
| Reklam | Google AdMob | Cihaz bilgisi, IP → kaba konum, reklam etkileşimi, izin varsa reklam kimliği, SDK teşhis verisi | Yalnız ücretsiz sürümde, onboarding'den sonra |
| Pro | Apple/Google (ödeme), RevenueCat (doğrulama) | Rastgele uygulama kullanıcı kimliği, satın alma geçmişi | Pro ekranı açılınca / satın alınca |
| Topluluk | Supabase (AB, İrlanda) | Hesap kimliği, e-posta, takma ad, dua istekleri, mesajlar, hatim katılımı, şikâyet/engelleme | Yalnız kullanıcı girişi yapıp katılırsa |

Analitik, izleme pikseli ve uzak çökme raporlama **yok** (sınamaya bağlı:
`__tests__/security.test.ts`).

---

## App Store Connect → App Privacy

**Data Collection: "Yes, we collect data from this app."**

| Veri türü (Apple kategorisi) | Toplayan | Amaç | Kimliğe bağlı mı | İzleme için mi |
|---|---|---|---|---|
| Location → **Coarse Location** | AdMob (IP'den) | Third-Party Advertising, Analytics | Hayır | **Evet** |
| Identifiers → **Device ID** (IDFA) | AdMob — yalnız ATT izni varsa | Third-Party Advertising, Analytics | Hayır | **Evet** |
| Usage Data → **Advertising Data** | AdMob | Third-Party Advertising, Analytics | Hayır | **Evet** |
| Usage Data → **Product Interaction** | AdMob | Third-Party Advertising, Analytics | Hayır | **Evet** |
| Diagnostics → **Crash Data, Performance Data, Other Diagnostic Data** | AdMob SDK | Analytics | Hayır | Hayır |
| Purchases → **Purchase History** | RevenueCat | App Functionality | Hayır | Hayır |
| Identifiers → **User ID** | RevenueCat (rastgele), Supabase (topluluk hesabı) | App Functionality | Topluluk için **Evet** | Hayır |
| Contact Info → **Email Address** | Supabase (Google/Apple girişi) | App Functionality | **Evet** | Hayır |
| User Content → **Other User Content** (dua istekleri, sohbet mesajları) | Supabase | App Functionality | **Evet** | Hayır |

**Privacy Policy URL:** `https://kusgrupgames.github.io/bes/privacy.html`

**Tracking:** Uygulama App Tracking Transparency izni **ister** (yalnız
reklam için, onboarding bittikten sonra). Metin `app.config.ts` →
`expo-tracking-transparency` içinde; izin verilmezse hiçbir özellik
kısıtlanmaz, reklam kişiselleştirilmeden gösterilir.

### Sorulabilecek ek sorular

| Soru | Yanıt |
|---|---|
| Does the app use the Advertising Identifier (IDFA)? | **Yes** — yalnız reklam için, ATT izniyle |
| Does the app include third-party analytics? | **No** (AdMob'un kendi ölçümü dışında) |
| Account creation available? | **Yes** — isteğe bağlı, yalnız Topluluk için (Google / Apple). **Uygulama içinden hesap silme var:** Ayarlar → Hesap → Hesabı sil |
| Sign in with Apple? | **Yes** — Google girişi sunulan her yerde Apple da var (4.8) |
| Does the app contain user-generated content? | **Yes** — Topluluk: şikâyet, engelleme, yasaklı kelime süzgeci, yönetici paneli (1.2) |
| In-app purchases? | **Yes** — Pro: aylık, yıllık (otomatik yenilenen) ve ömür boyu (tüketilmeyen) |

---

## Play Console → Veri güvenliği (Data safety)

**Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu? → Evet**

| Veri türü | Toplanıyor | Paylaşılıyor | Amaç | İsteğe bağlı mı |
|---|---|---|---|---|
| Konum → **Yaklaşık konum** | Evet (AdMob, IP) | Evet (Google) | Reklam | Hayır (ücretsiz sürümde) |
| Cihaz veya diğer kimlikler → **Reklam kimliği** | Evet (AdMob) | Evet (Google) | Reklam, analiz | Hayır (ücretsiz sürümde) |
| Uygulama etkinliği → **Uygulama etkileşimleri** | Evet (AdMob) | Evet (Google) | Reklam, analiz | Hayır |
| Uygulama bilgileri ve performans → **Kilitlenme günlükleri, Teşhis** | Evet (AdMob SDK) | Evet (Google) | Analiz | Hayır |
| Finansal bilgiler → **Satın alma geçmişi** | Evet (RevenueCat) | Hayır | Uygulama işlevleri | Evet |
| Kişisel bilgiler → **E-posta adresi** | Evet (Supabase) | Hayır | Uygulama işlevleri, hesap yönetimi | **Evet** — yalnız Topluluk |
| Kişisel bilgiler → **Kullanıcı kimlikleri** | Evet (Supabase, RevenueCat) | Hayır | Uygulama işlevleri, hesap yönetimi | Evet |
| Mesajlar → **Diğer uygulama içi mesajlar** | Evet (Supabase) | Hayır | Uygulama işlevleri | **Evet** — yalnız Topluluk |
| Uygulama etkinliği → **Kullanıcının oluşturduğu diğer içerikler** | Evet (Supabase) | Hayır | Uygulama işlevleri | **Evet** — yalnız Topluluk |

| Soru | Yanıt |
|---|---|
| Tüm kullanıcı verileri aktarım sırasında şifrelenir mi? | **Evet** — bütün istekler HTTPS |
| Kullanıcılar verilerinin silinmesini isteyebilir mi? | **Evet** — uygulama içinde Hesap → Hesabı sil; ayrıca `kusgrupgames@gmail.com` |
| Hesap silme bağlantısı (web) | `https://kusgrupgames.github.io/bes/gizlilik.html` (§11) |

**Gizlilik politikası:** `https://kusgrupgames.github.io/bes/gizlilik.html`

### Reklam kimliği

`AD_ID` izni **beyan edilir** (D33) ve Play Console → Uygulama içeriği →
Reklam kimliği sorusu **"Evet, reklam için"** olarak cevaplanır. Android CI
(`bes-android.yml`) birleştirilmiş manifest'te iznin bulunduğunu denetler.

### Reklamlar

Play Console → Uygulama içeriği → **Reklamlar: "Evet, uygulamam reklam
içeriyor."**

---

## AdMob konsolunda yapılacaklar (bir kez)

- Uygulama → Engelleme kontrolleri → **Hassas kategoriler**: alkol, kumar,
  flört, siyaset, din, cinsellik, silah, tütün, uyuşturucu, estetik cerrahi,
  astroloji engellenir (`features/pro/ads.ts` → `BLOCKED_AD_CATEGORIES`).
- **Maksimum reklam içerik derecesi: G** (kod da `MaxAdContentRating.G` istiyor).
- Gizlilik ve mesajlaşma → **GDPR onay mesajı** oluşturulur ve yayınlanır
  (uygulama Google'ın UMP formunu gösterir; mesaj yoksa form çıkmaz).
- iOS için **IDFA açıklama mesajı** isteğe bağlıdır; ATT metni zaten uygulamada.

---

## Uygulama içindeki izinler ve gerekçeleri

| İzin | Platform | Neden |
|---|---|---|
| Konum (yalnız uygulama açıkken) | iOS + Android | Namaz vakti ve kıble. İsteğe bağlı; şehir elle de seçilebilir. Arka plan konumu **istenmez**. |
| Bildirim | iOS + Android | Ezan/vakit hatırlatıcıları. İsteğe bağlı. |
| İzleme (ATT) | iOS | Yalnız kişiselleştirilmiş reklam. Reddedilirse hiçbir özellik kısıtlanmaz. |
| Reklam kimliği (AD_ID) | Android | AdMob. |
| İnternet | Android | Kıraat, içerik güncellemesi, reklam, Pro, Topluluk. |

**Bilerek istenmeyenler:** mikrofon, kamera, rehber, takvim, depolama,
arka plan konumu, hassas bildirim zamanlayıcısı.

---

## Bu dosya ne zaman güncellenir

Aşağıdakilerden **biri** olursa, mağaza formu da bu dosya da güncellenmeden
sürüm gönderilmez:

- Yeni bir SDK (reklam ağı, analitik, çökme raporlama) eklenmesi
- AdMob'a arabulucu (mediation) ağ eklenmesi — her ağ kendi verisini toplar
- Topluluğa yeni veri türü (fotoğraf, konum paylaşımı vb.) eklenmesi
- Hesabın uygulamanın başka bir bölümünde zorunlu hâle gelmesi
