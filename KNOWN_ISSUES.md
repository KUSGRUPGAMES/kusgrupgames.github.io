# KNOWN ISSUES

Bilinen eksikler ve engeller. Kapanan madde `CHANGELOG.md`'ye taşınır.

## Engelleyiciler — insan/hesap eylemi gerektirir

| # | Konu | Engellediği kapsam | Gereken |
|---|---|---|---|
| ~~B1~~ | ~~Türkçe meal lisansı yok~~ — **çözüldü**: Elmalılı Hamdi Yazır meali kamu malı (D13), içe aktarıldı — eski kapsam: §22 Günün Âyeti, §28 Reader meal modu, §35 meal araması, §51 global arama | Hak sahibinden yazılı izin veya lisans |
| B2 | **Tefsir** lisansı yok | §34 Tefsir | Adı belirtilen bir tefsir için lisans |
| B3 | **Hadis** külliyatı lisansı yok | §23 Günün Hadisi, §52 Hadis kütüphanesi | Lisanslı hadis veri kümesi |
| ~~B4~~ | ~~Kıraat kayıtları lisansı yok~~ — **çözüldü**: Islamic Network CDN'inden akış, 18 okuyucu (D14) | §32 Kur'an Audio, §33 offline audio | Okuyucu/yapımcı izni |
| B5 | **Supabase** production projesi yok — **v1'i engellemiyor** (D12); yalnız v2 eşitleme/topluluk/AI için gerekir | §57–59 hesap/sync, §70–72 veritabanı/RLS/admin | Supabase projesi + anahtarlar |
| B6 | **Apple Developer** hesabı bu ortamda yok | §18 Live Activities, §19 iOS widget, §67 StoreKit | Apple hesabı + sertifika + ürün tanımları |
| B7 | **Google Play** ürünleri tanımlı değil | §67 abonelik | Play Console'da abonelik ürünleri |
| B8 | **AI sağlayıcı anahtarı** yok | §56 AI asistan | LLM API anahtarı + vektör deposu |
| B9 | İlçe düzeyi konum verisi | Ülke + il seçimi çalışıyor; ilçe listesi için açık lisanslı bir veri kümesi gerekiyor. Vakit farkı il merkezine göre saniyeler mertebesinde olduğundan yayını engellemez. | Açık veri kümesi bulunup içe aktarılana kadar il düzeyi kullanılır |

> Bu engeller şartname §104 uyarınca **diğer geliştirmeyi durdurmaz**. İlgili
> modüllerin şeması, içe aktarma boruhattı, doğrulaması ve arayüzü tamamlanır;
> yalnız veri/kimlik yuvası boş kalır.

## Ortam sınırlamaları

| # | Konu | Etki |
|---|---|---|
| E1 | Bu kapsayıcıda **macOS/Xcode yok** | iOS derlemesi yalnız CI'da (macOS runner) doğrulanabilir |
| E2 | Bu kapsayıcıda **Android SDK yok** | Android derlemesi yalnız CI'da doğrulanabilir |
| E3 | Simülatör/emülatör yok | Ekran görüntüleri ve gezinme videosu web hedefi (react-native-web) üzerinden alınır. 42 ekran + 85 sn'lik tur bu yolla çekildi ve incelendi; gerçek cihazda son bir bakış yine de gerekiyor. |

## Açık teknik borç

| # | Konu | Not |
|---|---|---|
| T1 | Bildirim merkezi ekranı | Kurulu bildirim sayısı gösteriliyor; ayrı merkez ekranı FAZ 11'de yazılacak (§65). |
| T2 | Haftalık takvim ekranı | `rangeSchedule` işlevi ve sınaması hazır; ekranı FAZ 3'te eklenecek. |
| T4 | Esmâü'l-Hüsnâ Arapça yazımı | Okunuş ve Türkçe anlam tam; Arapça yazım doğrulanmış kaynaktan eklenecek. Ezberden dizilmeyeceği için bilerek boş (CONTENT_SOURCES kuralı 1). |
| T3 | Bileşen (render) testleri | Saf mantık sınanıyor; bileşen ve E2E sınamaları FAZ 18'de eklenecek (§86). |
