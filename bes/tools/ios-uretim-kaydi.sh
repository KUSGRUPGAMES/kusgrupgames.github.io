#!/bin/bash
# Mağaza sürümünün App Group kaydı — Mac'te, TestFlight'tan önce BİR KEZ.
#
#   cd ~/bes-repo/bes && bash tools/ios-uretim-kaydi.sh
#
# Neden: widget vakitleri uygulamayla ortak App Group'tan
# (group.com.kusgrupgames.bes) okur. GitHub'daki yayın akışı App Store Connect
# API anahtarıyla imzalar; o anahtar App Group OLUŞTURAMAZ ve App ID'ye
# bağlayamaz ("exportArchive Authentication failed / No profiles"). Bunu
# yalnızca Xcode'a girilmiş Apple hesabı yapabilir. Bu betik üretim
# kimliğiyle (com.kusgrupgames.bes + .widget) bir kez imzalı derleme alır;
# Xcode otomatik imza sırasında grubu kaydedip iki App ID'ye bağlar. Sonra
# geliştirme projesini geri kurar. Kayıt kalıcıdır, tekrar gerekmez.
set -euo pipefail
cd "$(dirname "$0")/.."

GUNLUK=/tmp/bes-uretim-kaydi.log
echo "1/3 Üretim projesi kuruluyor..."
APP_VARIANT=production CI=1 npx expo prebuild --platform ios --clean > /dev/null
WS=$(ls -d ios/*.xcworkspace | head -1)
AD=$(basename "$WS" .xcworkspace)

echo "2/3 Apple hesabıyla imzalanıyor (5-10 dk)..."
rm -rf /tmp/bes-uretim
set +e
xcodebuild -workspace "$WS" -scheme "$AD" -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath /tmp/bes-uretim \
  -allowProvisioningUpdates build > "$GUNLUK" 2>&1
set -e

APP=$(find /tmp/bes-uretim/Build/Products -maxdepth 2 -name '*.app' | head -1)
TAMAM=1
if [ -z "$APP" ]; then
  TAMAM=0
else
  for HEDEF in "$APP" "$APP"/PlugIns/*.appex; do
    codesign -d --entitlements - "$HEDEF" 2>/dev/null | grep -q 'group.com.kusgrupgames.bes' || TAMAM=0
  done
fi

echo "3/3 Geliştirme projesi geri kuruluyor..."
CI=1 npx expo prebuild --platform ios --clean > /dev/null

if [ "$TAMAM" = 1 ]; then
  echo "TAMAM — App Group kaydedildi. Artık GitHub'daki 'BES iOS yayin' akışı widget'lı sürümü imzalayabilir."
else
  echo "KAYIT YAPILAMADI — hata satırları:"
  grep -n -i 'error:' "$GUNLUK" | head -20
  exit 1
fi
