# BEŞ — Marka Kılavuzu

**Marka varlıklarının kaynağı `assets/brand/` altındaki verilen pakettir.**
Logo bu depoda çizilmez, izlenmez, yeniden üretilmez, bir görüntü üretecine
verilmez. Paketin kendi kuralları `assets/brand/docs/CLAUDE_HANDOFF.md`
içindedir ve bu belgeden önce gelir.

Bu belge paketin kurallarını **bu uygulamada nasıl uyguladığımızı** anlatır.
Bir renk, ölçü ya da kullanım ne pakette ne burada yazıyorsa uydurulmaz.

---

## 1. Marka adı

**BEŞ**

- Uygulamanın adı **"5" değildir**. `5` markanın **sembolüdür**.
- İşletim sisteminde ikonun altında görünen ad: `BEŞ`
- Bildirim gönderen uygulama: `BEŞ`
- Mağaza adı: `BEŞ – Ezan & Namaz Vakitleri`
- Slogan: *5 Vakit, Daima Yanında.* — logonun parçası **değildir**, ayrı kullanılır.

`Ş` harfi hiçbir yüzeyde bozulmamalıdır. Bunu `direction.test.ts` denetler.

**Teknik istisna:** paket kimliği `com.kusgrup.sukun` olarak **kalır**. Kimlik
değiştirmek imzayı, App Store Connect kaydını ve yüklü kurulumları kırar;
kullanıcıya görünen hiçbir yerde geçmediği için değiştirilmedi (DECISIONS D15).

---

## 2. Marka fikri

BEŞ'in ilk çağrışımı **beş vakit namazdır**. Ama ürün yalnız vakit uygulaması
değil: ezan, Kur'an, kıble, dua, zikir, esmâ, Ramazan, mukabele, ibadet takibi,
zekât, hac ve umre — günlük İslami hayatın tamamı.

Marka **modern, sakin, güvenilir, zamansız** hissettirir. Çocuk uygulaması gibi
durmaz, aşırı süslü Osmanlı estetiğine kaçmaz, altına boğulmaz.

---

## 3. Sembol

Büyük, özel çizilmiş bir **5**. Rakamın alt kâsesinin iç boşluğunda cami
kubbesi, iki minare ve hilal durur — ilk bakışta `5`, ikinci bakışta siluet.

**Kaynak dosyalar** (`assets/brand/svg/`):

| Dosya | Ne için |
|---|---|
| `BES_AppIcon_Dark.svg` | koyu tema master ikonu |
| `BES_AppIcon_Light.svg` | açık tema master ikonu |
| `BES_Symbol_Gold.svg` | saydam sembol (altın) |
| `BES_Symbol_Emerald.svg` | saydam sembol (zümrüt) |
| `BES_Symbol_Monochrome_Black/White.svg` | tek renk siluet |
| `BES_Android_Adaptive_Foreground.svg` | Android ön katmanı |
| `BES_Android_Notification_Monochrome.svg` | Android bildirim rozeti |
| `BES_Pattern_Dark/Light.svg` | marka deseni |

Sembolün yerel sınır kutusu **x 210–806, y 105–872** (1024 birimlik kutuda) ve
bu on dosyanın hepsinde **birebir aynıdır**; `brand.test.ts` yol verilerini
karşılaştırarak doğrular.

### Değişmez kural

**Koyu ve açık aynı yolları kullanır.** Farkları yalnız zemin rengi
(`#003F32` / `#F7F3E8`) ve sembolün dolgusudur. İki logo gibi görünmesi kabul
edilmez; sınama iki dosyanın `d` değerlerinin eşit olmasını şart koşar.

### Rasterleme

`node tools/gen-brand.js` verilen SVG'leri Expo'nun beklediği adlara ve
boyutlara **yalnız rasterler**. İki teknik uyarlama vardır, ikisi de paketin
kendi maddesi:

1. **iOS ikonunda yuvarlak köşe kaldırılır** (kural 3). Verilen master
   `rx="220"` taşır; Apple kendi maskesini uyguladığı için iki yuvarlama üst
   üste binerse köşelerde açık renk bir hâle kalır. Yalnız zemin
   dikdörtgeninin köşe yarıçapı üretim anında sıfırlanır — sembole
   dokunulmaz, kaynak dosya değişmez.
2. **Android ön katmanının arkası** paketin Deep Emerald'ıyla doldurulur
   (kural 4); verilen foreground saydamdır.

### Paketteki PNG'ler hakkında

`assets/brand/png/` içindeki rasterler pakette geldiği gibi durur ama
**platform ikonları onlardan üretilmez**. İki sebeple: (a) SVG'lerden farklı
bir çizim taşıyorlar, (b) etraflarında pişmiş beyaz kenar boşluğu ve gölge
var — uygulama ikonu tam kanar (full-bleed) olmalı, saydamlık ve pişmiş gölge
kabul edilmez. Paketin kendi belgesi de SVG'leri kaynak ilan ediyor.

