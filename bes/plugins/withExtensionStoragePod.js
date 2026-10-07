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
 * İlk denemede pod'u `use_expo_modules!`den önce elle ekleyip Expo'nun
 * "zaten eklenmiş, atla" kısayolunu tetiklemeyi denedim — ama bu sefer
 * CocoaPods'un kendisi **gerçek** bir hata verdi: "could not find
 * compatible versions ... required a higher minimum deployment target".
 * Yani modül GERÇEKTEN 16.4 istiyor; bunu atlatmak yetmiyor, düzeltmek
 * gerekiyor. Modülün kendi Swift kodu (`WidgetCenter`, `ControlCenter`)
 * bu sürümü gerçekten gerektirmiyor — `ControlCenter` zaten kendi içinde
 * `@available(iOS 18.0, *)` ile korunuyor; podspec'teki 16.4 fazla
 * temkinli bir sabit. Bu yüzden dosyayı `node_modules` içinde, her
 * prebuild'de projenin gerçek hedefine (15.1) indiriyoruz — `npm install`
 * her çalıştığında bu dosya sıfırlanacağı için düzeltme kalıcı değil,
 * her prebuild'de yeniden uygulanıyor (idempotent: zaten 15.1'se dokunmaz).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# BES: ExtensionStorage - Expo\'nun 16.4 platform kontrolünü atlamak için elle eklendi';
const MIN_DEPLOYMENT_TARGET = '15.1';

function patchPodspecPlatform(projectRoot) {
  const podspecPath = path.join(
    projectRoot, 'node_modules', '@bacons', 'apple-targets', 'ios', 'ExtensionStorage.podspec',
  );
  const contents = fs.readFileSync(podspecPath, 'utf8');
  const patched = contents.replace(
    /s\.platform\s*=\s*:ios,\s*'[\d.]+'/,
    `s.platform       = :ios, '${MIN_DEPLOYMENT_TARGET}'`,
  );
  if (patched === contents && !contents.includes(`'${MIN_DEPLOYMENT_TARGET}'`)) {
    throw new Error('withExtensionStoragePod: ExtensionStorage.podspec içinde beklenen `s.platform` satırı bulunamadı.');
  }
  fs.writeFileSync(podspecPath, patched);
}

function withExtensionStoragePod(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      patchPodspecPlatform(config.modRequest.projectRoot);

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
