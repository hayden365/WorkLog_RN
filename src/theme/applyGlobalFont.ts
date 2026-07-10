import { Text, TextInput } from 'react-native';
import { fontFamily } from './tokens';

/**
 * Makes Pretendard-Regular the app-wide default so every screen (not just the
 * redesigned Home) drops the system font. Weight-precise call sites still use
 * `font()`; this only sets the baseline family. Idempotent.
 */
export function applyGlobalFont(): void {
  const base = { fontFamily: fontFamily.regular };
  for (const Comp of [Text, TextInput] as any[]) {
    Comp.defaultProps = Comp.defaultProps || {};
    Comp.defaultProps.style = [base, Comp.defaultProps.style];
  }
}
