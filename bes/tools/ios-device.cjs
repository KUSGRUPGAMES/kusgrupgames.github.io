#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Expo SDK 54 predates Xcode 27's Device Hub. Backport the verified bundle
// lookup used by upstream PR https://github.com/expo/expo/pull/46757.
// This adapter is scoped to this CLI process; installed packages are untouched.
function addDeviceHubFallback(prerequisite, run = execFileSync) {
  const original = prerequisite.assertImplementation.bind(prerequisite);
  const read = (command, args) => run(command, args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
  }).trim();

  prerequisite.assertImplementation = async function (...args) {
    try {
      return await original(...args);
    } catch (error) {
      if (error.code !== 'VALIDATE_SIMULATOR_APP') throw error;
      const version = read('xcodebuild', ['-version']).match(/^Xcode (\d+)/m);
      if (!version || Number(version[1]) < 27) throw error;

      const developer = read('xcode-select', ['--print-path']);
      const plist = path.join(developer, '..', 'Applications', 'DeviceHub.app', 'Contents', 'Info.plist');
      const bundleId = read('/usr/bin/defaults', ['read', plist, 'CFBundleIdentifier']);
      if (bundleId !== 'com.apple.dt.Devices') {
        throw new Error('Xcode Device Hub kimliği doğrulanamadı: ' + bundleId);
      }
      // Preserve the original tool validation. An absent/broken simctl still fails.
      read('xcrun', ['simctl', 'help']);
      process.stdout.write('BEŞ: Xcode 27 Device Hub doğrulandı. Listeden fiziksel iPhone’unu seç.\n');
    }
  };
  // Expo memoizes a bound assertion in its constructor; refresh that binding.
  prerequisite.resetAssertion();
}

function main() {
  if (process.platform !== 'darwin') throw new Error('Bu komut Mac üzerinde çalıştırılmalı.');
  const projectRoot = path.resolve(__dirname, '..');
  process.chdir(projectRoot);
  const expoRoot = path.dirname(require.resolve('expo/package.json', { paths: [projectRoot] }));
  const cliPackage = require.resolve('@expo/cli/package.json', { paths: [expoRoot] });
  const cliRoot = path.dirname(cliPackage);
  const cliVersion = require(cliPackage).version;
  if (cliVersion.startsWith('54.')) {
    const modulePath = path.join(cliRoot, 'build/src/start/doctor/apple/SimulatorAppPrerequisite.js');
    const { SimulatorAppPrerequisite } = require(modulePath);
    addDeviceHubFallback(SimulatorAppPrerequisite.instance);
  }
  const cliEntry = require.resolve('@expo/cli', { paths: [expoRoot] });
  process.env.APP_VARIANT = process.env.APP_VARIANT || 'development';
  process.argv = [process.execPath, cliEntry, 'run:ios', '--device', ...process.argv.slice(2)];
  require(cliEntry);
}

module.exports = { addDeviceHubFallback };
if (require.main === module) {
  try { main(); } catch (error) {
    process.stderr.write('BEŞ başlatılamadı: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
