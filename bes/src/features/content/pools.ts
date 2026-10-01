/**
 * Yerleşik + panel içeriği birleşik havuzlar (D36). Kurallar `remote.ts`te.
 */
import { KNOWLEDGE, KNOWLEDGE_TOPICS, type KnowledgeItem, type KnowledgeTopic } from '@/content/knowledge';
import { CARD_TEMPLATES, type CardTemplate } from '@/content/cardTemplates';
import { hiddenTargets, ofType, useRemoteContent, versePool, type RemoteItem } from './remote';

const KONULAR = new Set<string>(KNOWLEDGE_TOPICS.map((k) => k.id));

export function remoteKnowledge(r: RemoteItem): KnowledgeItem | null {
  if (!r.title.trim() || !r.body.trim()) return null;
  const konu = (typeof r.extra.topic === 'string' && KONULAR.has(r.extra.topic) ? r.extra.topic : 'kavram') as KnowledgeTopic;
  return { id: `r-${r.id}`, topic: konu, title: r.title, body: r.body };
}

export function knowledgeFrom(items: readonly RemoteItem[]): KnowledgeItem[] {
  const gizli = hiddenTargets(items);
  return [
    ...KNOWLEDGE.filter((k) => !gizli.has(`knowledge:${k.id}`)),
    ...ofType(items, 'knowledge').map(remoteKnowledge).filter((k): k is KnowledgeItem => k !== null),
  ];
}

export function allKnowledge(): KnowledgeItem[] {
  return knowledgeFrom(useRemoteContent.getState().items);
}

export function useAllKnowledge(): KnowledgeItem[] {
  const items = useRemoteContent((s) => s.items);
  return knowledgeFrom(items);
}

export function cardTemplatesFrom(items: readonly RemoteItem[]): readonly CardTemplate[] {
  const gizli = hiddenTargets(items);
  return gizli.size ? CARD_TEMPLATES.filter((c) => !gizli.has(`card:${c.id}`)) : CARD_TEMPLATES;
}

export function useCardTemplates(): readonly CardTemplate[] {
  const items = useRemoteContent((s) => s.items);
  return cardTemplatesFrom(items);
}

export function currentVersePool(): { surah: number; ayah: number }[] {
  return versePool(useRemoteContent.getState().items);
}

export function useVersePool(): { surah: number; ayah: number }[] {
  const items = useRemoteContent((s) => s.items);
  return versePool(items);
}

export function useRemoteOfType(type: RemoteItem['type']): RemoteItem[] {
  const items = useRemoteContent((s) => s.items);
  return ofType(items, type);
}
