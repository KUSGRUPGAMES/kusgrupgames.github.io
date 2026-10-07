import { ezanBildirimKarari } from '@/features/ezan/presentation';

describe('ezanBildirimKarari', () => {
  it('ön planda, ezanlı ve ezan açıksa uygulama içinde çalar, sistem sesi susar', () => {
    expect(ezanBildirimKarari(true, true, true)).toEqual({
      uygulamaIcindeCal: true,
      sistemSesiCalsin: false,
    });
  });

  it('arka plandaysa (ekran kilitli) ezanlı olsa bile sistem sesi çalmalı — kök neden buydu', () => {
    expect(ezanBildirimKarari(true, true, false)).toEqual({
      uygulamaIcindeCal: false,
      sistemSesiCalsin: true,
    });
  });

  it('"uygulama açıkken: kapalı" ise ön planda ezan da bildirim ezan sesi de çalmaz; arka planda çalar', () => {
    expect(ezanBildirimKarari(true, false, true)).toEqual({
      uygulamaIcindeCal: false,
      sistemSesiCalsin: false,
    });
    expect(ezanBildirimKarari(true, false, false)).toEqual({
      uygulamaIcindeCal: false,
      sistemSesiCalsin: true,
    });
  });

  it('ezanlı olmayan bir bildirim her koşulda kendi (sistem) sesini kullanır', () => {
    expect(ezanBildirimKarari(false, true, true)).toEqual({
      uygulamaIcindeCal: false,
      sistemSesiCalsin: true,
    });
    expect(ezanBildirimKarari(false, true, false)).toEqual({
      uygulamaIcindeCal: false,
      sistemSesiCalsin: true,
    });
  });
});
