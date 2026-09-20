/**
 * BEŞ marka işareti — tek kaynak (single source of truth).
 *
 * İşaret: özel çizilmiş büyük bir **5**. Rakamın alt kâsesinin iç boşluğunda
 * cami kubbesi, iki minare ve kubbenin üzerinde hilal durur. Kullanıcı ilk
 * bakışta "5" görür, ikinci bakışta siluetini fark eder — bu çift katmanlı
 * algı markanın temel fikridir.
 *
 * **Değişmez kural:** koyu ve açık tema İŞARETİN AYNI GEOMETRİSİNİ kullanır.
 * Burada üretilen yollar tema bilmez; yalnız renk dışarıdan verilir. Böylece
 * iki tema "aynı logonun gece ve gündüz hâli" olur, iki ayrı logo değil.
 *
 * Tüm koordinatlar 1024×1024 birim kutusundadır. Bütün parçalar TEK yolda
 * birleşir (nonzero sarım): ayrı `<path>` olarak çizilince aralarına gradyan
 * dikişi giriyor ve işaret parçalı görünüyor.
 */

const BOY = 1024;

/** Kâse (alt halka) — rakamın gövdesi. */
const KASE = {
  cx: 516, cy: 652,
  R: 266,                    // dış yarıçap
  rx: 172, ry: 192,          // iç boşluk (elips): yanlar kalın, üst/alt ince
  bas: 254, son: 170,        // halkanın var olduğu açı aralığı (derece, y aşağı)
};

/** İşaretin optik merkezi tuval merkeziyle örtüşsün diye kaydırma. */
const KAYDIR = { x: -28, y: -16 };

const derece = (d) => (d * Math.PI) / 180;
const nokta = (cx, cy, rx, ry, d) => [
  cx + rx * Math.cos(derece(d)),
  cy + ry * Math.sin(derece(d)),
];
const s = (n) => Number(n).toFixed(1);

/**
 * Kâse: dış daire yayı + iç elips yayı ile kapatılmış halka dilimi.
 * İç boşluğun elips olması kaligrafik kontrastı verir: yanlarda 94 birim
 * kalınlık, üstte/altta 74 — düz daire kullanılsa rakam "boru" gibi durur.
 */
function kase() {
  const { cx, cy, R, rx, ry, bas, son } = KASE;
  const yay = (son + 360 - bas) % 360;
  const buyuk = yay > 180 ? 1 : 0;
  const [dbx, dby] = nokta(cx, cy, R, R, bas);
  const [dsx, dsy] = nokta(cx, cy, R, R, son);
  const [ibx, iby] = nokta(cx, cy, rx, ry, bas);
  const [isx, isy] = nokta(cx, cy, rx, ry, son);
  return `M${s(dbx)},${s(dby)}`
    + `A${R},${R} 0 ${buyuk} 1 ${s(dsx)},${s(dsy)}`
    + `L${s(isx)},${s(isy)}`
    + `A${rx},${ry} 0 ${buyuk} 0 ${s(ibx)},${s(iby)}`
    + 'Z';
}

/**
 * Gövde — üst çubuktan inip kâsenin sol üst ucuna kaynaşır.
 * Kâsenin başlangıç kesiği (445,404)–(475,481) arasındadır; dörtgen bu kesiği
 * TAMAMEN örtecek kadar aşağı iner. Kısa kesilen ilk sürümde birleşme yerinde
 * görünür bir çentik kalıyordu.
 */
function govde() {
  return 'M366,230 L466,230 L520,510 L426,476 Z';
}

/**
 * Üst çubuk ve ucundaki kıvrım — rakamın "bayrağı".
 * Uç yukarı doğru hafifçe kalkar; işaretin kaligrafik karakterini taşıyan tek
 * öğe budur, düz bir çubuk rakamı sıradanlaştırıyor.
 */
function bayrak() {
  return 'M366,230 '
    + 'C512,188 642,170 744,190 '
    + 'C788,198 806,172 814,142 '
    + 'C830,212 792,266 714,262 '
    + 'C634,258 538,272 466,306 '
    + 'Z';
}

/**
 * Hilal — kubbenin **alemi**. İki dairenin farkı: dış daire saat yönünde, iç
 * daire TERS yönde çizilir; nonzero sarım kuralında delik ancak böyle oluşur.
 * İlk sürümde ikisi de aynı yöne sarıldığı için hilal dolu daireye dönüşüp
 * kayboldu. İkinci sürümde boşluğun ortasında serseri bir "o" gibi duruyordu;
 * yeri kubbenin tepesi oldu — alem zaten oraya konur.
 */
