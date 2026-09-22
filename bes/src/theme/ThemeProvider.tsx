/**
 * Tema sağlayıcı — şartname §8, §79.
 *
 * Üç mod: `system` (cihazı izler), `light`, `dark`. Kullanıcı tercihi
 * kalıcıdır; kalıcılık katmanı `onChange` geri çağrısıyla dışarıdan verilir,
 * böylece bu dosya depolama teknolojisine bağlanmaz.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useColorScheme, AccessibilityInfo } from 'react-native';
import { lightTheme, darkTheme, type Theme } from './index';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Cihazda "hareketi azalt" açıksa true — animasyon süreleri sıfırlanır. */
  reduceMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Depodan okunan başlangıç tercihi. */
  initialMode?: ThemeMode;
  /** Kullanıcı tercihi değişince çağrılır — kalıcılık burada yapılır. */
  onModeChange?: (mode: ThemeMode) => void;
}

export function ThemeProvider({ children, initialMode = 'system', onModeChange }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (alive) setReduceMotion(v); })
      .catch(() => { /* erişilebilirlik bilgisi yoksa hareket açık kalır */ });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { alive = false; sub.remove(); };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    onModeChange?.(next);
  }, [onModeChange]);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    const base = resolved === 'dark' ? darkTheme : lightTheme;
    const theme: Theme = reduceMotion
      ? { ...base, duration: { instant: 0, fast: 0, normal: 0, slow: 0, deliberate: 0 } }
      : base;
    return { theme, mode, setMode, reduceMotion };
  }, [mode, systemScheme, setMode, reduceMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme yalnız <ThemeProvider> içinde kullanılır.');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}
