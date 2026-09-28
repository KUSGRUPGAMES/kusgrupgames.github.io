/**
 * Vakit bildirimi geldiğinde ne yapılacağına karar verir — saf mantık.
 *
 * Uygulama gerçekten ön plandaysa (aktif) tam ezan burada, uygulama içinde
 * çalınabilir; bildirimin kendi sesi bu durumda susturulur (aksi halde
 * ikisi üst üste biner). Ama uygulama arka plandaysa/kilitliyse — bildirim
 * işleyicisi (`handleNotification`) yine de tetiklenmiş olsa bile —
 * burada başlatılacak oynatıcının sesi duyulacağı garanti değildir (arka
 * planda sıfırdan yeni bir ses oturumu başlatmak iOS'ta kısıtlı); bu
 * yüzden sistemin kendi bildirim sesi (pakete gömülü ezan.wav) devrede
 * kalmalı, yoksa kullanıcı hiç ses duymuyor.
 *
 * Bu, "sına'ya basıp hemen ekranı kilitleyince ezan çalmıyor" şikâyetinin
 * kök nedeniydi: eski karar yalnız `ezanli`ye bakıyordu, uygulamanın
 * gerçekten ön planda olup olmadığına hiç bakmıyordu — ekran kapanır
 * kapanmaz hem sistem sesi susturuluyor hem uygulama içi oynatıcı sessiz
 * kalıyordu.
 */
export function ezanBildirimKarari(
  ezanli: boolean,
  ezanAcik: boolean,
  onPlanda: boolean,
): { uygulamaIcindeCal: boolean; sistemSesiCalsin: boolean } {
  const icindeCal = ezanli && ezanAcik && onPlanda;
  return { uygulamaIcindeCal: icindeCal, sistemSesiCalsin: !icindeCal };
}
