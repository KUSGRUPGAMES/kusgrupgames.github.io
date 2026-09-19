# Sükûn

Namaz vakti, kıble, Kur'an ve meal — **internetsiz çalışır**, hesap istemez,
kişisel veri cihazdan çıkmaz.

## Ne yapar

| Bölüm | İçerik |
|---|---|
| Vakitler | 7 hesap yöntemi, Hanefî/Şâfiî ikindi, dakika düzeltmesi, canlı geri sayım, aylık takvim, vakit bildirimleri |
| Kıble | Büyük daire hesabı, geometrik pusula kadranı, kalibrasyon ve girişim uyarısı, hizalanınca titreşim |
| Kur'an | 6236 âyet (Tanzil, Uthmani) + Elmalılı Hamdi Yazır meali, okuyucu, yer imleri, notlar, Arapça ve meal araması |
| Kıraat | 18 okuyucu, akış ve sure sure indirme, arka planda çalma |
| İbadet | Zikirmatik + istatistik, kaza sayacı, ibadet defteri, oruç takibi, namaz rehberi |
| Araçlar | Zekât ve fitre hesabı, hicrî takvim ve çevirici, dinî günler, ay durumu, Ramazan modu, mukabele, hac rehberi |
| Keşfet | Günün âyeti, duası, bilgisi ve esması; 99 esmâ, 34 dua, 43 bilgi maddesi |

## Geliştirme

```bash
npm install
npm start              # Expo geliştirme sunucusu
npm run gate           # tsc + eslint + test — commit öncesi zorunlu
npm run bundle         # paketlemenin çalıştığını doğrular
```

### Kalite kapısı

`npm run gate` yeşil değilse commit yok. Kapı üç adımdan oluşur ve **sırası
önemlidir**: `tsc` bazı hataları `jest`ten önce yakalar (ts-jest her tip
hatasını görmez, bu bir kez böyle oldu).

`npm run bundle` kapının parçası değildir ama yayın öncesi çalıştırılır:
Metro'nun çözemediği bazı kalıplar (şablon dizgili `require` gibi) yalnız
paketlemede patlar.

### Veri içe aktarma

```bash
npm run import:quran                 # Tanzil'den Arapça metin
npm run import:translation tr.yazir  # Elmalılı meali
npm run probe:reciters               # okuyucu kataloğunu ölçerek üretir
```

Üçü de **doğrulamadan geçmeyen veriyi yazmaz**. Mushaf metni, meal ya da
okuyucu listesi yarım kalamaz.

### Veritabanı (v2)

```bash
bash tools/verify-db.sh   # geçici PostgreSQL kurar, migration + RLS sınar
```

v1'de kullanılmıyor (bkz. `DECISIONS.md` D12). Şema ve RLS politikaları
v2'deki eşitleme/topluluk için hazır bekliyor.

## Mimari

- **Tek dosya kuralının istisnası.** Depodaki diğer ürünler tek HTML
  dosyasıdır; bu ürün Expo + TypeScript ile çok dosyalı kurulur. Gerekçe
  `DECISIONS.md` D3'te.
- **Saf mantık ayrı.** Hesaplar (vakit, kıble, hicrî, zekât, ay, eşitleme)
  React'tan bağımsız modüllerdir ve düğüm ortamında sınanır. Bileşen
  sınamaları ayrı jest projesindedir (`npm run test:ui`).
- **Platform köprüleri tek yerde.** Konum, bildirim, ses ve depolama
  çağrıları kendi dosyalarında toplanır; iş katmanı arayüz görür.

## Belgeler

| Dosya | İçerik |
|---|---|
| `../PROJECT_STATE.md` | Güncel durum — her oturumda ilk okunacak dosya |
| `../MASTER_CHECKLIST.md` | Şartnamenin madde madde durumu |
| `../DECISIONS.md` | Mimari kararlar ve gerekçeleri |
| `../KNOWN_ISSUES.md` | Engeller, ortam sınırları, teknik borç |
| `../CONTENT_SOURCES.md` | Dinî içeriğin kaynak ve telif durumu |
| `RELEASE_CHECKLIST.md` | Yayın öncesi adımlar |
| `supabase/README.md` | Şema ve RLS kuralları |

## Lisans ve kaynaklar

- Kur'an metni: [Tanzil Project](https://tanzil.net) — birebir kopya, atıflı.
- Meal: Elmalılı Hamdi Yazır, *Hak Dini Kur'an Dili* — kamu malı.
- Kıraat: [Islamic Network](https://islamic.network) CDN — akış, telif okuyucularda.
- Arapça yazı tipi: Amiri — SIL Open Font License 1.1.

Ayrıntı ve gerekçeler: `../CONTENT_SOURCES.md`.
