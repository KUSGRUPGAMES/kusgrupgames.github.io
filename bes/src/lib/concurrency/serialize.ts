/**
 * Sıralı kuyruk — birbirini bozabilecek asenkron işlemleri **art arda**
 * yürütür, asla çakıştırmaz.
 *
 * ## Neden var
 *
 * Bildirim eşitleyicisi uygulama ağacında bir kez, ayrıca ayarlar ve
 * bildirim merkezi ekranlarında kullanıcı eylemiyle çağrılabiliyor. Üçü de
 * aynı cihaz kuyruğunu okuyup fark alıp yazıyor
 * (`installedRecords → farkAl → schedule/cancel`). İki çağrı aynı anda
 * çalışırsa ikisi de **aynı eski** kurulu listeyi okur, ikisi de kendi
 * farkına göre iptal/kurulum yapar — sonuçta bir çağrının kurduğu kayıt
 * öbürünün "istenmeyen" listesinde çıkıp hemen iptal edilebilir, ya da aynı
 * kimlik iki kez kurulmaya çalışılabilir.
 *
 * Kuyruk bunu iki şekilde çözer: (1) çağrılar birbirini beklediği için okuma
 * anı hep bir öncekinin yazması bittikten sonra olur — yarış durumu kalmaz;
 * (2) ikinci çağrı zaten eşitlenmiş bir duruma bakınca `farkAl` onu
 * "dokunulmayan" bulur ve gerçekte hiçbir şey yapmaz. Aynı işi iki kez
 * yapmak zararsız hâle gelir, sadece gereksiz olur.
 *
 * Bu bilerek genel bir yardımcıdır ve bildirime özgü hiçbir şey bilmez —
 * platform çağrısı içermediği için düğüm ortamında saf mantık olarak
 * sınanabilir.
 */
export interface SiraliKuyruk {
  /** İşi kuyruğa ekler; önceki iş(ler) bitmeden başlamaz. */
  ekle<R>(is: () => Promise<R>): Promise<R>;
}

export function siraliKuyrukOlustur(): SiraliKuyruk {
  let kuyruk: Promise<unknown> = Promise.resolve();
  return {
    ekle<R>(is: () => Promise<R>): Promise<R> {
      // Önceki iş reddetse bile sıradaki çalışmalı — `then(is, is)` bu
      // yüzden başarı ve hata kollarının ikisinde de aynı işi tetikler.
      const calisma = kuyruk.then(is, is);
      // Kuyrukta tutulan referans hiçbir zaman reddetmez; aksi hâlde bir
      // sonraki `ekle` çağrısı `unhandled rejection` üretir ve zincir kopar.
      kuyruk = calisma.then(() => undefined, () => undefined);
      return calisma;
    },
  };
}
