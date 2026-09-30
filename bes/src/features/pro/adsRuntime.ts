/**
 * Reklam çalışma zamanı — AdMob (D33). Kurallar `ads.ts`'te (saf, sınanır);
 * bu dosya yalnız SDK'yı kurar ve o kuralları uygular.
 *
 * Açılış sırası (Google ve Apple'ın istediği):
 * 1. AB/İngiltere kullanıcısına Google'ın onay formu (UMP). Onay yoksa ve
 *    reklam istenemiyorsa (`canRequestAds` false) hiç reklam yok.
 * 2. iOS'ta izleme izni (ATT). Reddedilirse SDK reklam kimliğini kullanmaz;
 *    kişiselleştirilmemiş reklam gelir.
 * 3. İçerik derecesi G, sonra SDK başlatılır.
 *
 * Reklam birimi kimlikleri derleme ortamından gelir. Geliştirmede her zaman
 * Google'ın test birimleri kullanılır; mağaza derlemesinde gerçek birim yoksa
 * hiç reklam gösterilmez (test reklamı yayına çıkmaz).
 */
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType, AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, InterstitialAd, MaxAdContentRating, TestIds,
} from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { create } from 'zustand';
import { logger } from '@/lib/log';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { prayerWindow, scheduleInputFrom } from '@/features/prayer/window';
import { canShowInterstitial, shouldShowAd, type AdSurface } from './ads';
import { useProStore } from './purchases';

const log = logger('reklam');

/**
 * Geliştirme derlemesi gerçek birim tanımlı olsa bile **her zaman** Google'ın
 * test birimini kullanır: geliştiricinin kendi cihazında gerçek reklam
 * görmesi/tıklaması AdMob'da "geçersiz trafik" sayılır ve hesabın
 * kapatılma sebebidir.
 */
function birim(ios: string | undefined, android: string | undefined, test: string): string | null {
  if (__DEV__) return test;
  const gercek = Platform.OS === 'ios' ? ios : Platform.OS === 'android' ? android : undefined;
  return gercek ?? null;
}

export const BANNER_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS, process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID, TestIds.BANNER,
);
export const INTERSTITIAL_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS, process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID, TestIds.INTERSTITIAL,
);

interface AdsState {
  /** SDK başlatıldı ve reklam istenebilir. */
  ready: boolean;
  /**
   * Kullanıcı reklam onayını değiştirebilmeli mi (AB/İngiltere). Google ve
   * GDPR, onayı sonradan değiştirecek bir giriş noktası ister; Ayarlar'daki
   * satır yalnız bu `true` iken görünür.
   */
  privacyOptions: boolean;
}

export const useAdsStore = create<AdsState>(() => ({ ready: false, privacyOptions: false }));

let basladi = false;

/**
 * Onboarding bittikten sonra bir kez çağrılır: izin pencereleri kullanıcıyı
 * ilk açılışta, daha uygulamayı görmeden karşılamasın.
 */
export async function initAds(): Promise<void> {
  if (basladi || Platform.OS === 'web') return;
  basladi = true;
  try {
    const onay = await AdsConsent.gatherConsent();
    useAdsStore.setState({
      privacyOptions: onay.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    });
    if (!onay.canRequestAds) { log.info('reklam onayı yok'); return; }
    if (Platform.OS === 'ios') await requestTrackingPermissionsAsync();
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    useAdsStore.setState({ ready: true });
    tamEkranHazirla();
  } catch (e) {
    log.warn('reklam başlatılamadı', { error: e });
  }
}

/** Google'ın onay formunu yeniden açar (Ayarlar → Reklam gizlilik seçenekleri). */
export async function showAdPrivacyOptions(): Promise<void> {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    log.warn('reklam gizlilik seçenekleri açılamadı', { error: e });
  }
}

/** Şu an, bu yüzeyde reklam gösterilebilir mi — `ads.ts` kurallarıyla. */
export function adAllowedNow(surface: AdSurface, now: Date = new Date()): boolean {
  if (!useAdsStore.getState().ready) return false;
  const pro = useProStore.getState();
  if (!pro.ready) return false;
  const konum = useLocationStore.getState().active();
  const ayar = useSettingsStore.getState().settings;
  const pencere = prayerWindow(konum ? scheduleInputFrom(konum, ayar) : null, now);
  return shouldShowAd({ surface, pro: pro.pro, ...pencere }).show;
}

// --- Tam ekran reklam
let tamEkran: InterstitialAd | null = null;
let yuklendi = false;
let sonGosterim: number | null = null;

function tamEkranHazirla(): void {
  if (!INTERSTITIAL_UNIT || tamEkran) return;
  tamEkran = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT);
  tamEkran.addAdEventListener(AdEventType.LOADED, () => { yuklendi = true; });
  tamEkran.addAdEventListener(AdEventType.CLOSED, () => { yuklendi = false; tamEkran?.load(); });
  tamEkran.addAdEventListener(AdEventType.ERROR, (e) => { yuklendi = false; log.info('tam ekran yüklenemedi', { error: e }); });
  tamEkran.load();
}

/**
 * Doğal bir duraklamada (ders bitti, kart paylaşıldı) çağrılır. Kurallardan
 * biri engellerse sessizce hiçbir şey yapmaz; kullanıcıyı asla bekletmez.
 */
export function maybeShowInterstitial(surface: AdSurface): void {
  const simdi = Date.now();
  if (!tamEkran || !yuklendi) return;
  if (!adAllowedNow(surface, new Date(simdi))) return;
  if (!canShowInterstitial(sonGosterim, simdi)) return;
  sonGosterim = simdi;
  tamEkran.show().catch((e: unknown) => log.info('tam ekran gösterilemedi', { error: e }));
}
