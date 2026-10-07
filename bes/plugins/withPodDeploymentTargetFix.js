/**
 * React Native'in kendi Podfile yardımcısı (`updateOSDeploymentTarget`)
 * yalnız ana Pod hedeflerinin build ayarlarını düzeltiyor —
 * CocoaPods'un kaynak paketleri için otomatik oluşturduğu ayrı
 * "resource bundle" hedeflerine (`RNSVG-RNSVGFilters`,
 * `RNCAsyncStorage-RNCAsyncStorage_resources` gibi) hiç dokunmuyor.
 * Bu hedefler kendi podspec'lerinde bildirdikleri eski iOS sürümünde
 * (12.4, 13.4) kalıyor; yeni bir Xcode bunu doğrudan reddedip derlemeyi
 * hiç başlatmadan durduruyor. `expo-build-properties` de aynı temel
 * mekanizmayı kullandığı için bu boşluğu kapatmıyor.
 *
 * Bu eklenti, Podfile'ın kendi post_install adımına EK bir döngü
 * ekliyor: `installer.pods_project.targets` üzerinden **tüm** hedefleri
 * (resource bundle'lar dahil) gezip minimum sürümü zorluyor.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MIN_DEPLOYMENT_TARGET = '15.1';
const MARKER = '# BES: tüm Pod hedeflerinde (resource bundle dahil) minimum iOS sürümünü zorla';
const ANCHOR = ':ccache_enabled => ccache_enabled?(podfile_properties),\n    )';

function withPodDeploymentTargetFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARKER)) return config;
      if (!contents.includes(ANCHOR)) {
        throw new Error(
          'withPodDeploymentTargetFix: Podfile içinde beklenen çapa bulunamadı — '
          + 'react-native/scripts/react_native_pods.rb şablonu değişmiş olabilir.',
        );
      }

      const injected = `${ANCHOR}\n\n    ${MARKER}\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |build_config|\n        build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_DEPLOYMENT_TARGET}'\n      end\n    end`;
      contents = contents.replace(ANCHOR, injected);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
}

module.exports = withPodDeploymentTargetFix;
