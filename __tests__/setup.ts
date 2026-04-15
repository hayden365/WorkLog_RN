const storage = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => storage.get(key),
    set: (key: string, value: string) => storage.set(key, value),
    delete: (key: string) => storage.delete(key),
    clearAll: () => storage.clear(),
  })),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => `test-uuid-${Math.random().toString(36).substring(2, 9)}`,
}));

jest.mock('@expo/vector-icons/Feather', () => 'Feather');

// 각 테스트 전 스토리지 초기화
beforeEach(() => {
  storage.clear();
});
