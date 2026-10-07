/**
 * Web karşılığı: AdMob yalnız iOS/Android'de var. Web hedefi yalnız ekran
 * taraması için (`npm run preview`); orada reklam çizilmez.
 */
import { create } from 'zustand';
import type { AdSurface } from './ads';

export const BANNER_UNIT: string | null = null;
export const INTERSTITIAL_UNIT: string | null = null;
export const useAdsStore = create<{ ready: boolean; privacyOptions: boolean; adFreeUntil: number | null }>(() => ({ ready: false, privacyOptions: false, adFreeUntil: null }));
export const APP_OPEN_UNIT: string | null = null;
export const REWARDED_UNIT: string | null = null;
export type OdulSonucu = 'kazanildi' | 'vazgecildi' | 'hata';
export async function watchRewardedForAdFree(): Promise<OdulSonucu> { return 'hata'; }
export async function showAdPrivacyOptions(): Promise<void> { /* web: reklam yok */ }
export async function initAds(): Promise<void> { /* web: reklam yok */ }
export function adAllowedNow(_surface: AdSurface): boolean { return false; }
export function maybeShowInterstitial(_surface: AdSurface): void { /* web: reklam yok */ }
export function noteNavigation(_path: string): void { /* web: reklam yok */ }