## 4. Duyarlı (responsive) işaret

Logo küçüldükçe **sadeleşir, değişmez**. Bu bir yeniden tasarım değil, tek
markanın ölçek kademeleridir.

| Kademe | Dosya | Kullanım |
|---|---|---|
| Tam | `BES_AppIcon_Dark/Light.svg` | uygulama ikonu, açılış, mağaza |
| Saydam | `BES_Symbol_Gold/Emerald.svg` | hero, paylaşım kartı, Pro ekranı |
| Tek renk | `BES_Symbol_Monochrome_*.svg` | Watch, Dynamic Island, rozet |
| Bildirim | `BES_Android_Notification_Monochrome.svg` | Android durum çubuğu |

Paket kuralı 10: **çok küçük yüzeylerde ayrıntılı cami küçültülmez**, tek
renk/sadeleşmiş sembol kullanılır. Ölçüldü: 24 piksel ve altında kubbe ile
minare çamura dönüşüyor.

---

## 5. Renkler

Adlandırılmış marka renkleri **paketten** gelir
(`assets/brand/brand.tokens.json`); `brand.test.ts` ikisini karşılaştırır.
Ara basamaklar tema katmanları için o renklerden türetilmiştir.
Ekranlarda düz renk kodu yazılmaz.

### Zümrüt

| Token | HEX | Paket adı | Kullanım |
|---|---|---|---|
| `emerald900` | `#003F32` | **deepEmerald** | koyu tema zemini, ikon zemini, açılış |
| `emerald800` | `#004A3E` | — | koyu tema yüzeyi |
| `emerald700` | `#005343` | **emerald** | koyu tema yükseltilmiş yüzey |
| `emerald600` | `#006451` | — | açık temada vurgu |
| `emerald500` | `#0A7A62` | — | — |
| `emerald400` | `#2E9B80` | — | başarı |
| `emerald300` | `#63BFA6` | — | koyu temada vurgu |

### Fildişi

| Token | HEX | Paket adı | Kullanım |
|---|---|---|---|
| `ivory50` | `#FDFBF6` | — | açık tema kart yüzeyi |
| `ivory100` | `#F7F3E8` | **warmIvory** | açık tema zemini, açık ikon zemini |
| `ivory200` | `#EADFC7` | **softBeige** | kenarlık, yükseltilmiş yüzey |
| `ivory300` | `#DCCFB2` | — | daha belirgin kenarlık |

**Saf beyaz (`#FFFFFF`) ana yüzeylerde kullanılmaz.** Steril beyaz ürünü
jenerik bir mobil uygulamaya çeviriyordu.

### Altın

| Token | HEX | Paket adı | Kullanım |
|---|---|---|---|
| `gold600` | `#8A6A1F` | — | açık zeminde okunabilir koyu altın (WCAG) |
| `gold500` | `#B98E42` | **goldDark** | gradyanın koyu ucu |
| `gold400` | `#D6B46A` | **mutedGold** | koyu temada vurgu |
| `gold300` | `#E9D19B` | — | ikon gradyanı |
| `gold200` | `#FFF9E9` | — | ikon gradyanı (en açık) |

`gold300` ve `gold200` uydurma değildir: verilen `BES_AppIcon_Dark.svg`
içindeki altın gradyanın duraklarıdır. Arayüzün altını böylece ikonun
altınıyla birebir aynı olur.

**Altın yalnız vurgudur.** Gövde metni asla altın değildir; açık zeminde küçük
altın metin erişilebilirlik sınamasından geçmez.

---

## 6. İslami geometrik desen

Tek bir desen ailesi: **sekiz köşeli yıldız + daire**. Geometri verilen
`BES_Pattern_Dark/Light.svg` karosundan birebir alınmıştır ve uygulamanın
`rubElHizb` motifi de artık **aynı karoyu** çizer — daha önce arayüzde iki üst
üste kare, ikonda sekiz köşeli yıldız vardı ve ikisi birbirini tutmuyordu.

- Karo: 96 birim, kusursuz tekrar (seamless)
- Yıldız çizgisi 1,4 birim · daire çizgisi 1 birim
- Koyu tema: `#3E8B76`, opaklık %20 / %13
- Açık tema: `#C9A65A`, opaklık %18 / %11
- Uygulama içi motif opaklığı: `opacity.motif` = **%6**

Daire, arayüzde 24 kenarlı çokgenle çizilir: karo sınaması yolların karo
dışına taşmadığını sayıları okuyarak denetliyor ve göreli yay deltaları o
denetimi yanlış yere düşürüyordu. Bu ölçekte fark görünmez.

