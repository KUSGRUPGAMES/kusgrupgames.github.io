#!/usr/bin/env bash
# Mağaza paketinde gerçek AdMob birimleri gömülü mü? (yüklemeden ÖNCE çalıştır)
#
#   bash tools/check-store-ads.sh android android/app/build/outputs/bundle/release/app-release.aab
#   bash tools/check-store-ads.sh ios path/BE.ipa
#
# Neden: EXPO_PUBLIC_* değerleri derlemede koda gömülür ve Metro önbelleği
# (sistem geçici klasöründe: $TMPDIR/metro-cache) eski çeviriyi saklar. Bir kez
# Android kimlikleri yokken önbelleğe girmiş çeviri, kimlikler eklendikten sonra
# da kullanıldı — paket test reklamıyla çıkacaktı (2026-10-02). Önlem: kimlik
# değiştiyse derlemeden önce `rm -rf "$TMPDIR"/metro-cache`, ve bu denetim.
set -euo pipefail
cd "$(dirname "$0")/.."
PLATFORM="$1"; PAKET="$2"
set -a; . ./.env; set +a
GECICI=$(mktemp); trap 'rm -f "$GECICI"' EXIT
# macOS `strings` dosyayı tam taramıyor; doğrudan bayt araması yapılır.
case "$PLATFORM" in
  android) unzip -p "$PAKET" base/assets/index.android.bundle > "$GECICI"; SUF=ANDROID ;;
  ios)     unzip -p "$PAKET" 'Payload/*.app/main.jsbundle' > "$GECICI"; SUF=IOS ;;
  *) echo "kullanım: $0 android|ios <paket>"; exit 2 ;;
esac
HATA=0
for T in BANNER INTERSTITIAL APPOPEN REWARDED; do
  V="EXPO_PUBLIC_ADMOB_${T}_${SUF}"; ID="${!V:-}"
  if [ -z "$ID" ]; then echo "✗ $V .env içinde yok"; HATA=1; continue; fi
  # Hermes metinleri bölerek saklayabiliyor; birimin benzersiz numarası aranır.
  if LC_ALL=C grep -aqF "${ID##*/}" "$GECICI"; then echo "✓ $T"; else echo "✗ $T: $ID pakette YOK (Metro önbelleğini temizleyip yeniden derle)"; HATA=1; fi
done
exit $HATA
