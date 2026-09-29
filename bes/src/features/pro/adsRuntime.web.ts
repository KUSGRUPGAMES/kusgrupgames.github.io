/**
 * Web karşılığı: AdMob yalnız iOS/Android'de var. Web hedefi yalnız ekran
 * taraması için (`npm run preview`); orada reklam çizilmez.
 */
import { create } from 'zustand';
import type { AdSurface } from './ads';

export const BANNER_UNIT: string | null = null;
export const INTERSTITIAL_UNIT: string | null = null;
export const useAdsStore = create<{ ready: boolean; privacyOptions: boolean }>(() => ({ ready: false, privacyOptions: false }));
export async function showAdPrivacyOptions(): Promise<void> { /* web: reklam yok */ }
export async function initAds(): Promise<void> { /* web: reklam yok */ }
export function adAllowedNow(_surface: AdSurface): boolean { return false; }
export function maybeShowInterstitial(_surface: AdSurface): void { /* web: reklam yok */ }
