'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { addDeviceHubFallback } = require('./ios-device.cjs');

function fixture({ originalError, version = 'Xcode 27.0', id = 'com.apple.dt.Devices', brokenSimctl = false } = {}) {
  const calls = [];
  const prerequisite = {
    async assertImplementation() { if (originalError) throw originalError; },
    resetAssertion() { this.assertAsync = this.assertImplementation.bind(this); },
  };
  addDeviceHubFallback(prerequisite, (command, args) => {
    calls.push([command, args]);
    if (command === 'xcodebuild') return version;
    if (command === 'xcode-select') return '/Volumes/Development/Xcode.app/Contents/Developer\n';
    if (command === '/usr/bin/defaults') return id;
    if (command === 'xcrun' && brokenSimctl) throw new Error('simctl failed');
    return 'OK';
  });
  return { prerequisite, calls };
}
const missingSimulator = () => Object.assign(new Error('Simulator missing'), { code: 'VALIDATE_SIMULATOR_APP' });

test('working original check does not invoke fallback', async () => {
  const { prerequisite, calls } = fixture();
  await prerequisite.assertAsync();
  assert.equal(calls.length, 0);
});
test('Xcode 27 uses active developer directory and verifies Device Hub and simctl', async () => {
  const { prerequisite, calls } = fixture({ originalError: missingSimulator() });
  await prerequisite.assertAsync();
  assert.deepEqual(calls[2], ['/usr/bin/defaults', ['read', '/Volumes/Development/Xcode.app/Contents/Applications/DeviceHub.app/Contents/Info.plist', 'CFBundleIdentifier']]);
  assert.deepEqual(calls[3], ['xcrun', ['simctl', 'help']]);
});
test('older Xcode retains missing Simulator error', async () => {
  const error = missingSimulator();
  const { prerequisite } = fixture({ originalError: error, version: 'Xcode 26.2' });
  await assert.rejects(prerequisite.assertAsync(), error);
});
test('unrelated prerequisite failures are preserved', async () => {
  const error = Object.assign(new Error('tool failed'), { code: 'VALIDATE_SIMCTL' });
  const { prerequisite, calls } = fixture({ originalError: error });
  await assert.rejects(prerequisite.assertAsync(), error);
  assert.equal(calls.length, 0);
});
test('unexpected Device Hub bundle identity is rejected', async () => {
  const { prerequisite } = fixture({ originalError: missingSimulator(), id: 'unexpected.bundle' });
  await assert.rejects(prerequisite.assertAsync(), /kimliği doğrulanamadı/);
});
test('broken simctl remains a blocking error', async () => {
  const { prerequisite } = fixture({ originalError: missingSimulator(), brokenSimctl: true });
  await assert.rejects(prerequisite.assertAsync(), /simctl failed/);
});
