import { globalSearch, parseAyahReference, type GlobalSearchDeps, type SurahIndexEntry } from '@/features/search/global';

const sureler: SurahIndexEntry[] = [
  { number: 1, nameTr: 'Fâtiha', nameAr: 'الفاتحة', ayahCount: 7 },
  { number: 2, nameTr: 'Bakara', nameAr: 'البقرة', ayahCount: 286 },
  { number: 18, nameTr: 'Kehf', nameAr: 'الكهف', ayahCount: 110 },
  { number: 112, nameTr: 'İhlâs', nameAr: 'الاخلاص', ayahCount: 4 },
];

const deps: GlobalSearchDeps = {
  surahs: sureler,
  searchAyahs: (_q, limit) => [{ surah: 2, ayah: 255, surahName: 'Bakara' }].slice(0, limit),
  searchTranslations: (q, limit) =>
    (q.includes('sab') ? [{ surah: 2, ayah: 153, surahName: 'Bakara', body: 'sabır ve namazla yardım isteyin' }] : [])
      .slice(0, limit),
};

describe('âyet başvurusu çözümü', () => {
  it('sayısal biçimler çözülür', () => {
    expect(parseAyahReference('2:255', sureler)).toEqual({ surah: 2, ayah: 255 });
    expect(parseAyahReference('2/255', sureler)).toEqual({ surah: 2, ayah: 255 });
    expect(parseAyahReference('2 255', sureler)).toEqual({ surah: 2, ayah: 255 });
  });

  it('sure adıyla verilen başvuru çözülür', () => {
    expect(parseAyahReference('bakara 255', sureler)).toEqual({ surah: 2, ayah: 255 });
    expect(parseAyahReference('KEHF 10', sureler)).toEqual({ surah: 18, ayah: 10 });
    expect(parseAyahReference('ihlas 3', sureler)).toEqual({ surah: 112, ayah: 3 });
  });

  it('sure dışı âyet numarası kabul edilmez', () => {
    expect(parseAyahReference('112:99', sureler)).toBeNull();
    expect(parseAyahReference('ihlas 99', sureler)).toBeNull();
    expect(parseAyahReference('999:1', sureler)).toBeNull();
  });

  it('başvuru olmayan metin null döner', () => {
    expect(parseAyahReference('sabır', sureler)).toBeNull();
    expect(parseAyahReference('', sureler)).toBeNull();
  });
});

describe('global arama', () => {
  it('kısa sorgu sonuç vermez', () => {
    expect(globalSearch('a', deps)).toEqual([]);
    expect(globalSearch('', deps)).toEqual([]);
  });

  it('âyet başvurusu her zaman en üstte', () => {
    const r = globalSearch('2:255', deps);
    expect(r[0]?.kind).toBe('ayahRef');
    expect(r[0]?.href).toBe('/reader?surah=2&ayah=255');
  });

  it('sure adı bulunur ve okuyucuya yönlendirir', () => {
    const r = globalSearch('kehf', deps);
    expect(r[0]?.kind).toBe('surah');
    expect(r[0]?.href).toBe('/reader?surah=18&ayah=1');
  });

  it('Türkçe şapkasız yazım sureyi bulur', () => {
    expect(globalSearch('ihlas', deps).some((x) => x.title.includes('İhlâs'))).toBe(true);
    expect(globalSearch('FATIHA', deps).some((x) => x.title.includes('Fâtiha'))).toBe(true);
  });

  it('esmâ anlamından da bulunur', () => {
    const r = globalSearch('bağışlayan', deps);
    expect(r.some((x) => x.kind === 'name')).toBe(true);
  });

  it('dua ve bilgi maddesi bulunur', () => {
    expect(globalSearch('yolculuk', deps).some((x) => x.kind === 'dua')).toBe(true);
    expect(globalSearch('nisap', deps).some((x) => x.kind === 'knowledge')).toBe(true);
  });

  it('Arapça sorgu mushaf metninde aranır', () => {
    const r = globalSearch('الله', deps);
    expect(r.some((x) => x.kind === 'ayahText')).toBe(true);
  });

  it('Latin sorgu mushaf metnini taramaz — boşuna iş yapılmaz', () => {
    let cagrildi = false;
    const izleyen: GlobalSearchDeps = {
      surahs: sureler,
      searchAyahs: (q, l) => { cagrildi = true; return deps.searchAyahs(q, l); },
    };
    globalSearch('sabır', izleyen);
    expect(cagrildi).toBe(false);
  });

  it('sonuçlar puana göre sıralıdır', () => {
    const r = globalSearch('bakara 255', deps);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1]!.score).toBeGreaterThanOrEqual(r[i]!.score);
    }
  });

  it('sonuç sayısı sınırlanır', () => {
    expect(globalSearch('aل', deps, 3).length).toBeLessThanOrEqual(3);
  });

  it('meal araması Latin sorguda çalışır', () => {
    const r = globalSearch('sabır', deps);
    expect(r.some((x) => x.kind === 'translation')).toBe(true);
  });

  it('Arapça sorguda meal taranmaz', () => {
    let cagrildi = false;
    const izleyen: GlobalSearchDeps = {
      ...deps,
      searchTranslations: (q, l) => { cagrildi = true; return deps.searchTranslations!(q, l); },
    };
    globalSearch('\u0627\u0644\u0644\u0647', izleyen);
    expect(cagrildi).toBe(false);
  });

  it('eşleşmeyen sorgu boş döner', () => {
    expect(globalSearch('zzzzqqqq', deps)).toEqual([]);
  });
});
