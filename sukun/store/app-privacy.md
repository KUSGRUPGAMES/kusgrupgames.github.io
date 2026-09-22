# Gizlilik formu yanıtları — BEŞ v1.0.0

İki mağaza da aynı soruyu farklı kelimelerle soruyor: **uygulama hangi veriyi
topluyor.** BEŞ v1.0.0'ın cevabı her iki konsolda da aynı ve tek kelimelik:
**hiçbirini.**

Bu dosya, konsoldaki her kutuya ne işaretleneceğini yazar. Tahminle
doldurulmaz: aşağıdaki her satır kodda karşılığı olduğu için böyledir.

---

## Neden "veri toplanmıyor" doğru bir cevap

| Veri toplamanın olağan sebebi | BEŞ'te durum |
|---|---|
| Hesap / oturum | **Yok.** Kayıt, giriş, e-posta, telefon yok. |
| Sunucu | **Yok.** Kişisel veri yazılacak bir arka uç yok (DECISIONS D12). |
| Reklam SDK'sı | **Yok.** Reklam gösterilmiyor; reklam kimliği okunmuyor. |
| Analitik / kilitlenme raporlama | **Yok.** Üçüncü taraf kütüphane bulunmuyor. Çökme kaydı yalnız telefonda tutulur (Profil → Tanılama) ve gönderilmez. |
| Satın alma | **Yok.** Uygulama içi satın alma ve abonelik yok. |

Kullanıcının ürettiği her şey — konum, ibadet defteri, kaza sayaçları, zikir
kayıtları, yer imleri, âyet notları, favoriler, oruç kaydı, hatim ilerlemesi,
ayarlar — telefonun kendi deposunda kalır.

**Uygulamanın internete çıktığı iki yer var; ikisi de kimlik taşımaz:**

1. **Kıraat sesi** — Islamic Network CDN'inden akar. İstek hangi âyetin
   istendiğini içerir, kim istediğini değil. Hesap yok, çerez yok, kimlik yok.
2. **İçerik güncellemesi** — GitHub Pages üzerindeki statik bir JSON dosyası
   okunur. Herkes aynı dosyayı indirir.

Her iki istekte de, her HTTP isteğinde olduğu gibi, karşı tarafın sunucu
günlüğünde IP adresi görünür. Bu bizim topladığımız bir veri değildir; o
sunucular bizim değil ve biz o günlüklere erişmiyoruz. Aşağıdaki mağaza
formları bu durumu "veri toplama" saymaz, ama gizlilik politikasında yine de
açıkça yazılıdır.

---

## App Store Connect → App Privacy

**Data Collection: "No, we do not collect data from this app."**

Bu seçildiğinde başka soru sorulmaz. Kategorilerin hiçbiri (Contact Info,
Health & Fitness, Financial Info, Location, Sensitive Info, Contacts,
User Content, Browsing History, Search History, Identifiers, Purchases,
Usage Data, Diagnostics, Other Data) işaretlenmez.

**Privacy Policy URL:** `https://kusgrupgames.github.io/sukun/privacy.html`

**Tracking:** Uygulama App Tracking Transparency izni **istemez**, çünkü
izleme yapılmıyor. `NSUserTrackingUsageDescription` anahtarı Info.plist'te
yoktur ve olmamalıdır.

### Sorulabilecek ek sorular

| Soru | Yanıt |
|---|---|
| Does the app use the Advertising Identifier (IDFA)? | **No** |
| Does the app include third-party analytics? | **No** |
| Account creation available? | **No** — "Sign in" akışı yok, hesap silme sorusu doğmuyor |
| Does the app contain user-generated content? | **No** — topluluk özelliği v1'de yok |

---

## Play Console → Veri güvenliği (Data safety)

| Soru | Yanıt |
|---|---|
| Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu? | **Hayır** |
| Tüm kullanıcı verileri aktarım sırasında şifrelenir mi? | Soru yalnız veri toplanıyorsa sorulur. Yine de: uygulamanın yaptığı tüm ağ istekleri HTTPS'tir. |
| Kullanıcılar verilerinin silinmesini isteyebilir mi? | Uygulamayı silmek sakladığı her şeyi siler; ayrıca uygulama içinde bütün kayıtları tek dosyaya aktarma (taşınabilirlik) vardır. |

**Gizlilik politikası:** `https://kusgrupgames.github.io/sukun/gizlilik.html`

### Reklam kimliği

`AD_ID` izni **beyan edilmez ve manifest'te bulunmaz**. Play, reklam kimliği
iznini beyan eden ama kullanmayan uygulamaları reddediyor; tersi de geçerli.
Android derleme akışı (`.github/workflows/sukun-android.yml`) birleştirilmiş
manifest'i denetler.

---

## Uygulama içindeki izinler ve gerekçeleri

| İzin | Platform | Neden |
|---|---|---|
| Konum (yalnız uygulama açıkken) | iOS + Android | Namaz vakti ve kıble açısı konuma göre hesaplanır. İsteğe bağlıdır: şehir elle de seçilebilir. Arka plan konumu **istenmez**. |
| Bildirim | iOS + Android | Ezan/vakit hatırlatıcıları. İsteğe bağlıdır. |
| İnternet | Android | Kıraat akışı ve içerik güncellemesi. |

**Bilerek istenmeyenler:** mikrofon, kamera, rehber, takvim, depolama,
arka plan konumu, hassas bildirim zamanlayıcısı, reklam kimliği. Android
derleme akışı bunların birleştirilmiş manifest'e sızmadığını her derlemede
denetler.

---

## Bu dosya ne zaman güncellenir

Aşağıdakilerden **biri** olursa, mağaza formu da bu dosya da güncellenmeden
sürüm gönderilmez:

- Hesap/oturum eklenmesi (v2 eşitleme, topluluk, AI — DECISIONS D12, D17)
- Reklam SDK'sı eklenmesi
- Analitik ya da uzak kilitlenme raporlama eklenmesi
- Uygulama içi satın alma eklenmesi
- Kullanıcı üretimi içerik eklenmesi
