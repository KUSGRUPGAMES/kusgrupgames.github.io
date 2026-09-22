/**
 * Dua metinleri — şartname §24, §39.
 *
 * İçerik durumu: bu metinler **bu uygulama için Türkçe yazıldı**. Hadis ya da
 * âyet alıntısı değildir ve öyle sunulmaz; bir kaynağa dayandırılmaz, çünkü
 * dayanmıyorlar. Me'sûr (kaynaklı) dualar ayrı bir katmanda, lisans geldikten
 * sonra eklenecek ve her biri kaynağıyla birlikte gösterilecektir
 * (CONTENT_SOURCES kuralı 2 ve 3, ⛔B3).
 */

export type DuaCategory =
  | 'sabah' | 'aksam' | 'yemek' | 'yolculuk' | 'uyku' | 'hastalik'
  | 'sikinti' | 'sukur' | 'rizik' | 'ilim' | 'aile' | 'tovbe'
  | 'korunma' | 'vefat';

export const DUA_CATEGORIES: readonly { id: DuaCategory; label: string }[] = [
  { id: 'sabah', label: 'Sabah' },
  { id: 'aksam', label: 'Akşam' },
  { id: 'yemek', label: 'Yemek' },
  { id: 'yolculuk', label: 'Yolculuk' },
  { id: 'uyku', label: 'Uyku' },
  { id: 'hastalik', label: 'Hastalık ve şifa' },
  { id: 'sikinti', label: 'Sıkıntı ve kaygı' },
  { id: 'sukur', label: 'Şükür' },
  { id: 'rizik', label: 'Rızık ve bereket' },
  { id: 'ilim', label: 'İlim ve çalışma' },
  { id: 'aile', label: 'Aile ve çocuk' },
  { id: 'tovbe', label: 'Tövbe ve bağışlanma' },
  { id: 'korunma', label: 'Korunma' },
  { id: 'vefat', label: 'Vefat ve taziye' },
];

export interface Dua {
  id: string;
  category: DuaCategory;
  title: string;
  /** Türkçe dua metni — bu uygulama için yazıldı. */
  body: string;
}

