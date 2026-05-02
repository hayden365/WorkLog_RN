import { useThemeStore } from '../../src/store/themeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.getState().setMode('system');
  });

  it('초기 mode는 system이다', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('setMode로 mode를 dark로 변경한다', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('setMode로 mode를 light로 변경한다', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('setMode로 mode를 system으로 되돌린다', () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().mode).toBe('system');
  });
});
