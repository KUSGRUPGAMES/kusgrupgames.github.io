#!/usr/bin/env bash
# Tanitim videosunu uretir:  bash tools/film.sh [cikti.mp4]
#
# Nasil calisiyor: www/index.html?film=1&t=<saniye> o anin karesini TEKRARLANABILIR
# sekilde cizip donduruyor. Burada her kare icin bir kez Chromium acilir, kare
# alinir, sonunda ffmpeg birlestirir. Kareler paralel uretilir, yoksa cok yavas.
#
# ffmpeg gerekir. Yoksa: npm i ffmpeg-static  (veya FFMPEG=/yol/ffmpeg ver)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/marketing/lull-tanitim.mp4}"
CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
FPS="${FPS:-12}"
DUR="${DUR:-28}"
W=500; H=1080                      # telefon orani (430x932 ile ayni), headless alt siniri 500
JOBS="${JOBS:-6}"

FF="${FFMPEG:-}"
if [ -z "$FF" ]; then
  FF="$(command -v ffmpeg || true)"
  [ -z "$FF" ] && [ -f "$ROOT/node_modules/ffmpeg-static/ffmpeg" ] && FF="$ROOT/node_modules/ffmpeg-static/ffmpeg"
fi
[ -z "$FF" ] && { echo "ffmpeg bulunamadi. FFMPEG=/yol/ffmpeg verin."; exit 1; }

# headless pencere yuksekligi ile gercek viewport farki (chrome surumune gore degisir)
PROBE="$(mktemp /tmp/vpXXXX.html)"
printf '<!doctype html><meta charset=utf-8><title>x</title><script>document.title="VP:"+innerHeight;</script>' > "$PROBE"
VP=$("$CHROME" --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=$W,$H \
      --dump-dom "file://$PROBE" 2>/dev/null | grep -o 'VP:[0-9]*' | head -1 | sed 's/VP://')
rm -f "$PROBE"
DELTA=$(( H - ${VP:-$H} ))
echo "viewport farki: ${DELTA}px  ·  ${FPS} kare/sn  ·  ${DUR} sn"

DIR="$(mktemp -d /tmp/lullfilmXXXX)"
N=$(( FPS * DUR ))
# Port SABIT OLAMAZ. Sabit 8877 kullanilirken baska bir urunun film.sh
# calismasindan kalan sunucu portu tutuyordu; bu betigin kendi sunucusu
# sessizce baglanamadi ve Chrome BASKA URUNUN sayfasini cekti. Sonuc: bir
# urunun tanitim videosu bastan sona baska bir urunu gosteriyordu ve hicbir
# asamada hata vermedi. Bu yuzden: bos port + sunucunun BIZIM dosyamizi
# verdiginin dogrulanmasi.
SRV_PORT=$(python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()")
( cd "$ROOT/www" && python3 -m http.server $SRV_PORT --bind 127.0.0.1 >/dev/null 2>&1 ) &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
IMZA=$(node -p "require('$ROOT/app.config.json').appName")
HAZIR=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$SRV_PORT/index.html" 2>/dev/null | grep -q "$IMZA"; then HAZIR=1; break; fi
  sleep 0.5
done
[ "$HAZIR" = 1 ] || { echo "sunucu $SRV_PORT portunda $IMZA sayfasini vermiyor - film uretilmedi"; exit 1; }
echo "sunucu hazir: port $SRV_PORT, icerik $IMZA"

frame() {
  local i=$1
  local t; t=$(awk "BEGIN{printf \"%.3f\", $i / $FPS}")
  local raw="$DIR/raw-$(printf '%05d' "$i").png"
  "$CHROME" --headless --no-sandbox --disable-gpu --use-gl=swiftshader --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=$W,$(( H + DELTA )) --virtual-time-budget=1600 \
    --screenshot="$raw" "http://127.0.0.1:$SRV_PORT/index.html?film=1&t=$t" >/dev/null 2>&1
  node "$ROOT/tools/pngcrop.js" "$raw" "$DIR/f-$(printf '%05d' "$i").png" $W $H 2>/dev/null || true
  rm -f "$raw"
  return 0          # set -e ile birlikte tek bir basarisiz kare tum betigi dusuruyordu
}

echo "kareler uretiliyor ($N adet, $JOBS paralel)..."
# DIKKAT: cipla "wait", arka plandaki http.server'i de bekler ve betik orada
# sonsuza kadar asili kalir (kareler bitmis olsa bile video uretilmez).
# Yalnizca kare isleri beklenmeli. Ayni hata baska bir uründe de yasandi.
PIDS=()
for i in $(seq 0 $(( N - 1 ))); do
  frame "$i" &
  PIDS+=($!)
  while [ "$(jobs -rp | wc -l)" -gt "$JOBS" ]; do sleep 0.2; done
done
# 2>/dev/null: is kendiliginden toplanmissa "not a child of this shell" uyarisi gelir
for pid in "${PIDS[@]}"; do wait "$pid" 2>/dev/null || true; done

GOT=$(ls "$DIR"/f-*.png 2>/dev/null | wc -l)
echo "uretilen kare: $GOT / $N"
[ "$GOT" -lt "$(( N * 9 / 10 ))" ] && { echo "cok fazla kare eksik, video uretilmedi"; exit 1; }

mkdir -p "$(dirname "$OUT")"
# -preset: 'slow' bu ortamda dakikalarca suruyor, 'veryfast' saniyeler.
"$FF" -y -framerate $FPS -pattern_type glob -i "$DIR/f-*.png" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -preset veryfast \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -movflags +faststart "$OUT" 2>&1 | tail -2

# kucuk bir GIF onizleme de birak (mesajlasmada oynatmasi kolay)
"$FF" -y -i "$OUT" -vf "fps=10,scale=360:-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  "${OUT%.mp4}.gif" >/dev/null 2>&1 || true

find "$DIR" -type f -delete; rmdir "$DIR" 2>/dev/null || true
ls -la "$OUT" "${OUT%.mp4}.gif" 2>/dev/null | awk '{print "  ", $5, $9}'
echo "hazir: $OUT"
