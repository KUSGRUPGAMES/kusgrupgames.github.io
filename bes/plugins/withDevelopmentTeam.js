/**
 * `expo prebuild --clean` ios/ klasörünü sıfırdan üretir; Xcode'da elle
 * seçilen "Development Team" (Signing & Capabilities) ayarı bu sıfırlamada
 * kayboluyor ve yerel cihaz derlemesi şu hatayla duruyor:
 *
 *   Signing for "BEdev" requires a development team. Select a development
 *   team in the Signing & Capabilities editor.
 *
 * Bu eklenti Team ID'yi (Apple Developer hesabı kusgrupgames@gmail.com,
 * Team: TURAN BURAK KUS) doğrudan pbxproj build ayarlarına yazıyor; artık
 * her prebuild sonrası Xcode'da elle seçmeye gerek yok.
 */
const { withXcodeProject } = require('@expo/config-plugins');

const DEVELOPMENT_TEAM = 'C4NUF2G789';

function withDevelopmentTeam(config) {
  return withXcodeProject(config, (config) => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const entry = configurations[key];
      if (entry?.buildSettings) {
        entry.buildSettings.DEVELOPMENT_TEAM = DEVELOPMENT_TEAM;
        entry.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      }
    }
    return config;
  });
}

module.exports = withDevelopmentTeam;
