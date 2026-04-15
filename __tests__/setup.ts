const mockStorage = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => mockStorage.get(key),
    set: (key: string, value: string) => mockStorage.set(key, value),
    delete: (key: string) => mockStorage.delete(key),
    clearAll: () => mockStorage.clear(),
  })),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => `test-uuid-${Math.random().toString(36).substring(2, 9)}`,
}));

jest.mock('@expo/vector-icons/Feather', () => 'Feather');

// 각 테스트 전 스토리지 초기화
beforeEach(() => {
  mockStorage.clear();
});
