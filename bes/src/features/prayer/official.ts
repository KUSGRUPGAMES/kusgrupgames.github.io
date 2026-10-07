/**
 * Diyanet'in resmî ilçe vakitleri (5 Ekim). Saf kayıt defteri: çizelge
 * (`schedule.ts`) eşzamanlı çalıştığı için resmî vakitler bellekte tutulur;
 * indirme ve saklama `officialRuntime.ts`te.
 *
 * Neden: cihazdaki astronomik hesap Diyanet'in "temkin" paylarını bilmiyordu;
 * Ankara'da akşam 7–8 dk erken, güneş 7 dk geç, öğle/ikindi 5 dk erken
 * çıkıyordu (kullanıcı fark etti). Türkiye'de vakit Diyanet'in ilânıdır; ilçe
 * için ilan edilen vakit varsa o kullanılır, yoksa temkinli hesap.
 */
import { create } from 'zustand';

/** [imsak, güneş, öğle, ikindi, akşam, yatsı] "HH:MM". */
export type OfficialTimes = readonly [string, string, string, string, string, string];

interface State {
  /** ilçe kimliği → 'YYYY-MM-DD' → vakitler */
  byId: Record<string, Record<string, OfficialTimes>>;
  version: number;
}

export const useOfficialStore = create<State>(() => ({ byId: {}, version: 0 }));

export const dateKeyOf = (y: number, m0: number, d: number) =>
  `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function officialDay(id: string, y: number, m0: number, d: number): OfficialTimes | null {
  return useOfficialStore.getState().byId[id]?.[dateKeyOf(y, m0, d)] ?? null;
}

/** "HH:MM" → ondalık saat. */
export function hm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

/** Yeni günleri ekler; 40 günden eskileri atar. */
export function mergeOfficial(id: string, days: Record<string, OfficialTimes>, today: string): void {
  useOfficialStore.setState((s) => {
    const birlesik = { ...(s.byId[id] ?? {}), ...days };
    const sinir = new Date(Date.parse(`${today}T00:00:00Z`) - 3 * 86400000).toISOString().slice(0, 10);
    for (const k of Object.keys(birlesik)) if (k < sinir) delete birlesik[k];
    return { byId: { ...s.byId, [id]: birlesik }, version: s.version + 1 };
  });
}