function hilal() {
  const cx = 516, cy = 694, r = 23, ic = 19, kay = 13;
  return `M${s(cx)},${s(cy - r)}`
    + `A${r},${r} 0 1 1 ${s(cx)},${s(cy + r)}`
    + `A${r},${r} 0 1 1 ${s(cx)},${s(cy - r)}Z`
    + `M${s(cx + kay)},${s(cy - ic)}`
    + `A${ic},${ic} 0 1 0 ${s(cx + kay)},${s(cy + ic)}`
    + `A${ic},${ic} 0 1 0 ${s(cx + kay)},${s(cy - ic)}Z`;
}

/**
 * Cami silueti — kâsenin iç boşluğuna oturur, tabanı iç alt kenarın altına
 * taşarak kâseyle kaynaşır. Ayrı yapıştırılmış bir klip-art gibi durmaması
 * için taban bilerek boşluğun dışına çıkar.
 *
 * Ölçüler iç boşluğun gerçek genişliğine göre seçildi: y=816'da boşluk yalnız
 * 178 birim geniştir, ilk sürümdeki minareler oraya sığmayıp kâsenin gövdesine
 * gömülüyor ve roket gibi görünüyordu. Siluet boşluğun ALT ÜÇTE BİRİNDE kalır;
 * üstü açık bırakılmazsa kâse dolu bir leke gibi okunuyor.
 *
 * @param {boolean} ayrinti Minare şerefesi ve alem çizilsin mi.
 */
function cami(ayrinti = true) {
  const taban = 816, alt = 846;
  const yollar = [];

  // Kaide — kâsenin iç zeminine oturur ve altına taşar, böylece kaynaşır.
  yollar.push(`M424,806 L608,806 L608,${alt} L424,${alt} Z`);

  // Soğan kubbe
  yollar.push(`M470,${taban} C464,772 482,752 516,724 C550,752 568,772 562,${taban} Z`);

  // Alem gövdesi: hilali kubbeye bağlayan ince sap.
  yollar.push('M512,724 L520,724 L520,706 L512,706 Z');

  // Minareler
  for (const x of [440, 592]) {
    yollar.push(`M${x - 9},${alt} L${x - 9},752 L${x + 9},752 L${x + 9},${alt} Z`);
    if (ayrinti) {
      // Şerefe: minareyi "ok"tan ayıran tek detay.
      yollar.push(`M${x - 15},752 L${x + 15},752 L${x + 15},740 L${x - 15},740 Z`);
      yollar.push(`M${x - 9},740 L${x - 9},722 L${x + 9},722 L${x + 9},740 Z`);
      yollar.push(`M${x - 13},722 L${x},694 L${x + 13},722 Z`);
    } else {
      yollar.push(`M${x - 13},752 L${x},724 L${x + 13},752 Z`);
    }
  }

  return yollar.join(' ');
}

const sar = (...parcalar) => parcalar.join(' ');

/** Büyük boy: 5 + cami + minare + hilal. */
function tamYol() {
  return sar(kase(), govde(), bayrak(), cami(true), hilal());
}

/** Orta boy: cami sadeleşir — şerefe ve alem düşer, siluet kalır. */
function ortaYol() {
  return sar(kase(), govde(), bayrak(), cami(false), hilal());
}

/** Mikro boy: yalnız rakam. 24 pikselde cami detayı çamura dönüşür. */
function mikroYol() {
  return sar(kase(), govde(), bayrak());
}

/** İşareti optik merkeze taşıyan dönüşüm. */
function kaydirma() {
  return `translate(${KAYDIR.x},${KAYDIR.y})`;
}

/**
 * İslami geometrik zemin deseni — sekiz köşeli yıldız (rub'ül hizb) örgüsü.
 * Markanın imzası; ikon, açılış, hero ve widget yüzeylerinde **aynı** desen
 * ailesi kullanılır.
 */
function desen(adim = 176) {
  const yollar = [];
  const kare = (cx, cy, r, don) => {
    const p = [];
    for (let i = 0; i < 4; i++) {
      const a = don + (Math.PI / 2) * i;
      p.push(`${s(cx + r * Math.cos(a))},${s(cy + r * Math.sin(a))}`);
    }
    return `M${p.join('L')}Z`;
  };
  for (let y = -adim; y < BOY + adim; y += adim) {
    for (let x = -adim; x < BOY + adim; x += adim) {
      const cx = x + adim / 2;
      const cy = y + adim / 2;
      yollar.push(kare(cx, cy, adim * 0.40, 0));
      yollar.push(kare(cx, cy, adim * 0.40, Math.PI / 4));
    }
  }
  return yollar.join(' ');
}

module.exports = { BOY, tamYol, ortaYol, mikroYol, desen, kaydirma };
