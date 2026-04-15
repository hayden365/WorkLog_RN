module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-calendars|react-native-mmkv|react-native-uuid|react-native-modal|@expo|expo|@react-native-community|@react-native-segmented-control|react-native-popup-menu|react-native-picker-select|react-native-safe-area-context|react-native-screens)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
