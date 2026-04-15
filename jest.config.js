module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-calendars|react-native-mmkv|react-native-uuid|react-native-modal|@expo|expo|@react-native-community|@react-native-segmented-control|react-native-popup-menu|react-native-picker-select|react-native-safe-area-context|react-native-screens|react-native-google-mobile-ads)/)',
  ],
  moduleNameMapper: {
    '^@expo/vector-icons$': '<rootDir>/__tests__/__mocks__/@expo/vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__tests__/__mocks__/@expo/vector-icons.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
