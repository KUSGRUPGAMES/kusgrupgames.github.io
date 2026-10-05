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
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import mobileAds, {
  AdEventType, AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, AppOpenAd, InterstitialAd, MaxAdContentRating,
  RewardedAd, RewardedAdEventType, TestIds,
} from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { create } from 'zustand';
import { logger } from '@/lib/log';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { prayerWindow, scheduleInputFrom } from '@/features/prayer/window';
import { kv } from '@/boot/storage';
import {
  canShowInterstitial, isAdFree, isNavAdExcluded, navInterstitialDue, rewardAdFreeUntil, shouldShowAd,
  shouldShowAppOpen, type AdSurface,
} from './ads';
import { useProStore } from './purchases';

const log = logger('reklam');

/** app.config.ts → `extra.variant`; yalnız mağaza derlemesi 'production'. */
const MAGAZA_DERLEMESI = (Constants.expoConfig?.extra as { variant?: string } | undefined)?.variant === 'production';

/**
 * Geliştirme derlemesi gerçek birim tanımlı olsa bile **her zaman** Google'ın
 * test birimini kullanır: geliştiricinin kendi cihazında gerçek reklam
 * görmesi/tıklaması AdMob'da "geçersiz trafik" sayılır ve hesabın
 * kapatılma sebebidir.
 */
function birim(ios: string | undefined, android: string | undefined, test: string): string | null {
  // Mağaza varyantı (production) dışındaki her derleme test birimi kullanır —
  // Mac'e bağlı olmadan çalışan bağımsız geliştirme derlemesinde `__DEV__`
  // false olur; yalnız ona bakılsaydı geliştiricinin telefonu gerçek reklam
  // isterdi.
  if (__DEV__ || !MAGAZA_DERLEMESI) return test;
  const gercek = Platform.OS === 'ios' ? ios : Platform.OS === 'android' ? android : undefined;
  return gercek ?? null;
}

export const BANNER_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS, process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID, TestIds.BANNER,
);
export const INTERSTITIAL_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS, process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID, TestIds.INTERSTITIAL,
);
export const APP_OPEN_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_APPOPEN_IOS, process.env.EXPO_PUBLIC_ADMOB_APPOPEN_ANDROID, TestIds.APP_OPEN,
);
export const REWARDED_UNIT = birim(
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS, process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID, TestIds.REWARDED,
);

const K_REKLAMSIZ = 'adFreeUntil';
const K_ACILIS = 'appOpenStats';
const sayiVeyaNull = { parse: (r: unknown) => (typeof r === 'number' ? r : null), fallback: null as number | null };
const acilisCodec = {
  parse: (r: unknown) => {
    const o = r as { sessions?: unknown; lastShownAt?: unknown } | null;
    return {
      sessions: typeof o?.sessions === 'number' ? o.sessions : 0,
      lastShownAt: typeof o?.lastShownAt === 'number' ? o.lastShownAt : null,
    };
  },
  fallback: { sessions: 0, lastShownAt: null as number | null },
};

interface AdsState {
  /** SDK başlatıldı ve reklam istenebilir. */
  ready: boolean;
  /**
   * Kullanıcı reklam onayını değiştirebilmeli mi (AB/İngiltere). Google ve
   * GDPR, onayı sonradan değiştirecek bir giriş noktası ister; Ayarlar'daki
   * satır yalnız bu `true` iken görünür.
   */
  privacyOptions: boolean;
  /** Ödüllü reklamla kazanılan reklamsızlığın bitişi (ms); yoksa null. */
  adFreeUntil: number | null;
}

export const useAdsStore = create<AdsState>(() => ({ ready: false, privacyOptions: false, adFreeUntil: null }));

let basladi = false;

/**
 * Onboarding bittikten sonra bir kez çağrılır: izin pencereleri kullanıcıyı
 * ilk açılışta, daha uygulamayı görmeden karşılamasın.
 */
