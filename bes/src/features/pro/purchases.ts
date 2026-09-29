/**
 * Pro abonelik — RevenueCat (D33).
 *
 * RevenueCat App Store ve Google Play makbuzlarını kendisi doğrular; bizim
 * sunucumuz yok. Uygulama yalnız "`pro` hakkı etkin mi" sorusunu sorar.
 *
 * Anahtar derleme sırasında ortam değişkeninden gelir
 * (`EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`). Bu anahtarlar herkese
 * açık istemci anahtarıdır, gizli değildir. Yoksa modül kapalıdır: kimse Pro
 * olmaz, Pro ekranı "henüz hazır değil" der, hiçbir yerde çökme olmaz.
 *
 * Fiyat ve dönem kodda **yazılmaz**; mağazadan gelen yerelleştirilmiş fiyat
 * gösterilir. Kilit hiçbir zaman kandırıcı değildir (§66).
 */
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';
import { logger } from '@/lib/log';

const log = logger('pro');

/** RevenueCat panosundaki hak (entitlement) kimliği. */
export const ENTITLEMENT_ID = 'pro';

const API_KEY = Platform.OS === 'ios'
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
  : Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : undefined;

export const purchasesAvailable = Boolean(API_KEY);

interface ProState {
  pro: boolean;
  /** Mağazadan ilk cevap geldi mi (gelmeden kilit/reklam kararı verilmez). */
  ready: boolean;
}

export const useProStore = create<ProState>(() => ({ pro: false, ready: !purchasesAvailable }));

/** Pro hakkı etkin mi — bütün kilitler ve reklam kararı buna bakar. */
export function usePro(): boolean {
  return useProStore((s) => s.pro);
}

function uygula(info: CustomerInfo): void {
  useProStore.setState({ pro: Boolean(info.entitlements.active[ENTITLEMENT_ID]), ready: true });
}

let kuruldu = false;

/** Açılışta bir kez çağrılır (AppProviders). */
export function initPurchases(): void {
  if (!purchasesAvailable || kuruldu) return;
  kuruldu = true;
  try {
    Purchases.configure({ apiKey: API_KEY as string });
    Purchases.addCustomerInfoUpdateListener(uygula);
    Purchases.getCustomerInfo().then(uygula).catch((e: unknown) => {
      log.warn('abonelik durumu okunamadı', { error: e });
      useProStore.setState({ ready: true });
    });
  } catch (e) {
    log.warn('RevenueCat başlatılamadı', { error: e });
    useProStore.setState({ ready: true });
  }
}

export type PlanKind = 'monthly' | 'annual' | 'lifetime';

export interface Plan {
  kind: PlanKind;
  /** Mağazanın yerelleştirilmiş fiyatı, ör. "₺49,99". */
  price: string;
  pkg: PurchasesPackage;
}

/** Mağazadaki güncel teklif; sıra: yıllık, aylık, ömür boyu. */
export async function loadPlans(): Promise<Plan[]> {
  if (!purchasesAvailable) return [];
  const teklifler = await Purchases.getOfferings();
  const t = teklifler.current;
  if (!t) return [];
  const out: Plan[] = [];
  if (t.annual) out.push({ kind: 'annual', price: t.annual.product.priceString, pkg: t.annual });
  if (t.monthly) out.push({ kind: 'monthly', price: t.monthly.product.priceString, pkg: t.monthly });
  if (t.lifetime) out.push({ kind: 'lifetime', price: t.lifetime.product.priceString, pkg: t.lifetime });
  return out;
}

export type PurchaseResult = 'ok' | 'cancelled' | 'error';

export async function buyPlan(plan: Plan): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    uygula(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'ok' : 'error';
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    log.warn('satın alma başarısız', { error: e });
    return 'error';
  }
}

/** "Satın alımları geri yükle" — App Review bunu zorunlu tutar. */
export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable) return false;
  try {
    const info = await Purchases.restorePurchases();
    uygula(info);
    return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
  } catch (e) {
    log.warn('geri yükleme başarısız', { error: e });
    return false;
  }
}
