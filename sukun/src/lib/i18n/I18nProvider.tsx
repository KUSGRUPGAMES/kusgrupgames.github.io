/**
 * Dil sağlayıcı — şartname §61, §79.
 * Arayüzde metin `useT()` ile alınır; gömülü metin yazılmaz.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translate, resolveLanguage, type Language } from './translate';
import { uiDirection, type Direction } from './direction';
import type { StringKey } from './strings/tr';

export type Translator = (key: StringKey, params?: Readonly<Record<string, string | number>>) => string;

interface I18nContextValue {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  /** Depodan okunan tercih; yoksa cihaz dili kullanılır. */
  initialLanguage?: Language;
  /** Cihazın dil etiketi, ör. 'tr-TR'. */
  deviceTag?: string | null;
  onLanguageChange?: (lang: Language) => void;
}

export function I18nProvider({ children, initialLanguage, deviceTag, onLanguageChange }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? resolveLanguage(deviceTag),
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    onLanguageChange?.(lang);
  }, [onLanguageChange]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    direction: uiDirection(language),
    setLanguage,
    t: (key, params) => translate(language, key, params),
  }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n yalnız <I18nProvider> içinde kullanılır.');
  return ctx;
}

/** Yalnız çeviri işlevi gerektiğinde. */
export function useT(): Translator {
  return useI18n().t;
}
