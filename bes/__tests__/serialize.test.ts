import { siraliKuyrukOlustur } from '@/lib/concurrency/serialize';

/**
 * Kök eşitleyici ile ayarlar/merkez ekranlarının eşzamanlı bildirim
 * eşitlemesi çakışmasın diye eklenen sıralı kuyruk — bkz. `serialize.ts`.
 */
describe('sıralı kuyruk', () => {
  it('işler çakışmadan, art arda çalışır', async () => {
    const kuyruk = siraliKuyrukOlustur();
    let aktif = 0;
    let cakisma = false;
    const sira: string[] = [];

    const is = (ad: string, ms: number) => kuyruk.ekle(async () => {
      aktif += 1;
      if (aktif > 1) cakisma = true;
      sira.push(`${ad}-basla`);
      await new Promise((r) => setTimeout(r, ms));
      sira.push(`${ad}-bitti`);
      aktif -= 1;
    });

    // Üçü de AYNI ANDA tetiklenir — kök eşitleyici + iki ekranın eşzamanlı
    // "yeniden kur" çağrısını taklit eder.
    await Promise.all([is('A', 15), is('B', 5), is('C', 10)]);

    expect(cakisma).toBe(false);
    // Sıraya giriş sırası korunur: A biterek bitmeden B başlamaz.
    expect(sira).toEqual(['A-basla', 'A-bitti', 'B-basla', 'B-bitti', 'C-basla', 'C-bitti']);
  });

  it('bir iş reddederse kuyruk kilitlenmez, sıradaki yine çalışır', async () => {
    const kuyruk = siraliKuyrukOlustur();
    const sonuclar: string[] = [];

    await expect(kuyruk.ekle(async () => { throw new Error('patladı'); })).rejects.toThrow('patladı');

    await kuyruk.ekle(async () => { sonuclar.push('devam etti'); });

    expect(sonuclar).toEqual(['devam etti']);
  });

  it('dönüş değeri çağırana doğru eşlenir', async () => {
    const kuyruk = siraliKuyrukOlustur();
    const [a, b] = await Promise.all([
      kuyruk.ekle(async () => 1),
      kuyruk.ekle(async () => 'iki'),
    ]);
    expect(a).toBe(1);
    expect(b).toBe('iki');
  });
});
