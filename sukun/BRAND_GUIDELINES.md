# BEŞ — Marka Kılavuzu

Bu belge markanın tek referansıdır. Bir renk, ölçü ya da kullanım burada
yazmıyorsa uydurulmaz; önce buraya yazılır, sonra koda girer.

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
kubbesi, iki minare ve kubbenin tepesinde hilal (alem) durur.

**Çift katmanlı algı markanın temel fikridir:** ilk bakışta `5`, ikinci bakışta
siluet. Cami ayrı yapıştırılmış bir klip-art değildir; tabanı kâsenin iç alt
kenarının altına taşarak rakamın geometrisine kaynaşır.

Kaynak: `tools/brand/mark.js` — **tek kaynak**. Bütün rasterlar buradan üretilir,
tersi asla olmaz. Üretim: `node tools/gen-brand.js`.

### Geometri (1024×1024 birim kutusu)

| Parça | Değer |
|---|---|
| Kâse merkezi | (516, 652) |
| Kâse dış yarıçapı | 266 |
| İç boşluk (elips) | rx 172 · ry 192 |
| Halka açı aralığı | 254° → 170° (y aşağı) |
| Yan kalınlık | 94 birim |
| Üst/alt kalınlık | 74 birim |
| Optik merkez kaydırması | (−28, −16) |

İç boşluğun **elips** olması kaligrafik kontrastı verir. Düz daire kullanılırsa
rakam "boru" gibi durur.

### Değişmez kural

**Koyu ve açık tema aynı geometriyi kullanır.** `mark.js` tema bilmez; yalnız
renk dışarıdan verilir. İki logo gibi görünmesi kabul edilmez.

---

## 4. Duyarlı (responsive) işaret

Logo küçüldükçe **sadeleşir, değişmez**. Bu bir yeniden tasarım değil, tek
markanın ölçek kademeleridir.

| Kademe | İçerik | Kullanım |
|---|---|---|
| `tamYol()` | 5 + kubbe + 2 minare (şerefeli) + hilal | ≥ 128 px: uygulama ikonu, açılış, mağaza |
| `ortaYol()` | 5 + sadeleşmiş siluet (şerefe ve alem yok) | 48–128 px: widget, bildirim |
| `mikroYol()` | yalnız 5 | ≤ 48 px: favicon, Dynamic Island, complication |

Ölçü denetimi yapıldı: **24 piksel ve altında cami detayı çamura dönüşüyor.**
Bu yüzden mikro kademe var.

---

## 5. Renkler

Tek kaynak: `src/theme/tokens.ts` → `palette`. Ekranlarda düz renk kodu yazılmaz.

### Zümrüt (Deep Emerald)

| Token | HEX | Kullanım |
|---|---|---|
| `emerald900` | `#04211B` | koyu tema zemini, ikon zemin bitişi |
| `emerald800` | `#003F32` | koyu tema yüzeyi |
| `emerald700` | `#004A3B` | koyu tema yükseltilmiş yüzey, ikon zemin başı |
| `emerald600` | `#005343` | açık temada vurgu |
| `emerald500` | `#0A6A55` | — |
| `emerald400` | `#2E9B80` | başarı |
| `emerald300` | `#63BFA6` | koyu temada vurgu |

### Fildişi (Warm Ivory / Cream)

| Token | HEX | Kullanım |
|---|---|---|
| `ivory50` | `#FDFBF6` | açık tema kart yüzeyi |
| `ivory100` | `#FAF7EF` | açık tema yükseltilmiş yüzey |
| `ivory200` | `#F4EFE3` | açık tema sayfa zemini |
| `ivory300` | `#E7DFCD` | açık tema kenarlığı |

**Saf beyaz (`#FFFFFF`) ana yüzeylerde kullanılmaz.** Steril beyaz ürünü
jenerik bir mobil uygulamaya çeviriyordu.

### Altın (Muted Gold)

| Token | HEX | Kullanım |
|---|---|---|
| `gold600` | `#8A6A1F` | açık temada vurgu metni (kontrast için koyu) |
| `gold500` | `#A8853F` | — |
| `gold400` | `#C9A65A` | koyu temada vurgu, işaret gradyanı ortası |
| `gold300` | `#D6B46A` | işaret gradyanı açık ucu |
| `gold200` | `#E3C88A` | — |

