/**
 * Hazır paylaşım kartları — şartname §62.
 *
 * İki tür içerik var ve karıştırılmaz:
 *
 * 1. **Tebrik mesajları** (cuma, bayram, kandil, Ramazan, gün selamı): bu
 *    uygulama için yazıldı; âyet ya da hadis değildir, öyle sunulmaz. Kartta
 *    künye "Tebrik mesajı" olarak yazılır. Arapça satırlar yalnız yaygın,
 *    anlamı açık kalıplardır (جمعة مباركة, عيد مبارك, رمضان كريم).
 * 2. **Âyet kartları:** metin burada **yazılmaz**, yalnız sure:âyet
 *    referansı durur. Arapça metin Tanzil paketinden, meal Elmalılı
 *    mealinden çalışma anında okunur (`features/share/templates.ts`);
 *    referansların paket içinde var olduğu sınamayla doğrulanır.
 */

export type TemplateCategory = 'friday' | 'eid' | 'kandil' | 'ramadan' | 'verse' | 'daily';

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = ['friday', 'eid', 'kandil', 'ramadan', 'verse', 'daily'];

export type CardTemplate =
  | { id: string; category: TemplateCategory; kind: 'greeting'; eyebrow: string; arabic?: string; body: string }
  | { id: string; category: TemplateCategory; kind: 'verse'; eyebrow: string; surah: number; ayah: number };

export const CARD_TEMPLATES: readonly CardTemplate[] = [
  // --- Cuma
  { id: 'cuma-1', category: 'friday', kind: 'greeting', eyebrow: 'Cuma mesajı', arabic: 'جُمُعَة مُبَارَكَة',
    body: 'Hayırlı cumalar. Dualarınız kabul, gönlünüz huzurlu olsun.' },
  { id: 'cuma-2', category: 'friday', kind: 'greeting', eyebrow: 'Cuma mesajı',
    body: 'Cumanız mübarek olsun. Rabbim bu mübarek günün hürmetine dualarımızı kabul eylesin.' },
  { id: 'cuma-3', category: 'friday', kind: 'greeting', eyebrow: 'Cuma mesajı',
    body: 'Bu mübarek cuma günü sevdiklerinle birlikte huzur ve bereket dolu olsun. Hayırlı cumalar.' },
  { id: 'cuma-ayet', category: 'friday', kind: 'verse', eyebrow: 'Cuma', surah: 62, ayah: 9 },

  // --- Bayram
  { id: 'ramazan-bayrami-1', category: 'eid', kind: 'greeting', eyebrow: 'Ramazan Bayramı', arabic: 'عِيد مُبَارَك',
    body: 'Ramazan Bayramınız mübarek olsun. Tutulan oruçlar, edilen dualar kabul olsun.' },
  { id: 'ramazan-bayrami-2', category: 'eid', kind: 'greeting', eyebrow: 'Ramazan Bayramı',
    body: 'Nice huzurlu, sağlıklı ve bereketli bayramlara. İyi bayramlar.' },
  { id: 'kurban-bayrami-1', category: 'eid', kind: 'greeting', eyebrow: 'Kurban Bayramı', arabic: 'عِيد مُبَارَك',
    body: 'Kurban Bayramınız mübarek olsun. Kesilen kurbanlar, yapılan ibadetler kabul olsun.' },
  { id: 'kurban-bayrami-2', category: 'eid', kind: 'greeting', eyebrow: 'Kurban Bayramı',
    body: 'Paylaştıkça çoğalan bir bayram dileğiyle. İyi bayramlar.' },
  { id: 'kurban-ayet', category: 'eid', kind: 'verse', eyebrow: 'Kurban Bayramı', surah: 108, ayah: 2 },

  // --- Kandil
  { id: 'kandil-1', category: 'kandil', kind: 'greeting', eyebrow: 'Kandil mesajı',
    body: 'Kandiliniz mübarek olsun. Bu gecenin hürmetine dualarınız kabul olsun.' },
  { id: 'kandil-2', category: 'kandil', kind: 'greeting', eyebrow: 'Kandil mesajı',
    body: 'Rahmetin, bereketin ve bağışlanmanın gecesi hayırlara vesile olsun. Hayırlı kandiller.' },
  { id: 'kadir-ayet', category: 'kandil', kind: 'verse', eyebrow: 'Kadir Gecesi', surah: 97, ayah: 3 },

  // --- Ramazan
  { id: 'ramazan-1', category: 'ramadan', kind: 'greeting', eyebrow: 'Ramazan', arabic: 'رَمَضَان كَرِيم',
    body: 'Hoş geldin on bir ayın sultanı. Hayırlı Ramazanlar.' },
  { id: 'ramazan-2', category: 'ramadan', kind: 'greeting', eyebrow: 'Ramazan',
    body: 'Oruçlarınız, sahurlarınız ve iftarlarınız bereketli olsun. Hayırlı Ramazanlar.' },
  { id: 'ramazan-ayet', category: 'ramadan', kind: 'verse', eyebrow: 'Ramazan', surah: 2, ayah: 183 },

  // --- Âyet
  { id: 'ayet-inşirah', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 94, ayah: 5 },
  { id: 'ayet-rad', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 13, ayah: 28 },
  { id: 'ayet-bakara-152', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 2, ayah: 152 },
  { id: 'ayet-bakara-186', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 2, ayah: 186 },
  { id: 'ayet-zumer', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 39, ayah: 53 },
  { id: 'ayet-taha', category: 'verse', kind: 'verse', eyebrow: 'Günün âyeti', surah: 20, ayah: 114 },

  // --- Gün selamı
  { id: 'sabah-1', category: 'daily', kind: 'greeting', eyebrow: 'Hayırlı sabahlar',
    body: 'Güne besmeleyle başla, şükürle bitir. Hayırlı sabahlar.' },
  { id: 'aksam-1', category: 'daily', kind: 'greeting', eyebrow: 'Hayırlı akşamlar',
    body: 'Günün yorgunluğu duayla hafiflesin. Hayırlı akşamlar.' },
  { id: 'dua-1', category: 'daily', kind: 'greeting', eyebrow: 'Dua',
    body: 'Dualarında beni de unutma. Rabbim hepimizin dualarını kabul eylesin.' },
];
