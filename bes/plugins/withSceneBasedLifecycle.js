/**
 * Bu Mac'te kurulu Xcode/iOS SDK artık "scene-based life cycle" benimsemeyen
 * uygulamaları başlatmayı reddediyor — Expo'nun ürettiği varsayılan
 * AppDelegate.swift hâlâ eski, sahnesiz UIWindow kurulumunu kullanıyor.
 * Cihaza kurulurken gerçek bir çökme (EXC_BREAKPOINT) olarak görüldü;
 * konsol: "Application failed to launch: UIScene life cycle is required
 * for apps built with this SDK." (UIApplication_RuntimeIssues.m:106)
 *
 * Bu eklenti:
 *  1) Info.plist'e UIApplicationSceneManifest ekler (tek pencereli sahne).
 *  2) AppDelegate.swift'teki elle UIWindow kurulumunu kaldırır — pencere
 *     artık SceneDelegate tarafından kurulur.
 *  3) Yeni bir SceneDelegate.swift dosyası ekler; pencereyi AppDelegate'in
 *     zaten hazırladığı reactNativeFactory ile başlatır.
 *
 * Bilinen sınır: soğuk açılışta (uygulama kapalıyken) evrensel bağlantıyla
 * (universal link) açılma artık SceneDelegate'in `scene(_:continue:)`
 * metodunu gerektirir; bu eklenti onu eklemiyor — uygulama açıkken gelen
 * bağlantılar AppDelegate'teki mevcut metotla çalışmaya devam ediyor.
 */
const { withInfoPlist, withDangerousMod, IOSConfig } = require('@expo/config-plugins');
const { withBuildSourceFile } = IOSConfig.XcodeProjectFile;
const fs = require('fs');

const WINDOW_SETUP_BLOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const SCENE_DELEGATE_SOURCE = `import Expo
import React
import UIKit

// BES: scene-based life cycle zorunlu olduğu için pencere kurulumu buraya
// taşındı — bkz. plugins/withSceneBasedLifecycle.js
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil)
  }
}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

function withAppDelegateWindowMoved(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const appDelegatePath = IOSConfig.Paths.getAppDelegateFilePath(config.modRequest.projectRoot);
      let contents = fs.readFileSync(appDelegatePath, 'utf8');

      if (contents.includes(WINDOW_SETUP_BLOCK)) {
        contents = contents.replace(WINDOW_SETUP_BLOCK, '');
        fs.writeFileSync(appDelegatePath, contents);
      } else if (!contents.includes('SceneDelegate')) {
        // İki işaret de yoksa şablon değişmiş demektir — sessizce iki kez
        // pencere kurmak yerine yüksek sesle patla.
        throw new Error(
          'withSceneBasedLifecycle: AppDelegate.swift içinde beklenen pencere '
          + 'kurulum bloğu bulunamadı — Expo AppDelegate şablonu değişmiş olabilir.',
        );
      }

      return config;
    },
  ]);
}

// `withDangerousMod`'daki düz `fs.writeFileSync` yeni dosyayı diske yazar
// ama Xcode projesine (pbxproj) eklemez — derlenmeden kalır ve Info.plist'te
// adı geçen sınıf çalışma zamanında bulunamaz. `withBuildSourceFile` ikisini
// birden yapıyor: dosyayı yazar VE hedefin "Compile Sources" adımına ekler.
function withSceneDelegateFile(config) {
  return withBuildSourceFile(config, {
    filePath: 'SceneDelegate.swift',
    contents: SCENE_DELEGATE_SOURCE,
    overwrite: true,
  });
}

function withSceneBasedLifecycle(config) {
  config = withSceneManifest(config);
  config = withAppDelegateWindowMoved(config);
  config = withSceneDelegateFile(config);
  return config;
}

module.exports = withSceneBasedLifecycle;
