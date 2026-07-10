import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
} from 'react-native';
import { FONT_FAMILY } from '../theme/tokens';

/**
 * Prepend the Pretendard family so any bare <Text> renders Pretendard, while the
 * call site's own style (including its fontWeight, or an explicit fontFamily)
 * still wins because it comes last. Weight selection is handled natively by the
 * embedded font family — we only need to name the family here.
 */
export function withFontFamily(style?: TextProps['style']): TextProps['style'] {
  return [{ fontFamily: FONT_FAMILY }, style];
}

/** `Text` 드롭인. 앱 전역 기본 폰트를 Pretendard로 만든다. */
export const AppText = React.forwardRef<RNText, TextProps>(
  ({ style, ...rest }, ref) => (
    <RNText ref={ref} {...rest} style={withFontFamily(style)} />
  ),
);
AppText.displayName = 'AppText';

/** `TextInput` 드롭인. */
export const AppTextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ style, ...rest }, ref) => (
    <RNTextInput
      ref={ref}
      {...rest}
      style={withFontFamily(style) as TextInputProps['style']}
    />
  ),
);
AppTextInput.displayName = 'AppTextInput';
