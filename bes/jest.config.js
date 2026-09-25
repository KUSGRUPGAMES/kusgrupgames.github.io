/**
 * İki ayrı proje:
 *  - `mantik`: saf hesap ve doğrulayıcılar, düğüm ortamında, hızlı.
 *  - `bilesen`: React Native bileşenleri, jest-expo ile.
 * Ayrı tutmanın sebebi hız: mantık sınamaları 2 saniyede dönüyor ve
 * geliştirme sırasında en sık çalıştırılanlar onlar.
 */
module.exports = {
  projects: [
    {
      displayName: 'mantik',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Font ve görsel varlıkları paketleyici çözer; testte sahte modül yeter.
        '\\.(ttf|otf|png|jpg|jpeg|svg|webp|m4a|wav)$': '<rootDir>/__mocks__/assetStub.js',
      },
    },
    {
      displayName: 'bilesen',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/__tests__/**/*.test.tsx'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
      ],
    },
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
