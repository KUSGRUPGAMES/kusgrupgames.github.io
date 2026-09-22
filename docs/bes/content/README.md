# BEŞ içerik kanalı

Bu klasör, **uygulama güncellemesi beklemeden** metin yenilemek içindir.
Uygulama açılışta `tr.json` dosyasını okur; ağ yoksa ya da dosya bozuksa
paketle gelen içerikle tam olarak çalışmaya devam eder.

## Nasıl güncellenir

1. `tr.json` içindeki `version` sayısını **bir artır**. Artırmazsan uygulama
   dosyayı yok sayar — bu kasıtlıdır: bozuk bir yayın geri alınabilsin diye.
2. Değiştireceğin maddeyi ekle. Alanlar:

```json
{
  "version": 2,
  "publishedAt": "2026-10-01",
  "duas": [
    { "id": "sabah-4", "category": "sabah", "title": "Başlık", "body": "En az 20 karakter metin." }
  ],
  "knowledge": [
    { "id": "k-yeni", "topic": "takvim", "title": "Başlık", "body": "En az 40 karakter metin." }
  ],
  "religiousDays": [
    { "slug": "ramadanStart", "gregorianDate": "2027-02-08", "title": "Ramazan Başlangıcı" }
  ]
}
```

3. `main` dalına gönder. GitHub Pages birkaç dakikada yayınlar.

## Kurallar

- **Kanal hiçbir şeyi silemez.** Aynı kimlik güncellenir, yeni kimlik eklenir.
  Silme yetkisi olsaydı bozuk bir yayın uygulamayı boşaltabilirdi.
- **Şemaya uymayan paket yok sayılır.** Yarım içerik gösterilmez.
- **Âyet, hadis ve meal buraya konmaz.** Onlar paketle gelir ve kaynak
  künyesiyle birlikte doğrulanır (`CONTENT_SOURCES.md`).
- Dinî gün düzeltmesi, resmî ilan hicrî hesaptan farklı çıktığında kullanılır.