export const DUAS: readonly Dua[] = [
  { id: 'sabah-1', category: 'sabah', title: 'Güne başlarken', body: 'Rabbim, bu güne senin adınla başlıyorum. Bugün söyleyeceğim sözü doğru, tutacağım işi hayırlı, kalbimi temiz eyle. Gücümün yetmediği yerde bana sabır, yettiği yerde insaf ver.' },
  { id: 'sabah-2', category: 'sabah', title: 'Niyet', body: 'Rabbim, bugün yapacaklarımı gösteriş için değil, senin rızan için yapmayı nasip et. İşimi kolaylaştır, niyetimi düzelt.' },
  { id: 'sabah-3', category: 'sabah', title: 'Kalbin genişliği', body: 'Rabbim, göğsümü genişlet; kırgınlığı, kıskançlığı ve öfkeyi kalbimden uzak tut. Bugün karşılaştığım herkese güzel davranmayı bana kolaylaştır.' },

  { id: 'aksam-1', category: 'aksam', title: 'Günü kapatırken', body: 'Rabbim, bu günü senin verdiğin güçle geçirdim. Yaptığım iyiliği kabul et, hatamı bağışla, eksiğimi tamamla. Yarına daha olgun bir kalple uyanmayı nasip et.' },
  { id: 'aksam-2', category: 'aksam', title: 'Hesaplaşma', body: 'Rabbim, bugün kimseyi incitmediysem şükürler olsun; incittiysem bana fark ettir ve helalleşmeyi nasip et.' },
  { id: 'aksam-3', category: 'aksam', title: 'Şükür ile bitir', body: 'Rabbim, sıkıntısını bilmediğim nice nimetin içinde akşama erdim. Verdiklerini görmeyi, verdiklerinle yetinmeyi bana öğret.' },

  { id: 'yemek-1', category: 'yemek', title: 'Sofra başında', body: 'Rabbim, bu rızkı bereketli kıl. Bunu hazırlayan ellere, yetiştiren emeğe, taşıyan yola hayır ver. Bugün sofrası olmayanları da doyur.' },
  { id: 'yemek-2', category: 'yemek', title: 'Yemekten sonra', body: 'Rabbim, doyurdun ve esirgedin. Bu bedeni sana kulluk için güçlü kıl; yediklerimi israfa değil, hayra dönüştür.' },

  { id: 'yolculuk-1', category: 'yolculuk', title: 'Yola çıkarken', body: 'Rabbim, yolumu aç, yükümü hafiflet. Gittiğim yerde hayırla karşıla, döndüğümde sevdiklerime esenlikle kavuştur.' },
  { id: 'yolculuk-2', category: 'yolculuk', title: 'Uzun yolda', body: 'Rabbim, mesafeyi bana kısalt, yorgunluğumu dinlendir. Yol arkadaşımı ve yoldaki herkesi kazadan beladan koru.' },

  { id: 'uyku-1', category: 'uyku', title: 'Yatarken', body: 'Rabbim, bedenimi de zihnimi de sana emanet ediyorum. Bugünün yükünü üzerimden al, yarına dinlenmiş uyandır. Uykumu bana rahmet kıl.' },
  { id: 'uyku-2', category: 'uyku', title: 'Uyku tutmayınca', body: 'Rabbim, kafamda dönüp duran düşünceleri sakinleştir. Çözemediğim işi sana bırakıyorum; bana teslimiyetin huzurunu ver.' },

  { id: 'hastalik-1', category: 'hastalik', title: 'Hasta iken', body: 'Rabbim, şifa senden. Bu hastalığı benim için arınma kıl, ağrımı hafiflet, sabrımı artır. Beni tedavi eden ellere de bereket ver.' },
  { id: 'hastalik-2', category: 'hastalik', title: 'Hasta için', body: 'Rabbim, hastamıza acil şifa ver. Gecesini rahat, gündüzünü umutlu kıl. Yanında bekleyenlere de güç ver.' },
  { id: 'hastalik-3', category: 'hastalik', title: 'Uzun süren hastalıkta', body: 'Rabbim, bu yolun sonunu hayır eyle. Ümitsizliğe düşürme, şikâyeti dilimden, isyanı kalbimden uzak tut.' },

  { id: 'sikinti-1', category: 'sikinti', title: 'Daralınca', body: 'Rabbim, içim daraldı; genişliği senden istiyorum. Bu sıkıntının geçeceğini bana hatırlat, geçene kadar da beni ayakta tut.' },
  { id: 'sikinti-2', category: 'sikinti', title: 'Kaygı anında', body: 'Rabbim, olmamış şeyin korkusunu üzerimden al. Elimden geleni yapmayı, gerisini sana bırakmayı nasip et.' },
  { id: 'sikinti-3', category: 'sikinti', title: 'Yalnızlıkta', body: 'Rabbim, kimsesiz değilim; sen varsın. Kalbimdeki boşluğu zikrinle doldur, bana hayırlı dostlar nasip et.' },

  { id: 'sukur-1', category: 'sukur', title: 'İyi bir haber üzerine', body: 'Rabbim, sevindirdin. Bu sevinci şımarıklığa değil şükre çevir; payı olanları da unutturma.' },
  { id: 'sukur-2', category: 'sukur', title: 'Sağlık için', body: 'Rabbim, yürüyebiliyorum, görebiliyorum, konuşabiliyorum. Farkında olmadığım bu nimetlerin kıymetini bana bildir.' },

  { id: 'rizik-1', category: 'rizik', title: 'Rızık için', body: 'Rabbim, helal rızık ver; azını bereketli, çoğunu hayırlı kıl. Kimseye muhtaç etme, kimseyi de bana muhtaç bırakma.' },
  { id: 'rizik-2', category: 'rizik', title: 'İş ararken', body: 'Rabbim, emeğimi karşılıksız bırakma. Bana hayırlı bir kapı aç; beklerken ümidimi, bulunca insafımı koru.' },
  { id: 'rizik-3', category: 'rizik', title: 'Borçluyken', body: 'Rabbim, borcumu ödemeyi nasip et. Alacaklıyı sabırlı, beni gayretli kıl; kimsenin hakkını üzerimde bırakma.' },

  { id: 'ilim-1', category: 'ilim', title: 'Çalışmaya başlarken', body: 'Rabbim, anlamamı kolaylaştır, öğrendiğimi unutturma. Bildiğimi kibirle değil, fayda ile taşımayı nasip et.' },
  { id: 'ilim-2', category: 'ilim', title: 'Sınav öncesi', body: 'Rabbim, zihnimi açık, kalbimi sakin kıl. Emeğimin karşılığını ver; sonuç ne olursa olsun bana ders eyle.' },

  { id: 'aile-1', category: 'aile', title: 'Aile için', body: 'Rabbim, evimize huzur ver. Birbirimizin kusurunu örtmeyi, güzelini görmeyi bize öğret. Kapımızdan bereketi eksik etme.' },
  { id: 'aile-2', category: 'aile', title: 'Çocuk için', body: 'Rabbim, çocuğumuzu hayırlı, sağlıklı ve merhametli kıl. Onu iyi insanların arasında büyüt; bize de ona iyi örnek olmayı nasip et.' },
  { id: 'aile-3', category: 'aile', title: 'Anne baba için', body: 'Rabbim, beni büyütenlere iyilikle davranmayı nasip et. Yaşlandıklarında sabrımı, ihtiyaç duyduklarında imkânımı artır.' },

  { id: 'tovbe-1', category: 'tovbe', title: 'Hata sonrası', body: 'Rabbim, yanlış yaptığımı biliyorum. Bahane üretmeden dönüyorum; beni bağışla ve aynı hataya bir daha düşürme.' },
  { id: 'tovbe-2', category: 'tovbe', title: 'Kalbi yumuşatmak için', body: 'Rabbim, katılaşan kalbimi yumuşat. Kusurumu görmeyi, başkasının kusurunu örtmeyi bana nasip et.' },

  { id: 'korunma-1', category: 'korunma', title: 'Kötülükten korunma', body: 'Rabbim, bildiğim ve bilmediğim her kötülükten sana sığınırım. Beni de sevdiklerimi de kazadan, beladan, zalimin elinden koru.' },
  { id: 'korunma-2', category: 'korunma', title: 'Dilimi korumak için', body: 'Rabbim, söylemeden önce düşünmeyi nasip et. Dilimi gıybetten, yalandan ve kırıcı sözden koru.' },

  { id: 'vefat-1', category: 'vefat', title: 'Vefat edenin ardından', body: 'Rabbim, ayrıldığımız kulunu rahmetinle karşıla. Kabrini genişlet, hesabını kolaylaştır. Geride kalanlara sabır ver.' },
  { id: 'vefat-2', category: 'vefat', title: 'Taziyede', body: 'Rabbim, acıyı hafiflet. Bu evden umudu eksiltme; kalanları birbirine dayanak kıl.' },
];

export const DUA_SOURCE_NOTE = 'Bu dua metinleri bu uygulama için yazılmıştır; âyet veya hadis alıntısı değildir.';
