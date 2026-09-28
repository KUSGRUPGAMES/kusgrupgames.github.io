/**
 * Uzaktan içerik — D31 devamı (0002 migration).
 *
 * Yönetici panelinden eklenen duyuru, ek dua, bilgi yazısı ve hazır kart
 * içeriği. Uygulamanın **çekirdek** içeriği (namaz vakti mantığı, âyet/meal,
 * mevcut hazır kart kataloğu) hâlâ yerelde ve paket içinde — bu yalnız bir
 * EK katman, topluluk açıkken görünür. Sunucu yoksa/topluluk kapalıysa boş
 * liste döner, hiçbir yerde çökme olmaz.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from './client';

export type ContentType = 'announcement' | 'dua' | 'info_article' | 'share_card';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  extra: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
}

interface Row {
  id: string; type: string; title: string; body: string; extra: Record<string, unknown> | null;
  sort_order: number; created_at: string;
}

function fromRow(r: Row): ContentItem {
  return {
    id: r.id, type: r.type as ContentType, title: r.title, body: r.body,
    extra: r.extra ?? {}, sortOrder: r.sort_order, createdAt: r.created_at,
  };
}

export function useContentItems(type: ContentType, locale: string, enabled: boolean) {
  return useQuery({
    queryKey: ['content-items', type, locale],
    enabled: Boolean(supabase) && enabled,
    queryFn: async (): Promise<ContentItem[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('content_items')
        .select('*').eq('type', type).eq('locale', locale).eq('is_published', true)
        .order('sort_order').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(fromRow);
    },
  });
}
