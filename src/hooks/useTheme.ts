import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, Scheme, ThemeColors } from '../theme/colors';

export function useTheme(): { scheme: Scheme; colors: ThemeColors } {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  let scheme: Scheme;
  if (mode === 'light' || mode === 'dark') {
    scheme = mode;
  } else {
    scheme = systemScheme === 'dark' ? 'dark' : 'light';
  }

  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { scheme, colors };
}
