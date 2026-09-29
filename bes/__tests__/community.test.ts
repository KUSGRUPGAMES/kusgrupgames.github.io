import { validDuaBody, MAX_DUA_BODY, DUA_CATEGORIES } from '@/features/community/duaBoard';
import { validMessageBody, MAX_MESSAGE_BODY } from '@/features/community/chat';
import { computeProgress, JUZ_COUNT, type JuzClaim } from '@/features/community/khatmCircles';
import { isValidNickname, suggestNickname } from '@/features/community/nickname';
import { communityAvailable } from '@/features/community/client';

describe('topluluk — dua panosu', () => {
  it('boş metni reddeder', () => {
    expect(validDuaBody('')).toBe(false);
    expect(validDuaBody('   ')).toBe(false);
  });
  it('sınır içindeki metni kabul eder', () => {
    expect(validDuaBody('Annem için şifa duası istiyorum.')).toBe(true);
  });
  it(`${MAX_DUA_BODY} karakteri aşan metni reddeder`, () => {
    expect(validDuaBody('a'.repeat(MAX_DUA_BODY + 1))).toBe(false);
    expect(validDuaBody('a'.repeat(MAX_DUA_BODY))).toBe(true);
  });
  it('kategori listesi genel bir seçenek içerir', () => {
    expect(DUA_CATEGORIES).toContain('genel');
    expect(DUA_CATEGORIES.length).toBeGreaterThanOrEqual(4);
  });
});

describe('topluluk — sohbet', () => {
  it('boş mesajı reddeder', () => {
    expect(validMessageBody('')).toBe(false);
  });
  it(`${MAX_MESSAGE_BODY} karakteri aşan mesajı reddeder`, () => {
    expect(validMessageBody('a'.repeat(MAX_MESSAGE_BODY + 1))).toBe(false);
    expect(validMessageBody('selam')).toBe(true);
  });
});

describe('topluluk — hatim grupları', () => {
  function bosGrup(): JuzClaim[] {
    return Array.from({ length: JUZ_COUNT }, (_, i) => ({
      circleId: 'c1', juzNo: i + 1, claimedBy: null, claimedNickname: null, completed: false, completedAt: null,
    }));
  }

  it('boş grupta hiç alınmamış/tamamlanmamış sayar', () => {
    const p = computeProgress(bosGrup());
    expect(p).toEqual({ claimed: 0, completed: 0, total: 30 });
  });

  it('alınan ve tamamlanan cüzleri doğru sayar', () => {
    const claims = bosGrup().map((c) => {
      if (c.juzNo === 1) return { ...c, claimedBy: 'u1', completed: true };
      if (c.juzNo === 2) return { ...c, claimedBy: 'u2', completed: false };
      return c;
    });
    const p = computeProgress(claims);
    expect(p).toEqual({ claimed: 2, completed: 1, total: 30 });
  });

  it('30 cüzün tamamı tamamlanınca tam sayar', () => {
    const claims = bosGrup().map((c) => ({ ...c, claimedBy: 'u1', completed: true }));
    expect(computeProgress(claims)).toEqual({ claimed: 30, completed: 30, total: 30 });
  });
});

describe('topluluk — takma ad', () => {
  it('çok kısa/uzun adı geçersiz sayar', () => {
    expect(isValidNickname('a')).toBe(false);
    expect(isValidNickname('a'.repeat(25))).toBe(false);
    expect(isValidNickname('Sabırlı Yolcu')).toBe(true);
  });

  it('aynı tohum aynı öneriyi üretir (kararlı)', () => {
    const a = suggestNickname('kullanici-123');
    const b = suggestNickname('kullanici-123');
    expect(a).toBe(b);
    expect(isValidNickname(a)).toBe(true);
  });

  it('farklı tohumlar genelde farklı öneriler üretir', () => {
    const a = suggestNickname('kullanici-1');
    const b = suggestNickname('kullanici-2');
    expect(a).not.toBe(b);
  });
});

describe('topluluk — sunucu yapılandırması', () => {
  it('test ortamında sunucu anahtarları yoktur, modül kapalı görünür', () => {
    // Test ortamında EXPO_PUBLIC_SUPABASE_* tanımlı değildir; bu, modülün
    // "yapılandırılmamışsa sessizce kapalı kalır" davranışının kanıtıdır —
    // supabase istemcisi çökmeden `null`e düşer.
    expect(communityAvailable).toBe(false);
  });
});

/**
 * Google/Apple girişi (D32). Bu kurallar mağaza reddi sebebidir ve hiçbiri
 * web önizlemesinde görünmez; o yüzden kaynak metne bağlandı.
 */
describe('topluluk — giriş ve hesap silme', () => {
  const { readFileSync } = jest.requireActual<typeof import('node:fs')>('node:fs');
  const { join } = jest.requireActual<typeof import('node:path')>('node:path');
  const oku = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

  it('hesap silme işlevi yalnız çağıranın kendi hesabını siler', () => {
    const sql = oku('supabase/migrations/0003_account_deletion.sql');
    // Parametresiz: başka bir kullanıcının kimliği verilemez.
    expect(sql).toMatch(/function public\.delete_my_account\(\)/);
    expect(sql).toMatch(/delete from auth\.users where id = uid/);
    expect(sql).toMatch(/uid uuid := auth\.uid\(\)/);
    // Anonim rol çağıramaz, yalnız girişli kullanıcı.
    expect(sql).toMatch(/revoke all on function public\.delete_my_account\(\) from public, anon/);
    expect(sql).toMatch(/grant execute on function public\.delete_my_account\(\) to authenticated/);
  });

  it('hesap ekranı silmeyi sunuyor (App Review 5.1.1(v))', () => {
    const ekran = oku('app/account.tsx');
    expect(ekran).toContain('hesabiSil');
    expect(ekran).toContain("t('auth.deleteAccount')");
  });

  it('onboarding girişi zorunlu kılmıyor — giriş adımı atlanabilir', () => {
    const ekran = oku('app/onboarding.tsx');
    // "Geç" düğmesi konum adımından sonra bitişe kadar her adımda var;
    // giriş adımı bu aralıkta kalmalı.
    expect(ekran).toMatch(/adim > 2 && adim < TOPLAM/);
    expect(ekran).toMatch(/const GIRIS_ADIMI = communityAvailable \? 5 : -1;/);
    expect(ekran).toMatch(/const TOPLAM = communityAvailable \? 6 : 5;/);
  });

  it('iOS\'ta Apple girişi açık (App Review 4.8) ve anonim giriş kaldırıldı', () => {
    expect(oku('app.config.ts')).toMatch(/usesAppleSignIn: true/);
    expect(oku('src/features/community/session.ts')).not.toMatch(/signInAnonymously\(/);
  });
});
