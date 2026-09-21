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

### Tek kaynak: bitmiş master PNG

| Dosya | Ne |
|---|---|
| `assets/brand/png/BES_AppIcon_Dark_1024.png` | koyu tema master ikonu |
| `assets/brand/png/BES_AppIcon_Light_1024.png` | açık tema master ikonu |
| `assets/brand/png/BES_AppIcon_*_{32..512}.png` | aynı çizimin pratik boyları |
| `assets/brand/reference/BES_Brand_Guideline_Board.png` | görsel referans panosu |

**Logo bu depoda çizilmez.** Vektör yolu üretilmez, yazı tipiyle "5" yazılmaz,
cami/minare/hilal kurulmaz, logo CSS ya da React Native/SVG ile yeniden
yaratılmaz. Geometrisi hiçbir koşulda değişmez; ölçeklerken yalnız en-boy oranı
korunur (D17).

> **Bir kez tersi yapıldı.** Pakette on adet `BES_*.svg` geliyordu ve platform
> ikonları onlardan üretilmişti. O dosyalar onaylanan logonun **elle yapılmış
> yaklaşık rekonstrüksiyonlarıydı** ve marka tasarımını bozdu. Klasör depodan
> kaldırıldı; `brand.test.ts` `assets/brand/` altında bir daha `.svg`
> belirmediğini ve `gen-brand.js` içinde yol verisi/`<svg>`/`font-family`
> bulunmadığını denetliyor.

### Üretim

`node tools/gen-brand.js` masterdan platform varlıklarını çıkarır. Yaptığı iş
üçle sınırlıdır ve üçü de logonun geometrisine dokunmaz:

1. **Kırpma.** Master, logoyu kâğıt üzerinde sunan bir kompozisyondur:
   kutucuğun çevresinde ince açık zemin ve yumuşak bir gölge var. Kenar
   parlaklık basamağından ölçülür, sunum çerçevesi atılır.
2. **Ölçekleme.** Yalnız en-boy oranı korunarak; kısa kenar doldurulur, uzun
   kenardan simetrik kırpılır. Esnetme yok — sınama üretilenin oranını masterın
   oranıyla karşılaştırıyor.
3. **Alfa ayıklama.** Saydam sembol, tek renk siluet ve Android ön planı
   masterın kendi piksellerinden parlaklık eşiğiyle ayrılır.

Üç teknik uyarlama, üçü de platformun dayattığı şey:

- **iOS ikonunda köşe yuvarlaması giderilir.** Master kutucuğu yuvarlak köşeli;
  Apple kendi maskesini uyguluyor ve iki yuvarlama üst üste binince köşede açık
  renk bir hâle kalıyor (CLAUDE_HANDOFF kuralı 3). Köşe, kutucuğun kenar
  piksellerinin ışınsal uzatılmasıyla doldurulur. Çıktı **alfasız** yazılır;
  Apple saydam ikon kabul etmiyor.
- **Android tek renk yüzeyleri** — bildirim küçük ikonu ve Android 13 temalı
  ikon — işletim sisteminin zorunlu kıldığı **tek istisnadır**: renk taşınamaz,
  masterdan çıkarılan siluet konur.
- **Android uyarlanabilir ikon** merkezden en uzak opak piksele göre
  ölçeklenir. Sınırlayıcı dikdörtgeni %66'ya oturtmak yetmiyordu: "5"in üst
  kanadı ile alt kâsesi köşelere uzandığı için piksellerin %1,5'i güvenli
  dairenin dışında kalıyordu.

### Üretilen dosyalar

| Dosya | Boy | Nerede |
|---|---|---|
| `assets/icon.png` | 1024 | iOS uygulama ikonu, App Store pazarlama ikonu |
| `assets/adaptive-icon.png` | 1024 | Android ön katman (zemin `#003F32`) |
| `assets/adaptive-icon-mono.png` | 1024 | Android 13+ temalı ikon |
| `assets/splash-icon.png` | 1024 | koyu açılış ekranı (altın sembol) |
| `assets/favicon.png` | 96 | web |
| `assets/brand/splash-icon-light.png` | 1024 | açık açılış ekranı (zümrüt sembol) |
| `assets/brand/notification-icon.png` | 512 | Android durum çubuğu |
| `assets/brand/app-icon-ios-light.png` | 1024 | açık tema ikon karşılığı |
| `assets/brand/logo-dark/light.png` | 512 | mağaza, tanıtım, büyük marka kullanımı |
| `assets/brand/symbol-micro-light/dark.png` | 256 | Watch, Dynamic Island, rozet |

## 4. Duyarlı (responsive) işaret

Logo küçüldükçe **sadeleşir, değişmez**. Bu bir yeniden tasarım değil, tek
markanın ölçek kademeleridir.

| Kademe | Dosya | Kullanım |
|---|---|---|
| Tam | `brand/logo-dark.png`, `brand/logo-light.png` | uygulama ikonu, açılış, mağaza |
| Saydam | `splash-icon.png`, `brand/splash-icon-light.png` | hero, paylaşım kartı, Pro ekranı |
| Tek renk | `brand/symbol-micro-light/dark.png` | Watch, Dynamic Island, rozet |
| Bildirim | `brand/notification-icon.png` | Android durum çubuğu |

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

`gold300` ve `gold200` uydurma değildir: master ikondaki altının açık
duraklarından okunmuştur. Arayüzün altını böylece ikonun altınıyla aynı
aileden olur.

**Altın yalnız vurgudur.** Gövde metni asla altın değildir; açık zeminde küçük
altın metin erişilebilirlik sınamasından geçmez.

---

## 6. İslami geometrik desen

Tek bir desen ailesi: **sekiz köşeli yıldız + daire**. Bu **logo değildir**:
rub'ül hizb, İslam sanatının ortak geometrik dilinden gelen bir yüzey
dokusudur, marka işareti taşımaz ve logonun yerine geçmez. Logo hiçbir koşulda
kodla çizilmediği için (D17) arayüzde yalnız bu doku üretilir.

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
    png/                     BİTMİŞ MASTER — logonun tek kaynağı
    reference/               görsel referans panosu
    ── aşağıdakiler gen-brand.js ile masterdan üretilir ──
    app-icon-ios-light.png   iOS açık varyant
    logo-dark/light.png      büyük marka kullanımı (512)
    notification-icon.png    Android bildirim rozeti
    splash-icon-light.png    açık tema açılış sembolü
    symbol-micro-dark/light.png
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
| iOS widget | WidgetKit | `splash-icon.png` (altın sembol) | zemin `#003F32`, vakit adı `#FDFBF6`, geri sayım `#D6B46A` |
| Live Activity (kilit ekranı) | ActivityKit | `splash-icon.png` | zemin `#003F32`, metin `#FDFBF6`, ilerleme `#D6B46A` |
| Dynamic Island — compact | ActivityKit | `brand/symbol-micro-light.png` | sol: sembol, sağ: kalan süre |
| Dynamic Island — expanded | ActivityKit | `splash-icon.png` | sembol · vakit adı · saat · geri sayım |
| Apple Watch | watchOS hedefi | `brand/symbol-micro-light.png` | OLED siyah zemin; complication'da cami ayrıntısı gösterilmez |
| Android widget | AppWidgetProvider | `splash-icon.png` | iOS widget'la aynı |

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
