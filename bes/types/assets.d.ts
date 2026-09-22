/**
 * Görsel varlık modülleri.
 *
 * Metro `require('…png')` çağrısını bir varlık başvurusuna çevirir; TypeScript
 * bunu kendiliğinden bilmiyor. Logo **dosya olarak** kullanılmak zorunda
 * olduğu için (D17: kodla çizilmez) bu bildirim gerekli.
 */
declare module '*.png' {
  const kaynak: number;
  export default kaynak;
}
