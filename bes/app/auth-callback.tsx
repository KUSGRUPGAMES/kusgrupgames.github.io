/**
 * Google girişinin dönüş adresi — `bes://auth-callback` (D32).
 *
 * iOS'ta güvenli tarayıcı oturumu bu adresi kendisi yakalar, buraya hiç
 * gelinmez. Android'de sistem adresi uygulamaya da iletebilir; o zaman
 * expo-router bu yolu açar. Kodu `auth.ts` zaten tarayıcı sonucundan
 * okuduğu için bu ekranın tek işi kullanıcıyı geldiği yere geri götürmek —
 * yoksa "sayfa bulunamadı" görünürdü.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);
  return null;
}
