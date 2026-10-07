/**
 * Pro erişimi — kim Pro özelliklerini kullanabilir (1 Ekim kararı). Saf, sınanır.
 *
 * Üç yol:
 * - **purchased**: satın almış (RevenueCat yetkisi). Reklamsızlık YALNIZ bu.
 * - **launch**: satış henüz açık değil (banka/ücretli uygulama sözleşmesi
 *   bekleniyor, 1.0). Pro özellikleri herkese ücretsiz, rozetle işaretli.
 * - **trial**: satış açıldıktan sonra (1.0.1) giriş yapan kullanıcıya bir kez
 *   14 gün. Deneme saati satış açılınca başlar — açılmadan başlasaydı süre
 *   bitip satın alma düğmesi olmadan kilitlenirdi. Reklam devam eder.
 *
 * Kilitlenen yalnız Pro özellikleridir (Öğren 4. ünite ve sonrası, topluluk
 * ek hakları). İbadet kayıtları hiçbir zaman Pro değildir (ALWAYS_FREE).
 */
export const PRO_TRIAL_DAYS = 14;

export type AccessReason = 'purchased' | 'launch' | 'trial' | 'none';

export interface AccessInput {
  purchased: boolean;
  salesEnabled: boolean;
  /** Sunucudaki deneme bitişi (ms); deneme hiç başlamadıysa null. */
  trialEndsAt: number | null;
  now: number;
}

export interface Access {
  has: boolean;
  reason: AccessReason;
  /** Deneme sürüyorsa kalan gün (yukarı yuvarlanır). */
  trialDaysLeft: number | null;
  /** Deneme bir kez kullanıldı ve bitti mi. */
  trialUsed: boolean;
}

export function proAccess({ purchased, salesEnabled, trialEndsAt, now }: AccessInput): Access {
  const denemeSuruyor = trialEndsAt !== null && trialEndsAt > now;
  const kalan = denemeSuruyor ? Math.ceil((trialEndsAt - now) / 86400000) : null;
  const trialUsed = trialEndsAt !== null && trialEndsAt <= now;
  if (purchased) return { has: true, reason: 'purchased', trialDaysLeft: null, trialUsed };
  if (!salesEnabled) return { has: true, reason: 'launch', trialDaysLeft: null, trialUsed };
  if (denemeSuruyor) return { has: true, reason: 'trial', trialDaysLeft: kalan, trialUsed: false };
  return { has: false, reason: 'none', trialDaysLeft: null, trialUsed };
}
