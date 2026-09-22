import {
  calculateZakat, nisabValue, fitrahTotal, emptyZakatInput,
  NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, ZAKAT_RATE,
  type MetalPrices,
} from '@/features/zakat/calc';

const fiyat: MetalPrices = { goldPerGram: 4000, silverPerGram: 45 };

describe('zekât hesabı', () => {
  it('nisap altın ve gümüş ölçüsüne göre ayrı hesaplanır', () => {
    expect(nisabValue('gold', fiyat)).toBeCloseTo(NISAB_GOLD_GRAMS * 4000, 6);
    expect(nisabValue('silver', fiyat)).toBeCloseTo(NISAB_SILVER_GRAMS * 45, 6);
  });

  it('gümüş nisabı altından düşüktür — daha çok kişiyi yükümlü kılar', () => {
    expect(nisabValue('silver', fiyat)).toBeLessThan(nisabValue('gold', fiyat));
  });

  it('boş girdide yükümlülük yoktur', () => {
    const r = calculateZakat(emptyZakatInput, fiyat);
    expect(r.netWealth).toBe(0);
    expect(r.liable).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it('nisabın altında kalınca zekât çıkmaz ve kalan tutar bildirilir', () => {
    const r = calculateZakat({ ...emptyZakatInput, cash: 100_000 }, fiyat);
    expect(r.liable).toBe(false);
    expect(r.zakatDue).toBe(0);
    expect(r.remainingToNisab).toBeCloseTo(nisabValue('gold', fiyat) - 100_000, 6);
  });

  it('nisabı aşınca kırkta bir hesaplanır', () => {
    const r = calculateZakat({ ...emptyZakatInput, cash: 1_000_000 }, fiyat);
    expect(r.liable).toBe(true);
    expect(r.zakatDue).toBeCloseTo(1_000_000 * ZAKAT_RATE, 6);
    expect(r.remainingToNisab).toBe(0);
  });

  it('tam nisap sınırında yükümlülük başlar', () => {
    const nisab = nisabValue('gold', fiyat);
    expect(calculateZakat({ ...emptyZakatInput, cash: nisab }, fiyat).liable).toBe(true);
    expect(calculateZakat({ ...emptyZakatInput, cash: nisab - 1 }, fiyat).liable).toBe(false);
  });

  it('altın ve gümüş gramdan değere çevrilir', () => {
    const r = calculateZakat({ ...emptyZakatInput, goldGrams: 100, silverGrams: 1000 }, fiyat);
    expect(r.grossAssets).toBeCloseTo(100 * 4000 + 1000 * 45, 6);
  });

  it('borç ve temel ihtiyaç düşülür', () => {
    const r = calculateZakat(
      { ...emptyZakatInput, cash: 1_000_000, debts: 300_000, essentialNeeds: 200_000 },
      fiyat,
    );
    expect(r.deductions).toBe(500_000);
    expect(r.netWealth).toBe(500_000);
    expect(r.zakatDue).toBeCloseTo(12_500, 6);
  });

  it('borç varlıktan büyükse net sıfırdır, eksi çıkmaz', () => {
    const r = calculateZakat({ ...emptyZakatInput, cash: 1000, debts: 50_000 }, fiyat);
    expect(r.netWealth).toBe(0);
    expect(r.zakatDue).toBe(0);
  });

  it('negatif ve geçersiz girdiler sıfır sayılır', () => {
    const r = calculateZakat(
      { ...emptyZakatInput, cash: -500, goldGrams: Number.NaN, investments: Infinity },
      fiyat,
    );
    expect(r.grossAssets).toBe(0);
  });

  it('metal fiyatı girilmemişse yükümlülük iddia edilmez', () => {
    const r = calculateZakat({ ...emptyZakatInput, cash: 10_000_000 }, { goldPerGram: 0, silverPerGram: 0 });
    expect(r.nisabValue).toBe(0);
    expect(r.liable).toBe(false);
    expect(r.zakatDue).toBe(0);
    expect(r.remainingToNisab).toBe(0);
  });

  it('gümüş ölçüsüyle daha düşük malda da yükümlülük çıkabilir', () => {
    const mal = { ...emptyZakatInput, cash: 100_000 };
    expect(calculateZakat(mal, fiyat, 'gold').liable).toBe(false);
    expect(calculateZakat(mal, fiyat, 'silver').liable).toBe(true);
  });

  it('bütün varlık kalemleri toplama girer', () => {
    const r = calculateZakat({
      ...emptyZakatInput,
      cash: 1, foreignCurrency: 2, investments: 4, tradeGoods: 8, receivables: 16,
    }, fiyat);
    expect(r.grossAssets).toBe(31);
  });

  it('fitre kişi sayısıyla çarpılır ve negatif kabul etmez', () => {
    expect(fitrahTotal(150, 4)).toBe(600);
    expect(fitrahTotal(150, -2)).toBe(0);
    expect(fitrahTotal(-150, 4)).toBe(0);
  });
});
