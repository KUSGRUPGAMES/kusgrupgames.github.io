/**
 * Yasaklı kelime ön denetimi — D31.
 *
 * Bu, yalnız **hızlı geri bildirim** içindir (kullanıcı ağa hiç gitmeden
 * anında kırmızı hata görür). Gerçek, atlanamaz denetim sunucudadır:
 * `supabase/migrations/0002_moderation_admin_content.sql`'deki
 * `contains_banned_word()` — kelime listesi orada `banned_words`
 * tablosunda tutulur ve yönetici panelinden büyür. Buradaki liste kısa,
 * sabit ve yalnız bariz olanları yakalar; sunucudaki liste genişleyebilir.
 */

const TEMEL_LISTE = [
  'amk', 'aq', 'orospu', 'piç', 'yavşak', 'göt', 'siktir', 'sikeyim', 'ibne',
  'amcık', 'yarrak', 'kahpe', 'şerefsiz', 'gavat',
] as const;

function kelimeSiniri(kelime: string): RegExp {
  return new RegExp(`(^|[^a-zçğıöşü])${kelime}($|[^a-zçğıöşü])`, 'i');
}

export function containsBannedWord(metin: string, ekstraListe: readonly string[] = []): boolean {
  const normal = metin.toLocaleLowerCase('tr');
  return [...TEMEL_LISTE, ...ekstraListe].some((k) => kelimeSiniri(k).test(normal));
}
