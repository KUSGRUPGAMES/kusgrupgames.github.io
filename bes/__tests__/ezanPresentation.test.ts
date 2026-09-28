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

  it('ezan ayarı kapalıysa ön planda olsa bile uygulama içinde çalmaz', () => {
    expect(ezanBildirimKarari(true, false, true)).toEqual({
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