export async function initAds(): Promise<void> {
  if (basladi || Platform.OS === 'web') return;
  basladi = true;
  try {
    // Onay formu alınamazsa (ağ hatası, AdMob'da mesaj yayınlanmamış) bu
    // bir engel değildir: Google'ın son bilinen durumuna bakılır. Formun
    // gerekmediği ülkelerde (ör. Türkiye) `canRequestAds` zaten true döner.
    const onay = await AdsConsent.gatherConsent().catch(async (e: unknown) => {
      log.info('onay formu alınamadı, mevcut durumla devam', { error: e });
      return AdsConsent.getConsentInfo();
    });
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
    const reklamsiz = await kv.read(K_REKLAMSIZ, sayiVeyaNull);
    useAdsStore.setState({ ready: true, adFreeUntil: reklamsiz });
    tamEkranHazirla();
    acilisReklamiKur();
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
  const durum = useAdsStore.getState();
  if (!durum.ready) return false;
  if (isAdFree(durum.adFreeUntil, now.getTime())) return false;
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

// --- Açılış reklamı (App Open): açılışta, en sık 4 saatte bir, ilk 3 açılışta yok

/** Soğuk açılışın ya da arka plandan dönüşün başladığı an. */
let acilisAni = Date.now();
let acilis: AppOpenAd | null = null;
let acilisYuklendi = false;
/** Bu açılış için karar verildi mi (aynı açılışta iki kez denenmez). */
let acilisDenendi = false;
let arkaPlanaGecis: number | null = null;

async function acilisDene(): Promise<void> {
  if (acilisDenendi || !acilis || !acilisYuklendi) return;
  acilisDenendi = true;
  const simdi = Date.now();
  const kayit = await kv.read(K_ACILIS, acilisCodec);
  const goster = shouldShowAppOpen({
    sessions: kayit.sessions, lastShownAt: kayit.lastShownAt, now: simdi,
    sinceLaunchMs: simdi - acilisAni, allowed: adAllowedNow('home', new Date(simdi)),
  });
  if (!goster) return;
  await kv.write(K_ACILIS, { ...kayit, lastShownAt: simdi });
  acilis.show().catch((e: unknown) => log.info('açılış reklamı gösterilemedi', { error: e }));
}

async function yeniAcilis(): Promise<void> {
  acilisAni = Date.now();
  acilisDenendi = false;
  const kayit = await kv.read(K_ACILIS, acilisCodec);
  await kv.write(K_ACILIS, { ...kayit, sessions: kayit.sessions + 1 });
  if (acilisYuklendi) void acilisDene();
}

function acilisReklamiKur(): void {
  if (!APP_OPEN_UNIT || acilis) return;
  acilis = AppOpenAd.createForAdRequest(APP_OPEN_UNIT);
  acilis.addAdEventListener(AdEventType.LOADED, () => { acilisYuklendi = true; void acilisDene(); });
  acilis.addAdEventListener(AdEventType.CLOSED, () => { acilisYuklendi = false; acilis?.load(); });
  acilis.addAdEventListener(AdEventType.ERROR, (e) => { acilisYuklendi = false; log.info('açılış reklamı yüklenemedi', { error: e }); });
  acilis.load();
  void yeniAcilis();
  // Arka planda 30 sn'den uzun kalıp dönmek de yeni bir açılış sayılır.
  AppState.addEventListener('change', (d) => {
    if (d === 'background') arkaPlanaGecis = Date.now();
    if (d === 'active' && arkaPlanaGecis !== null && Date.now() - arkaPlanaGecis > 30_000) {
      arkaPlanaGecis = null;
      void yeniAcilis();
    }
  });
}

// --- Ödüllü reklam: izleyene 4 saat reklamsız

export type OdulSonucu = 'kazanildi' | 'vazgecildi' | 'hata';

/** Kullanıcı kendi isteğiyle başlatır; reklamı sonuna kadar izlerse 4 saat reklam yok. */
export function watchRewardedForAdFree(): Promise<OdulSonucu> {
  return new Promise((resolve) => {
    if (!REWARDED_UNIT || !useAdsStore.getState().ready) { resolve('hata'); return; }
    const reklam = RewardedAd.createForAdRequest(REWARDED_UNIT);
    let kazanildi = false;
    const bitir = (s: OdulSonucu) => { temizle(); resolve(s); };
    const abonelikler = [
      reklam.addAdEventListener(RewardedAdEventType.LOADED, () => {
        reklam.show().catch(() => bitir('hata'));
      }),
      reklam.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        kazanildi = true;
        const bitis = rewardAdFreeUntil(Date.now());
        useAdsStore.setState({ adFreeUntil: bitis });
        void kv.write(K_REKLAMSIZ, bitis);
      }),
      reklam.addAdEventListener(AdEventType.CLOSED, () => bitir(kazanildi ? 'kazanildi' : 'vazgecildi')),
      reklam.addAdEventListener(AdEventType.ERROR, (e) => { log.info('ödüllü reklam yüklenemedi', { error: e }); bitir('hata'); }),
    ];
    const temizle = () => abonelikler.forEach((kaldir) => kaldir());
    reklam.load();
  });
}

// --- Ekran geçişlerinde tam ekran reklam

let gecisSayisi = 0;

/**
 * Kök düzen her yol değişiminde çağırır. 4 geçişte bir, 3 dakikada en çok bir
 * kez; Kur'an okuyucuya girerken asla. Diğer kurallar (Pro, reklamsız süre,
 * vakit penceresi) `maybeShowInterstitial` içinde.
 */
export function noteNavigation(path: string): void {
  gecisSayisi += 1;
  if (isNavAdExcluded(path) || !navInterstitialDue(gecisSayisi)) return;
  const once = sonGosterim;
  maybeShowInterstitial('navigation');
  if (sonGosterim !== once) gecisSayisi = 0;
}
