/**
 * Zekât hesabı — şartname §43.
 *
 * Metodoloji **açıkça** yazılır ve arayüzde gösterilir; bir hesap aracı
 * "şu kadar ver" diyorsa neye göre dediğini söylemek zorundadır.
 *
 * Kullanılan ölçüler:
 * - Nisap: 80.18 gram altın **veya** 561 gram gümüş değeri. İkisinden hangisi
 *   kullanılacağı bir tercih meselesidir; gümüş nisabı daha düşük olduğu için
 *   daha çok kişiyi yükümlü kılar. Kullanıcı seçer, varsayılan altındır.
 * - Oran: kırkta bir (yüzde 2,5).
 * - Yükümlülük: borçlar ve temel ihtiyaçlar düşüldükten sonra kalan malın
 *   nisaba ulaşması ve üzerinden bir kamerî yıl geçmesi.
 *
 * Bu hesap bir **tahmindir**, fetva değildir; kendi durumuna özel soruda
 * bir din görevlisine danışılması arayüzde yazılıdır.
 */

export const NISAB_GOLD_GRAMS = 80.18;
export const NISAB_SILVER_GRAMS = 561;
export const ZAKAT_RATE = 0.025;

export type NisabBasis = 'gold' | 'silver';

/** Birim fiyatlar (kullanıcının para biriminde). */
export interface MetalPrices {
  /** Bir gram altın. */
  goldPerGram: number;
  /** Bir gram gümüş. */
  silverPerGram: number;
}

/** Zekâta tabi varlıklar ve düşülecekler (§43). */
export interface ZakatInput {
  /** Nakit ve banka mevduatı. */
  cash: number;
  /** Döviz karşılığı. */
  foreignCurrency: number;
  /** Altın (gram). */
  goldGrams: number;
  /** Gümüş (gram). */
  silverGrams: number;
  /** Hisse, fon ve benzeri yatırımların zekâta tabi kısmı. */
  investments: number;
  /** Ticari mal stoğu. */
  tradeGoods: number;
  /** Tahsili beklenen alacaklar. */
  receivables: number;
  /** Borçlar (düşülür). */
  debts: number;
  /** Temel ihtiyaç ve zorunlu giderler (düşülür). */
  essentialNeeds: number;
}

export const emptyZakatInput: ZakatInput = {
  cash: 0, foreignCurrency: 0, goldGrams: 0, silverGrams: 0,
  investments: 0, tradeGoods: 0, receivables: 0, debts: 0, essentialNeeds: 0,
};

export interface ZakatResult {
  /** Zekâta tabi brüt varlık. */
  grossAssets: number;
  /** Düşülen toplam. */
  deductions: number;
  /** Net zekâta tabi mal. */
  netWealth: number;
  /** Seçili ölçüye göre nisap tutarı. */
  nisabValue: number;
  /** Nisaba ulaşıldı mı. */
  liable: boolean;
  /** Ödenecek tutar (nisaba ulaşılmadıysa 0). */
  zakatDue: number;
  /** Nisaba ne kadar kaldı (ulaşıldıysa 0). */
  remainingToNisab: number;
}

function tutar(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function nisabValue(basis: NisabBasis, prices: MetalPrices): number {
  return basis === 'silver'
    ? NISAB_SILVER_GRAMS * tutar(prices.silverPerGram)
    : NISAB_GOLD_GRAMS * tutar(prices.goldPerGram);
}

export function calculateZakat(
  input: ZakatInput,
  prices: MetalPrices,
  basis: NisabBasis = 'gold',
): ZakatResult {
  const altin = tutar(input.goldGrams) * tutar(prices.goldPerGram);
  const gumus = tutar(input.silverGrams) * tutar(prices.silverPerGram);

  const grossAssets =
    tutar(input.cash) + tutar(input.foreignCurrency) + altin + gumus +
    tutar(input.investments) + tutar(input.tradeGoods) + tutar(input.receivables);

  const deductions = tutar(input.debts) + tutar(input.essentialNeeds);
  const netWealth = Math.max(0, grossAssets - deductions);
  const nisab = nisabValue(basis, prices);
  // Nisap değeri hesaplanamıyorsa (fiyat girilmemiş) yükümlülük iddia edilmez.
  const liable = nisab > 0 && netWealth >= nisab;

  return {
    grossAssets,
    deductions,
    netWealth,
    nisabValue: nisab,
    liable,
    zakatDue: liable ? netWealth * ZAKAT_RATE : 0,
    remainingToNisab: liable || nisab === 0 ? 0 : nisab - netWealth,
  };
}

/** Fitre tahmini: bir kişinin bir günlük yiyecek bedeli (§43, kullanıcı girer). */
export function fitrahTotal(perPerson: number, people: number): number {
  return tutar(perPerson) * Math.max(0, Math.round(people));
}

export const ZAKAT_METHOD_NOTE =
  'Nisap: 80,18 gram altın veya 561 gram gümüş değeri. Oran: kırkta bir (%2,5). ' +
  'Borçlar ve temel ihtiyaçlar düşülür. Bu araç bir tahmin verir, fetva vermez.';