**Altın yalnız vurgudur.** Gövde metni asla altın değildir; açık zeminde küçük
altın metin erişilebilirlik sınamasından geçmez.

---

## 6. İslami geometrik desen

Tek bir desen ailesi: **rub'ül hizb** — iki karenin 45° kaydırılmasıyla oluşan
sekiz köşeli yıldız örgüsü. Kaynak: `mark.js` → `desen()`.

- Karo adımı: 176 birim, kusursuz tekrar (seamless)
- Koyu tema: altın üzerine zümrüt, opaklık **%6**
- Açık tema: zümrüt üzerine fildişi, opaklık **%5,5**
- Çizgi kalınlığı: 2 birim

**Nerede kullanılır:** ikon zemini, açılış ekranı, ana sayfa hero, geri sayım
kartı, profil başlığı, Pro ekranı, boş durumlar, widget zeminleri.

**Nerede kullanılmaz:** Kur'an âyetlerinin doğrudan arkası, liste satırları,
her kart. Desen içerik okunabilirliğini asla düşürmez.

---

## 7. Varlık dosyaları

```
assets/
  brand/
    symbol-dark.svg / .png          işaret, saydam zemin
    symbol-light.svg / .png
    symbol-micro-dark.png           mikro kademe
    symbol-micro-light.png
    app-icon-dark.svg / .png        zeminli ikon
    app-icon-light.svg / .png
    app-icon-monochrome.png         tek renk beyaz siluet
  icon.png                          iOS + mağaza (1024, saydamlık yok)
  adaptive-icon.png                 Android foreground
  adaptive-icon-mono.png            Android 13+ temalı ikon
  splash-icon.png                   açılış işareti
  favicon.png                       web
```

Android maskesi kenarları kırptığı için foreground içeriği merkezdeki **%66**
daireye sığar (ölçek 0,62). iOS ikonunda saydamlık yoktur; köşeleri Apple
yuvarlar, ikonun içine yuvarlak köşe çizilmez.

---

## 8. Tipografi

| Katman | Yazı tipi | Not |
|---|---|---|
| Arayüz | sistem sans-serif | iOS'ta San Francisco, Android'de Roboto — Dynamic Type ile en uyumlu |
| Arapça | Amiri / Amiri Quran | SIL OFL 1.1, lisans paketle dağıtılır |

Logo tipografisi ile arayüz tipografisinin aynı olması **zorunlu değildir**.
Türkçe karakterler (Ç Ğ İ Ö Ş Ü) tam desteklenir.

---

## 9. Yanlış kullanımlar

- Logoyu yeniden çizmek, oranını bozmak, döndürmek
- Koyu ve açık için **farklı geometri** kullanmak
- Deseni logonun üstünde ya da yüksek opaklıkta kullanmak
- Ağır 3D, parlak krom, kalın bevel, ucuz gradyan
- Marka adını `5` diye yazmak
- Her ekrana dev logo koymak — marka renkten, tipografiden, desenden ve
  geri sayım halkasından tanınır; logo sürekli bağırmaz
- Altın gövde metni

---

## 10. Henüz üretilmemiş yüzeyler

Aşağıdakiler **tasarımı bu kılavuzda tanımlı** ama native hedef gerektirdiği
için kodda yok (KNOWN_ISSUES B6/B7):

| Yüzey | Gereken | Tasarım |
|---|---|---|
| iOS widget | WidgetKit hedefi | zemin `emerald900` + %6 desen; `ortaYol()`; vakit adı `ivory50`, geri sayım `gold400` |
| Live Activity / Dynamic Island | ActivityKit | compact: `mikroYol()` + kalan süre; expanded: işaret, vakit adı, saat, geri sayım |
| Apple Watch | watchOS hedefi | OLED siyah üstüne `mikroYol()`; complication'da cami detayı gösterilmez |
| Android widget | AppWidgetProvider | aynı desen ve renk sistemi; `ortaYol()` |

Bu yüzeyler açıldığında **buradaki ölçüler ve renkler kullanılır**, yeniden
tasarım yapılmaz.
