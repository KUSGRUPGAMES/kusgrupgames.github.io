/**
 * Uygulama kabuğu — şartname §5, §61, §79, §82, §83.
 *
 * Sıralama önemlidir: hata sınırı en dışta durur ki sağlayıcılardan biri
 * patlarsa bile kullanıcı anlamlı bir ekran görsün.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Localization from 'expo-localization';
import { ThemeProvider, type ThemeMode } from '@/theme/ThemeProvider';
import { I18nProvider, useT, resolveLanguage, type Language } from '@/lib/i18n';
import { FONT_ASSETS } from '@/lib/i18n/fonts';
import { applyUiDirection } from '@/lib/i18n/rtl';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { configureLogging } from '@/lib/log';
import { recordCrash, configureCrashReporter } from '@/lib/crash/reporter';
import { KEYS } from '@/lib/storage';
import { hydrateAll } from './persistence';
import { kv } from './storage';
import { Brand } from '@/config/brand';
import { useNotificationSync } from '@/features/notifications/useNotificationSync';
import { EzanOkuyucu } from '@/features/ezan/EzanOkuyucu';
import { useWidgetSync } from '@/features/widget/useWidgetSync';
import Constants from 'expo-constants';
import { reloadAppAsync } from 'expo';
import { palette } from '@/theme/tokens';
import splashLogo from '../../assets/splash-icon.png';
import splashLogoLight from '../../assets/brand/splash-icon-light.png';

// Üretimde debug/info günlüğe yazılmaz (§83).
configureLogging({ minLevel: __DEV__ ? 'debug' : 'warn' });

// Çökme kayıtları cihazda tutulur; kalıcılık hidrasyonda bağlanır.
configureCrashReporter({});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Çevrimdışı öncelikli ürün: eldeki veri bayat da olsa gösterilir (§76).
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const themeModeCodec = {
  parse: (raw: unknown): ThemeMode => {
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    throw new Error('geçersiz tema');
  },
  fallback: 'system' as ThemeMode,
};

const sayiCodec = {
  parse: (raw: unknown): number => (typeof raw === 'number' && Number.isFinite(raw) ? raw : 0),
  fallback: 0,
};

const languageCodec = {
  parse: (raw: unknown): Language => resolveLanguage(typeof raw === 'string' ? raw : null),
  fallback: null as Language | null,
};

interface BootValue {
  onboardingDone: boolean;
  /**
   * Onboarding bitince çağrılır. Yalnız diske yazmak (`markOnboardingDone`)
   * yetmiyordu: `(tabs)/_layout.tsx`'teki kapı bu context'teki değere
   * bakıyor, o da açılışta bir kez okunup hiç güncellenmiyordu — kullanıcı
   * "Bitir"e bastığında diskteki değer `true` olsa bile kapı hâlâ eski
   * `false`'u görüp onboarding'e geri atıyordu.
   */
  completeOnboarding: () => void;
}
const BootContext = createContext<BootValue>({ onboardingDone: true, completeOnboarding: () => {} });

