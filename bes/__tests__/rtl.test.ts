/**
 * Cihazda görülen hata: aynı oturumda Türkçe → Arapça → Türkçe geçişinde
 * `forceRTL(false)` hiç yazılmıyor, arayüz sonraki her açılışta Türkçe
 * seçiliyken sağdan sola kalıyordu. Bu sınama o boşluğu kapatır.
 */
const i18n = { isRTL: false, allowRTL: jest.fn(), forceRTL: jest.fn() };
jest.mock('react-native', () => ({ I18nManager: i18n }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyUiDirection } = require('@/lib/i18n/rtl') as typeof import('@/lib/i18n/rtl');

beforeEach(() => {
  i18n.allowRTL.mockClear();
  i18n.forceRTL.mockClear();
});

describe('yön köprüsü', () => {
  it('oturum yönü zaten istenen yöndeyken bile kalıcı ayarı yazar', () => {
    i18n.isRTL = false;
    applyUiDirection('ar');
    // Aynı oturumda geri Türkçeye: isRTL hâlâ false, yine de diske yazılmalı.
    expect(applyUiDirection('tr')).toBe(false);
    expect(i18n.forceRTL).toHaveBeenLastCalledWith(false);
    expect(i18n.allowRTL).toHaveBeenLastCalledWith(false);
  });

  it('takılı kalmış RTL oturumunda Türkçe yeniden yükleme ister', () => {
    i18n.isRTL = true;
    expect(applyUiDirection('tr')).toBe(true);
    expect(i18n.forceRTL).toHaveBeenLastCalledWith(false);
  });

  it('Arapça seçilince RTL yazılır ve yeniden yükleme istenir', () => {
    i18n.isRTL = false;
    expect(applyUiDirection('ar')).toBe(true);
    expect(i18n.forceRTL).toHaveBeenLastCalledWith(true);
  });

  it('Almanca ve Fransızca da soldan sağa yazılır', () => {
    i18n.isRTL = true;
    for (const lang of ['de', 'fr', 'en'] as const) {
      expect(applyUiDirection(lang)).toBe(true);
      expect(i18n.forceRTL).toHaveBeenLastCalledWith(false);
    }
  });
});
