import { renderHook } from '@testing-library/react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useThemeStore } from '../../src/store/themeStore';
import { lightColors, darkColors } from '../../src/theme/colors';

const mockUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

describe('useTheme', () => {
  beforeEach(() => {
    useThemeStore.getState().setMode('system');
    mockUseColorScheme.mockReset();
  });

  it('mode === light 면 lightColors 반환', () => {
    useThemeStore.getState().setMode('light');
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toEqual(lightColors);
  });

  it('mode === dark 면 darkColors 반환', () => {
    useThemeStore.getState().setMode('dark');
    mockUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toEqual(darkColors);
  });

  it('mode === system 이고 시스템이 dark면 darkColors 반환', () => {
    useThemeStore.getState().setMode('system');
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toEqual(darkColors);
  });

  it('mode === system 이고 시스템이 light면 lightColors 반환', () => {
    useThemeStore.getState().setMode('system');
    mockUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toEqual(lightColors);
  });

  it('mode === system 이고 useColorScheme이 null이면 light로 fallback', () => {
    useThemeStore.getState().setMode('system');
    mockUseColorScheme.mockReturnValue(null);
    const { result } = renderHook(() => useTheme());
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toEqual(lightColors);
  });
});