export function useBoot(): BootValue {
  return useContext(BootContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // `useFonts` hatayı ayrı döndürür (`[loaded, error]`); yalnız `loaded`
  // alınırsa yükleme başarısız olduğunda `loaded` **sonsuza dek** `false`
  // kalır ve aşağıdaki geçit uygulamayı temelli kilitler — hiçbir hata
  // görünmeden. Arapça süsleme fontları dekoratiftir, ibadetin kendisi
  // değildir; yüklenemezse uygulama yine de açılmalı.
  const [fontsLoaded, fontsError] = useFonts(FONT_ASSETS);
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [language, setLanguage] = useState<Language | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);

  useEffect(() => {
    if (fontsError) recordCrash(fontsError, { phase: 'font-load' });
  }, [fontsError]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mode, lang, boot] = await Promise.all([
          kv.read(KEYS.themeMode, themeModeCodec),
          kv.read(KEYS.language, languageCodec),
          hydrateAll(),
        ]);
        if (!alive) return;
        // Yön uzlaştırması: kalıcı ayar dilden bağımsız kalmışsa (bkz.
        // rtl.ts) burada düzeltilir ve uygulama bir kez yeniden yüklenir.
        const etkinDil = lang ?? resolveLanguage(Localization.getLocales()[0]?.languageTag ?? null);
        if (applyUiDirection(etkinDil)) {
          const son = await kv.read(KEYS.directionReloadAt, sayiCodec);
          // Döngü koruması: bir dakika içinde ikinci kez yeniden yüklenmez.
          if (Date.now() - son > 60_000) {
            await kv.write(KEYS.directionReloadAt, Date.now());
            await reloadAppAsync('ui-direction');
            return;
          }
        }
        setThemeMode(mode);
        setLanguage(lang);
        setOnboardingDone(boot.onboardingDone);
      } catch (error) {
        // Aynı kilitlenme sınıfı: `hydrateAll()` içindeki herhangi bir
        // mağaza `.hydrate()` çağrısı fırlatırsa `ready` hiç `true`
        // olmuyordu, uygulama kalıcı olarak açılış ekranında kalıyordu.
        // Şimdi varsayılanlarla devam ediyor, hatayı cihazda kaydediyor.
        if (!alive) return;
        recordCrash(error instanceof Error ? error : new Error(String(error)), { phase: 'boot-hydrate' });
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const completeOnboarding = useCallback(() => setOnboardingDone(true), []);

  const saveThemeMode = useCallback((mode: ThemeMode) => { void kv.write(KEYS.themeMode, mode); }, []);
  const saveLanguage = useCallback((lang: Language) => {
    // Arapçaya (ya da Arapçadan) geçişte düzen aynalanır; React Native bunu
    // ancak yeniden yüklemeyle uygular. Kullanıcıdan uygulamayı kapatıp
    // açması beklenmez: dil kaydedilir, uygulama kendini yeniden yükler.
    const yeniden = applyUiDirection(lang);
    void kv.write(KEYS.language, lang).then(async () => {
      if (!yeniden) return;
      await kv.write(KEYS.directionReloadAt, Date.now());
      await reloadAppAsync('ui-direction');
    });
  }, []);

  // Tercihler okunmadan çizmek, temanın açıktan koyuya sıçramasına yol açar.
  // Font adımı yalnız `fontsError` set olmadan bekler — hata varsa (yukarıda
  // kaydedildi) burada sonsuza dek beklemek yerine devam edilir.
  if (!ready || (!fontsLoaded && !fontsError)) return <StartupScreen />;

  const deviceTag = Localization.getLocales()[0]?.languageTag ?? null;

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode={themeMode} onModeChange={saveThemeMode}>
        <I18nProvider
          {...(language ? { initialLanguage: language } : {})}
          deviceTag={deviceTag}
          onLanguageChange={saveLanguage}
        >
          <AppErrorBoundary>
            <BootContext.Provider value={{ onboardingDone, completeOnboarding }}>
              <QueryClientProvider client={queryClient}>
                <BildirimEsitleyici />
                {children}
                <EzanOkuyucu />
              </QueryClientProvider>
            </BootContext.Provider>
          </AppErrorBoundary>
        </I18nProvider>
      </ThemeProvider>
      <AcilisPerdesi />
    </SafeAreaProvider>
  );
}

/**
 * Açılış ekranı — yerel açılış ekranının (app.config.ts, expo-splash-screen)
 * **birebir devamı**: aynı düz zemin rengi, aynı logo, aynı boyut ve konum.
 * Eskiden burada gradyan ve desen vardı; yerel ekrandan buraya geçerken zemin
 * ve logo bir anda değişiyordu. Uygulama hazır olunca bu katman yumuşakça
 * solar (`AcilisPerdesi`).
 */
function StartupScreen() {
  const dark = useColorScheme() === 'dark';
  return (
    <View pointerEvents="none" style={[{ flex: 1, backgroundColor: dark ? palette.emerald900 : palette.ivory100,
      justifyContent: 'center', alignItems: 'center' }]}>
      <Image source={dark ? splashLogo : splashLogoLight} resizeMode="contain" style={{ width: 200, height: 200 }} />
    </View>
  );
}

/** Uygulama çizildikten sonra açılış ekranını 280 ms'de soldurur. */
function AcilisPerdesi() {
  const [bitti, setBitti] = useState(false);
  const [saydamlik] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(saydamlik, { toValue: 0, duration: 280, delay: 60, useNativeDriver: true })
      .start(() => setBitti(true));
  }, [saydamlik]);
  if (bitti) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: saydamlik }]}>
      <StartupScreen />
    </Animated.View>
  );
}

/**
 * Bildirim eşitleyicisi — uygulama ağacında **bir kez** durur.
 *
 * Görünmez; tek işi açılışta ve girdiler değiştiğinde bildirim planını
 * cihazla eşitlemek. Eskiden açılışta hiçbir yeniden planlama yoktu: plan
 * yalnız ayarlar ekranından kuruluyordu, ayarlara girmeyen kullanıcının
 * bildirimleri ~10-12 günde sessizce kesiliyordu.
 *
 * Sağlayıcıların **içinde** durmak zorunda: çeviri, tema ve mağazalara
 * erişiyor. İzin istemez; izin yoksa sessizce hiçbir şey kurmaz.
 */
function BildirimEsitleyici() {
  useNotificationSync();
  useWidgetSync();
  return null;
}

/** Hata metinlerini çeviriden alabilmek için I18nProvider'ın içinde durur. */
function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <ErrorBoundary
      title={t('error.crashTitle')}
      description={t('error.crashBody')}
      retryLabel={t('error.restart')}
      onError={(error, componentStack) => {
        // Rapor cihazda kalır; bir servise gönderilmez (D12, §85).
        recordCrash(error, { version: Brand.version, variant: String(Constants.expoConfig?.extra?.variant ?? '') }, componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
