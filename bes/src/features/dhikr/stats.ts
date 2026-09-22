/**
 * Zikir istatistiği — şartname §38.
 *
 * Kural: gün sınırı **kullanıcının konumunun** takvim gününe göre çizilir,
 * cihazın UTC'sine göre değil. Aksi hâlde yatsıdan sonra çekilen zikir
 * "yarına" yazılır ve kullanıcı seri kaybeder.
 */

export interface DhikrSession {
  id: string;
  title: string;
  count: number;
  target: number;
  /** Konumun takvim günü, 'YYYY-MM-DD'. */
  onDate: string;
  createdAt: number;
}

export interface PeriodStats {
  total: number;
  sessionCount: number;
  days: number;
  average: number;
  /** En çok çekilen zikir. */
  topTitle: string | null;
}

/** 'YYYY-MM-DD' — yerel takvim gününden üretilir. */
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

/** İki gün anahtarı arasındaki fark (gün). */
export function daysBetween(a: string, b: string): number | null {
  const x = parseDateKey(a);
  const y = parseDateKey(b);
  if (!x || !y) return null;
  return Math.round(
    (Date.UTC(y.year, y.month, y.day) - Date.UTC(x.year, x.month, x.day)) / 86400000,
  );
}

/** Son N günü kapsayan oturumlar (bugün dahil). */
export function withinDays(sessions: readonly DhikrSession[], today: string, days: number): DhikrSession[] {
  return sessions.filter((s) => {
    const fark = daysBetween(s.onDate, today);
    return fark !== null && fark >= 0 && fark < days;
  });
}

export function summarize(sessions: readonly DhikrSession[]): PeriodStats {
  const total = sessions.reduce((t, s) => t + Math.max(0, s.count), 0);
  const gunler = new Set(sessions.map((s) => s.onDate));
  const basliklar = new Map<string, number>();
  for (const s of sessions) {
    basliklar.set(s.title, (basliklar.get(s.title) ?? 0) + Math.max(0, s.count));
  }
  let topTitle: string | null = null;
  let enCok = 0;
  for (const [ad, adet] of basliklar) {
    if (adet > enCok) { enCok = adet; topTitle = ad; }
  }
  const days = gunler.size;
  return {
    total,
    sessionCount: sessions.length,
    days,
    average: days > 0 ? Math.round(total / days) : 0,
    topTitle,
  };
}

/**
 * Kesintisiz gün serisi: bugünden geriye doğru, zikir çekilen ardışık günler.
 * Bugün henüz çekilmediyse seri **kırılmış sayılmaz**; dünden geriye bakılır.
 */
export function currentStreak(sessions: readonly DhikrSession[], today: string): number {
  const gunler = new Set(sessions.map((s) => s.onDate));
  if (gunler.size === 0) return 0;
  const bugunVar = gunler.has(today);
  let seri = 0;
  const bas = parseDateKey(today);
  if (!bas) return 0;
  for (let i = bugunVar ? 0 : 1; i < 400; i++) {
    const d = new Date(Date.UTC(bas.year, bas.month, bas.day - i));
    const k = dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    if (!gunler.has(k)) break;
    seri++;
  }
  return seri;
}

/** Günlük toplamlar — grafik için, eskiden yeniye. */
export function dailyTotals(sessions: readonly DhikrSession[], today: string, days: number): { date: string; total: number }[] {
  const bas = parseDateKey(today);
  if (!bas) return [];
  const harita = new Map<string, number>();
  for (const s of sessions) {
    harita.set(s.onDate, (harita.get(s.onDate) ?? 0) + Math.max(0, s.count));
  }
  const out: { date: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(bas.year, bas.month, bas.day - i));
    const k = dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    out.push({ date: k, total: harita.get(k) ?? 0 });
  }
  return out;
}
