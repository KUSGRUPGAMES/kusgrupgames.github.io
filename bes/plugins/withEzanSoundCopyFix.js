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

// iOS bildirim sesleri (5 Ekim: kısa = ilk tekbir, uzun = 29,5 sn — iOS sınırı 30 sn).
const SES_DOSYALARI = ['ezankisa.caf', 'ezanuzun.caf'];

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
      `DEST_DIR="\${TARGET_BUILD_DIR}/\${UNLOCALIZED_RESOURCES_FOLDER_PATH}"\n` +
      `mkdir -p "$DEST_DIR"\n` +
      SES_DOSYALARI.map((f) =>
        `cp -f "\${SRCROOT}/${projectName}/${f}" "$DEST_DIR/${f}"\n` +
        `echo "ezan sesi elle kopyalandı: $DEST_DIR/${f}"\n`).join('');

    // `inputPaths`/`outputPaths` BİLEREK boş bırakılıyor: `${VAR}` ya da
    // `$(VAR)` içeren değerler `xcode` paketinin pbxproj yazıcısında
    // (parantez/ayraçları kendi dizi söz dizimiyle karıştırıp) bozuk çıktı
    // üretiyor — projeyi sonraki eklentiler (ör. @bacons/apple-targets)
    // ayrıştıramaz hale geliyor (yerel bir `expo prebuild` ile denenip
    // görüldü). Bunun yerine Xcode 15+'ın "User Script Sandboxing"
    // özelliğini hedefin tamamı için kapatıyoruz (aşağıda) — kum havuzu,
    // girdi/çıktı bildirilmemiş bir script'in dosya okuma/yazmasını
    // sessizce engelleyebiliyordu (derleme yine "0 error" ile bitiyor,
    // yalnız script'in içindeki kopyalama hiç gerçekleşmiyordu — ilk
    // denemede tam bunu yaşadık).
    project.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      'Ezan sesini pakete garantiye al',
      targetUuid,
      { shellPath: '/bin/sh', shellScript },
    );

    // Bu proje zaten imzasız/geliştirme derlemesi, App Store'a gitmiyor —
    // tüm hedef için sandbox'ı kapatmak burada güvenli.
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const entry = configurations[key];
      if (entry?.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }

    return config;
  });
}

module.exports = withEzanSoundCopyFix;
