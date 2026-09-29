/**
 * Widget'a veri taşıyan native köprü (`ExtensionStorage`, @bacons/apple-
 * targets) uygulamaya hiç bağlanmıyordu — `requireOptionalNativeModule`
 * her zaman `null` dönüyordu, widget da bu yüzden hep yalnız logo
 * gösteriyordu (veri hiç yazılamıyordu).
 *
 * Kök neden: `ExtensionStorage.podspec` en az iOS **16.4** istiyor, bu
 * projenin genel hedefi (Podfile'daki `platform :ios, ...`) ise **15.1**.
 * Expo'nun kendi otomatik bağlama kodu (`expo-modules-autolinking`'in
 * `autolinking_manager.rb`'si), bir modülün podspec'i hedefin platformunu
 * desteklemiyorsa o modülü **sessizce** atlıyor — yalnız CocoaPods
 * çıktısında kolayca kaçırılan sarı bir "doesn't support platform" satırı
 * bırakıyor, derleme yine "0 error" ile bitiyor.
 *
 * `withPodDeploymentTargetFix` bunu çözmüyor: o düzeltme `post_install`da
 * çalışıyor, ama bu modül `post_install`a hiç ulaşamadan, `use_expo_modules!`
 * kendi platform kontrolünde daha en baştan dışlanıyor.
 *
 * Çözüm: `autolinking_manager.rb`nin kendi kodunda "modül zaten hedefe
 * eklenmişse dokunma, atla" diye bir kısayol var. Bu eklenti, tam da
 * `use_expo_modules!` çağrılmadan HEMEN ÖNCE pod'u elle ekleyip bu
 * kısayolu tetikliyor — Expo kendi platform kontrolünü hiç çalıştırmıyor.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# BES: ExtensionStorage - Expo\'nun 16.4 platform kontrolünü atlamak için elle eklendi';

function withExtensionStoragePod(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARKER)) return config;
      const anchor = `target '${config.modRequest.projectName}' do\n  use_expo_modules!`;
      if (!contents.includes(anchor)) {
        throw new Error(
          `withExtensionStoragePod: Podfile içinde beklenen "target '${config.modRequest.projectName}' do" çapası bulunamadı.`,
        );
      }

      const injected = `target '${config.modRequest.projectName}' do\n  ${MARKER}\n  pod 'ExtensionStorage', :path => '../node_modules/@bacons/apple-targets/ios'\n\n  use_expo_modules!`;
      contents = contents.replace(anchor, injected);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
}

module.exports = withExtensionStoragePod;
