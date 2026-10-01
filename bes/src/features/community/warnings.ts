/**
 * Yönetici uyarıları (D36): panelden, genelde bir şikâyet üzerine yazılır.
 * Kullanıcı Topluluk sekmesinde görür, "Okudum" deyince kapanır.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';

export interface UserWarning { id: number; message: string; createdAt: string }

export function useMyWarnings(userId: string | null) {
  return useQuery({
    queryKey: ['my-warnings', userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<UserWarning[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase.from('user_warnings')
        .select('id,message,created_at').eq('user_id', userId).is('seen_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as { id: number; message: string; created_at: string }[])
        .map((w) => ({ id: w.id, message: w.message, createdAt: w.created_at }));
    },
  });
}

export function useAckWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!supabase) return;
      const { error } = await supabase.from('user_warnings').update({ seen_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['my-warnings'] }); },
  });
}
