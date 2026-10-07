/**
 * Google / Apple giriş düğmeleri (D32) — onboarding, Topluluk ve Hesap
 * ekranlarında aynı bileşen kullanılır.
 *
 * Apple düğmesi Apple'ın kendi bileşenidir (`AppleAuthenticationButton`):
 * App Review, "Sign in with Apple" için sistem düğmesini ya da onun
 * kurallarına birebir uyan bir çizimi ister; kendi çizimimiz risk olurdu.
 * Google düğmesi tasarım sisteminin ikincil düğmesiyle çizilir.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button, Banner, Column } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { appleIleGiris, appleKullanilabilir, googleIleGiris, type Saglayici } from './auth';

export interface SignInButtonsProps {
  /** Giriş tamamlanınca çağrılır. */
  onSignedIn?: () => void;
  /** Koyu (vurgu) zemin üzerinde mi — Apple düğmesinin rengini seçer. */
  onAccent?: boolean;
}

export function SignInButtons({ onSignedIn, onAccent = false }: SignInButtonsProps) {
  const t = useT();
  const theme = useTheme();
  const [apple, setApple] = useState(false);
  const [bekleyen, setBekleyen] = useState<Saglayici | null>(null);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    let alive = true;
    void appleKullanilabilir().then((v) => { if (alive) setApple(v); });
    return () => { alive = false; };
  }, []);

  const giris = async (saglayici: Saglayici) => {
    if (bekleyen) return;
    setHata(false);
    setBekleyen(saglayici);
    const sonuc = saglayici === 'apple' ? await appleIleGiris() : await googleIleGiris();
    setBekleyen(null);
    if (sonuc === 'ok') onSignedIn?.();
    else if (sonuc === 'error') setHata(true);
  };

  const koyu = onAccent || theme.name === 'dark';

  return (
    <Column gap="md">
      {apple ? (
        <View style={{ opacity: bekleyen === 'google' ? 0.5 : 1 }} pointerEvents={bekleyen ? 'none' : 'auto'}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={koyu
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={theme.radius.md}
            style={{ height: 48, width: '100%' }}
            onPress={() => { void giris('apple'); }}
          />
        </View>
      ) : null}
      <Button
        label={t('auth.continueGoogle')}
        variant="secondary"
        block
        loading={bekleyen === 'google'}
        disabled={bekleyen === 'apple'}
        onPress={() => { void giris('google'); }}
      />
      {hata ? <Banner tone="warning" title={t('auth.failed')} /> : null}
    </Column>
  );
}
