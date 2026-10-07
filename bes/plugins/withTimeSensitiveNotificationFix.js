/**
 * Vakit girişinde ezan bildirimi "Rahatsız Etmeyin"/uyku programı ekran
 * kilitliyken sessiz kalıyordu (D29 devamı) — `interruptionLevel:
 * 'timeSensitive'` içerikte yazılı olsa da hiçbir işe yaramıyordu, çünkü
 * `expo-notifications`'ın iOS izin isteği (`PermissionsModule.swift`)
 * `.timeSensitive` seçeneğini JS'ten hiç almıyor: varsayılan istek
 * `[.alert, .badge, .sound]` — uygulama bu yetkiyi hiç almadığı için iOS
 * bildirimi sessizce `active` seviyesine düşürüyor. `active` seviye ekran
 * açıkken görünür/sesli kalıyor ama kilitliyken bir Odak/Uyku programına
 * takılabiliyor; gerçek `timeSensitive` bunu kırar.
 *
 * `node_modules` içindeki Swift dosyasını yamalıyoruz — `npm install` her
 * çalıştığında sıfırlanacağı için düzeltme her prebuild'de yeniden
 * uygulanıyor (idempotent: zaten yamalıysa dokunmaz).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ESKI = 'let defaultAuthorizationOptions: UNAuthorizationOptions = [.alert, .badge, .sound]';
const YENI = 'let defaultAuthorizationOptions: UNAuthorizationOptions = [.alert, .badge, .sound, .timeSensitive]';

function patchPermissionsModule(projectRoot) {
  const dosyaYolu = path.join(
    projectRoot, 'node_modules', 'expo-notifications', 'ios', 'EXNotifications',
    'Permissions', 'PermissionsModule.swift',
  );
  const icerik = fs.readFileSync(dosyaYolu, 'utf8');
  if (icerik.includes(YENI)) return;
  if (!icerik.includes(ESKI)) {
    throw new Error(
      'withTimeSensitiveNotificationFix: PermissionsModule.swift içinde beklenen '
      + '`defaultAuthorizationOptions` satırı bulunamadı — expo-notifications sürümü değişmiş olabilir.',
    );
  }
  fs.writeFileSync(dosyaYolu, icerik.replace(ESKI, YENI));
}

function withTimeSensitiveNotificationFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      patchPermissionsModule(config.modRequest.projectRoot);
      return config;
    },
  ]);
}

module.exports = withTimeSensitiveNotificationFix;
