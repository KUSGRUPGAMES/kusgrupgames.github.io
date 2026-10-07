/**
 * Yönetici paneli için yerleşik içerik kataloğu (D36).
 *
 * Panel uygulamaya gömülü dua, bilgi ve kartları listeler; "gizle" ya da
 * "düzenle" (gizle + değiştirilmiş kopya) bu kimliklerle çalışır. İçerik
 * değişince yeniden üretilir:
 *
 *   npx tsx tools/export-catalog.ts ../docs/<panel klasörü>/catalog.json
 */
import { writeFileSync } from 'node:fs';
import { DUAS, DUA_CATEGORIES } from '../src/content/duas';
import { QURAN_DUAS } from '../src/content/quranDuas';
import { KNOWLEDGE, KNOWLEDGE_TOPICS } from '../src/content/knowledge';
import { CARD_TEMPLATES } from '../src/content/cardTemplates';

const hedef = process.argv[2];
// eslint-disable-next-line no-console -- komut satırı aracı
if (!hedef) { console.error('kullanım: npx tsx tools/export-catalog.ts <çıktı.json>'); process.exit(1); }

const katalog = {
  generatedAt: new Date().toISOString(),
  duaCategories: DUA_CATEGORIES,
  knowledgeTopics: KNOWLEDGE_TOPICS,
  duas: [
    ...DUAS.map((d) => ({ id: d.id, category: d.category, title: d.title, body: d.body, kind: 'own' })),
    ...QURAN_DUAS.map((d) => ({ id: d.id, category: d.category, title: d.title, body: '', kind: 'quran', surah: d.surah, ayah: d.ayah, ...(d.to ? { to: d.to } : {}) })),
  ],
  knowledge: KNOWLEDGE.map((k) => ({ id: k.id, topic: k.topic, title: k.title, body: k.body })),
  cards: CARD_TEMPLATES.map((c) => c.kind === 'greeting'
    ? { id: c.id, category: c.category, kind: c.kind, eyebrow: c.eyebrow, body: c.body, ...(c.arabic ? { arabic: c.arabic } : {}) }
    : { id: c.id, category: c.category, kind: c.kind, eyebrow: c.eyebrow, surah: c.surah, ayah: c.ayah }),
};
writeFileSync(hedef, JSON.stringify(katalog));
// eslint-disable-next-line no-console -- komut satırı aracı çıktısı
console.log(`katalog: ${katalog.duas.length} dua, ${katalog.knowledge.length} bilgi, ${katalog.cards.length} kart → ${hedef}`);
