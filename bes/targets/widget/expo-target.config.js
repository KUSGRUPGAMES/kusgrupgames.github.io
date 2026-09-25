/**
 * BEŞ widget eklentisi — ana ekran/kilit ekranı widget'ları ve Dinamik Ada
 * (Live Activity). @bacons/apple-targets bu klasörü prebuild'de Xcode
 * projesine ayrı bir hedef olarak bağlar (DECISIONS D30).
 *
 * Veri, uygulamayla paylaşılan App Group'tan okunur: `group.<bundle id>`.
 */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'BesWidget',
  displayName: 'BEŞ',
  // Text(timerInterval:) ve ActivityContent iOS 16.2 ister.
  deploymentTarget: '16.2',
  icon: '../../assets/icon.png',
  colors: {
    $widgetBackground: '#002419',
    $accent: '#E6B965',
  },
  images: {
    besIsaret: '../../assets/splash-icon.png',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