**Nerede kullanılır:** ikon zemini, açılış ekranı, ana sayfa hero, geri sayım
kartı, profil başlığı, Pro ekranı, boş durumlar, widget zeminleri.

**Nerede kullanılmaz:** Kur'an âyetlerinin doğrudan arkası, liste satırları,
her kart. Desen içerik okunabilirliğini asla düşürmez.

---

## 7. Varlık dosyaları

```
assets/
  brand/                     ← VERİLEN PAKET, olduğu gibi
    brand.tokens.json        renk ve ad kaynağı
    docs/CLAUDE_HANDOFF.md   paketin kendi kuralları
    svg/                     master vektörler
    png/                     paketin rasterları (referans; ikon üretilmez)
    reference/               görsel referans panosu
    ── aşağıdakiler gen-brand.js ile paketten üretilir ──
    app-icon-ios-light.png   iOS açık varyant
    notification-icon.png    Android bildirim rozeti
    splash-icon-light.png    açık tema açılış sembolü
    symbol-micro-dark/light.png
    pattern-dark/light.png
  icon.png                   iOS + mağaza (köşesiz, saydamlık yok)
  adaptive-icon.png          Android ön katman
  adaptive-icon-mono.png     Android 13+ temalı ikon
  splash-icon.png            koyu tema açılış sembolü
  favicon.png                web
```

## 8. Tipografi

| Katman | Yazı tipi | Not |
|---|---|---|
| Arayüz | sistem sans-serif | iOS'ta San Francisco, Android'de Roboto — Dynamic Type ile en uyumlu |
| Arapça | Amiri / Amiri Quran | SIL OFL 1.1, lisans paketle dağıtılır |

Logo tipografisi ile arayüz tipografisinin aynı olması **zorunlu değildir**.
Türkçe karakterler (Ç Ğ İ Ö Ş Ü) tam desteklenir.

---

## 9. Yanlış kullanımlar

- Logoyu yeniden çizmek, izlemek, bir görüntü üretecine vermek, oranını
  bozmak, döndürmek, eğmek
- Koyu ve açık için **farklı geometri** kullanmak
- Deseni logonun üstünde ya da yüksek opaklıkta kullanmak
- Ağır 3D, parlak krom, kalın bevel, ucuz gradyan
- Marka adını `5` diye yazmak
- Her ekrana dev logo koymak — marka renkten, tipografiden, desenden ve
  geri sayım halkasından tanınır; logo sürekli bağırmaz
- Altın gövde metni

---

## 10. Henüz üretilmemiş yüzeyler

Aşağıdakiler native hedef gerektirdiği için kodda yok (KNOWN_ISSUES B6/B7).
Hedefler açıldığında **buradaki dosyalar ve değerler** kullanılır; yeniden
tasarım yapılmaz.

| Yüzey | Gereken hedef | Kullanılacak varlık | Renkler |
|---|---|---|---|
| iOS widget | WidgetKit | `brand/pattern-dark.png` zemin + `BES_Symbol_Gold.svg` | zemin `#003F32`, vakit adı `#FDFBF6`, geri sayım `#D6B46A` |
| Live Activity (kilit ekranı) | ActivityKit | `BES_Symbol_Gold.svg` | zemin `#003F32`, metin `#FDFBF6`, ilerleme `#D6B46A` |
| Dynamic Island — compact | ActivityKit | `BES_Symbol_Monochrome_White.svg` | sol: sembol, sağ: kalan süre |
| Dynamic Island — expanded | ActivityKit | `BES_Symbol_Gold.svg` | sembol · vakit adı · saat · geri sayım |
| Apple Watch | watchOS hedefi | `BES_Symbol_Monochrome_White.svg` | OLED siyah zemin; complication'da cami ayrıntısı gösterilmez |
| Android widget | AppWidgetProvider | `brand/pattern-dark.png` + `BES_Symbol_Gold.svg` | iOS widget'la aynı |

Küçük yüzeylerde **tek renk sembol** kullanılır (paket kuralı 10): ayrıntılı
cami 24 piksel ve altında çamura dönüşüyor.

### Zaten bağlı olanlar

| Yüzey | Nereden |
|---|---|
| iOS uygulama ikonu | `assets/icon.png` — paketten, köşesiz |
| Android uyarlanabilir ikon | `assets/adaptive-icon.png` + Deep Emerald zemin |
| Android 13+ temalı ikon | `assets/adaptive-icon-mono.png` |
| Android bildirim rozeti | `assets/brand/notification-icon.png` (expo-notifications) |
| Açılış ekranı (koyu/açık) | `splash-icon.png` / `brand/splash-icon-light.png` |
| Uygulama içi motif | `rubElHizb` — paketin karosunun birebir aynısı |
| Paylaşım kartı | `Brand.appName` künyesi, marka renkleri |
