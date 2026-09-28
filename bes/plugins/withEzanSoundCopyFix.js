/**
 * `expo-notifications`in iOS eklentisi bildirim sesini (`assets/sounds/`
 * app.config.ts → `sounds`) Xcode projesine "Copy Bundle Resources"
 * listesine ekliyor — ve dosya `ios/BEdev/ezan.caf` olarak diskte doğru
 * yerde duruyor, `project.pbxproj`da da doğru hedefe (widget'a değil, ana
 * uygulamaya) bağlı görünüyor. Buna rağmen gerçek cihazda derlenen paketin
 * içinde dosya YOK: aynı listede hemen üstünde duran font dosyaları
 * (Amiri-*.ttf) kopyalanıyor, ezan.caf sessizce atlanıyor.
 *
 * Kök neden `xcode` npm paketinde (expo-notifications'ın Xcode projesine
 * dosya eklemek için kullandığı kütüphane): `FILETYPE_BY_EXTENSION`
 * listesi ses uzantılarını (wav/caf/mp3/m4a) hiç tanımıyor — ama bu tek
 * başına açıklamıyor, çünkü aynı listede ttf de yok ve o kopyalanıyor.
 * Xcode 27'nin (bu proje "Xcode 27's Device Hub" notuyla bunu zaten
 * biliyor, bkz. tools/ios-device.cjs) yeni derleme sistemi ses
 * dosyalarını farklı işliyor olabilir — kesin sebep doğrulanamadı, WAV'dan
 * CAF'a geçmek de değiştirmedi (ikisi de aynı şekilde sessizce atlandı).
 *
 * Bu eklenti kök nedeni beklemeden **garantiye alıyor**: derlemenin sonuna
 * açık bir "Run Script" adımı ekleyip dosyayı elle, `cp` ile, üretilen
 * paketin Resources klasörüne kopyalıyor. Bu adım `ios/BEdev/ezan.caf`
 * dosyasının zaten diskte var olduğuna güveniyor (expo-notifications'ın
 * kendi `copyFileSync` adımı bunu hallediyor, o kısım çalışıyor) — yalnız
 * Xcode'un kendi "Copy Bundle Resources" listesine güvenmek yerine kesin
 * bir kabuk komutuyla tekrarlıyor.
 */
const { withXcodeProject, IOSConfig } = require('expo/config-plugins');

const SES_DOSYASI = 'ezan.caf';

function withEzanSoundCopyFix(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const { uuid: targetUuid } = IOSConfig.XcodeUtils.getApplicationNativeTarget({
      project,
      projectName,
    });

    const shellScript =
      `set -e\n` +
      `SRC="\${SRCROOT}/${projectName}/${SES_DOSYASI}"\n` +
      `DEST_DIR="\${TARGET_BUILD_DIR}/\${UNLOCALIZED_RESOURCES_FOLDER_PATH}"\n` +
      `mkdir -p "$DEST_DIR"\n` +
      `cp -f "$SRC" "$DEST_DIR/${SES_DOSYASI}"\n` +
      `echo "ezan sesi elle kopyalandı: $DEST_DIR/${SES_DOSYASI}"\n`;

    project.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      'Ezan sesini pakete garantiye al',
      targetUuid,
      { shellPath: '/bin/sh', shellScript },
    );

    return config;
  });
}

module.exports = withEzanSoundCopyFix;
