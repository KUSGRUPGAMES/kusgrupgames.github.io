import { DIVINE_NAMES, DIVINE_NAME_COUNT } from '@/content/names';
import { DUAS, DUA_CATEGORIES } from '@/content/duas';
import { KNOWLEDGE, KNOWLEDGE_TOPICS } from '@/content/knowledge';

describe('içerik bütünlüğü', () => {
  it('Esmâ listesi tam 99 isimdir — lafza-i celâl listede yoktur', () => {
    expect(DIVINE_NAMES).toHaveLength(DIVINE_NAME_COUNT);
    expect(DIVINE_NAME_COUNT).toBe(99);
    expect(DIVINE_NAMES.some((n) => n.transliteration.trim() === 'Allah')).toBe(false);
  });

  it('Esmâ sıra numaraları 1..99 aralığında ve eksiksizdir', () => {
    expect(DIVINE_NAMES.map((n) => n.ordinal)).toEqual(
      Array.from({ length: 99 }, (_, i) => i + 1),
    );
  });

  it('her ismin okunuşu ve anlamı doludur', () => {
    for (const n of DIVINE_NAMES) {
      expect({ o: n.ordinal, ok: n.transliteration.trim().length > 1 }).toEqual({ o: n.ordinal, ok: true });
      expect({ o: n.ordinal, ok: n.meaning.trim().length > 3 }).toEqual({ o: n.ordinal, ok: true });
    }
  });

  it('Arapça yazım bilerek boştur — doğrulanmamış metin gösterilmez', () => {
    expect(DIVINE_NAMES.every((n) => n.nameAr === undefined)).toBe(true);
  });

  it('dua kimlikleri tekildir ve kategorileri tanımlıdır', () => {
    expect(new Set(DUAS.map((d) => d.id)).size).toBe(DUAS.length);
    const tanimli = new Set(DUA_CATEGORIES.map((c) => c.id));
    for (const d of DUAS) {
      expect({ id: d.id, ok: tanimli.has(d.category) }).toEqual({ id: d.id, ok: true });
    }
  });

  it('her dua kategorisinde en az bir dua vardır', () => {
    for (const c of DUA_CATEGORIES) {
      const adet = DUAS.filter((d) => d.category === c.id).length;
      expect({ kategori: c.id, bos: adet === 0 }).toEqual({ kategori: c.id, bos: false });
    }
  });

  it('dua metinleri yeterince uzundur ve tırnakla alıntı iddiası taşımaz', () => {
    for (const d of DUAS) {
      expect({ id: d.id, uzun: d.body.trim().length > 40 }).toEqual({ id: d.id, uzun: true });
      // Tırnak içinde verilen metin, alıntı izlenimi yaratır; bu metinler
      // alıntı değil (CONTENT_SOURCES kuralı 2).
      expect({ id: d.id, tirnak: /["“”]/.test(d.body) }).toEqual({ id: d.id, tirnak: false });
    }
  });

  it('bilgi maddeleri tekildir, konuları tanımlıdır ve doludur', () => {
    expect(new Set(KNOWLEDGE.map((k) => k.id)).size).toBe(KNOWLEDGE.length);
    const tanimli = new Set(KNOWLEDGE_TOPICS.map((c) => c.id));
    for (const k of KNOWLEDGE) {
      expect({ id: k.id, ok: tanimli.has(k.topic) }).toEqual({ id: k.id, ok: true });
      expect({ id: k.id, uzun: k.body.trim().length > 80 }).toEqual({ id: k.id, uzun: true });
    }
  });

  it('her bilgi konusunda en az iki madde vardır', () => {
    for (const c of KNOWLEDGE_TOPICS) {
      const adet = KNOWLEDGE.filter((k) => k.topic === c.id).length;
      expect({ konu: c.id, adet: adet >= 2 }).toEqual({ konu: c.id, adet: true });
    }
  });

  it('içerik hüküm/fetva dili kullanmaz', () => {
    const yasakli = /\b(haramdır|helaldir|farzdır diye hükmed|caiz değildir|günahtır)\b/i;
    for (const k of KNOWLEDGE) {
      expect({ id: k.id, hukum: yasakli.test(k.body) }).toEqual({ id: k.id, hukum: false });
    }
    for (const d of DUAS) {
      expect({ id: d.id, hukum: yasakli.test(d.body) }).toEqual({ id: d.id, hukum: false });
    }
  });
});
