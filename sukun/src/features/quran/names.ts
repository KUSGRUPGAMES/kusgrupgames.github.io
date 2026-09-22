/**
 * Sure adının dile göre karşılığı.
 *
 * Veri dosyasında her sure için üç ad var: `nameTr` (Türkçe okunuş, "Fâtiha"),
 * `nameAr` (Arapça yazım, "الفاتحة") ve `nameEn` (anlam, "The Opening").
 * Ekranlar hepsinde `nameTr` kullanıyordu: arayüz Arapçayken bile sure başlığı
 * "Fâtiha" yazıyordu, Arapça okuyan biri için bu yanlış.
 *
 * Kural basit ve **uydurmaya kapalı**:
 *
 * - Arapça arayüzde `nameAr` — veri dosyasında zaten var (Tanzil).
 * - Diğer dillerde `nameTr`. İngilizce/Almanca/Fransızca için Latin harfli
 *   bir *okunuş* (transliterasyon) verimizde yok; `nameEn` ad değil anlamdır
 *   ("The Opening"), başlık yerine geçmez. 114 sure için okunuş uydurmak
 *   CONTENT_SOURCES kuralı 1'e aykırı olurdu (dinî içerik doğrulanmış
 *   kaynaktan gelir). Doğrulanmış bir okunuş listesi eklendiğinde buraya
 *   bir satır olarak girer.
 */
import { useI18n } from '@/lib/i18n';

export interface SurahNames {
  nameTr: string;
  nameAr: string;
}

/** Ekranda gösterilecek sure adı. */
export function useSurahName(): (sure: SurahNames | undefined, fallback?: string) => string {
  const { language } = useI18n();
  return (sure, fallback = '') => {
    if (!sure) return fallback;
    return language === 'ar' ? sure.nameAr : sure.nameTr;
  };
}
