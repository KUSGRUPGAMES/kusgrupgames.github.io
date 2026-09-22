# Mimari

## Katmanlar

```
app/                    expo-router ekranları — yalnız düzen ve etkileşim
 └ (tabs)/              beş sekme
src/
 ├ ui/                  tasarım sistemi (29 bileşen, kendi SVG ikon seti)
 ├ theme/               token'lar, açık/koyu tema, reduced-motion
 ├ features/            iş mantığı — React'tan bağımsız, sınanabilir
 │   ├ prayer/          astronomi, çizelge, sağlayıcı soyutlaması
 │   ├ qibla/           büyük daire hesabı, pusula köprüsü
 │   ├ quran/           doğrulama, veri erişimi, Arapça normalizasyon
 │   ├ audio/           oynatma durumu, CDN adresleri, indirme
 │   ├ hijri/ moon/     takvim ve ay hesapları
 │   ├ zakat/ ramadan/  hesap araçları
 │   ├ sync/            çakışma çözümü (v2 için hazır)
 │   └ ...
 ├ lib/                 altyapı: zaman dilimi, günlük, ağ, depolama, i18n
 ├ store/               Zustand durumu — depolama teknolojisini bilmez
 ├ content/             paketle gelen özgün metinler
 ├ config/              marka (tek kaynak: brand.json)
 └ boot/                sağlayıcılar, hidrasyon, kalıcılık köprüsü
```

## Değişmez kurallar

1. **Ekran dosyaları hesap yapmaz.** Hesap `features/` içindedir; ekran
   sonucu çizer. Böylece her hesap düğüm ortamında sınanabilir.
2. **Tek zaman çerçevesi.** Vakitler konumun saat diliminde hesaplanır,
   "şimdi" de aynı çerçeveye çevrilir. İkisi karışırsa geri sayım saatlerce
   şaşar — bu hata bir kez yaşandı ve üç ayrı saat diliminde koşan bir
   sınamayla kapatıldı.
3. **Gömülü metin yok.** Kullanıcıya görünen her metin `t()` üzerinden gelir;
   sınama bunu denetler.
4. **Doğrulanmamış veri yüklenmez.** Kur'an, meal ve depodan okunan her şey
   şemadan geçer. Bozuk paket gösterilmez.
5. **Kişisel veri cihazda kalır.** Ağ katmanı yalnız içerik kanalında
   kullanılır; sınama başka bir yerde kullanılmasını engeller.
6. **Platform çağrıları tek dosyada.** Konum, bildirim, ses, depolama ve
   pusula kendi köprülerindedir.

## Sınama düzeni

| Proje | Kapsam | Süre |
|---|---|---|
| `mantik` | saf hesaplar, doğrulayıcılar, kaynak kodu denetimleri | ~2 sn |
| `bilesen` | React Native bileşenleri (jest-expo) | ~1 sn |

Ayrı tutmanın sebebi hız: geliştirme sırasında en sık çalışan mantık
sınamalarıdır.

Denetim sınamaları (erişilebilirlik, güvenlik, kontrast, son denetim) kaynak
kodu tarar. Amaç, "yapıldı" demeyi insan hafızasına bırakmamak.
