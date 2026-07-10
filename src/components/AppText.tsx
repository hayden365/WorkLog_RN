import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  TextProps,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { fontFamily } from '../theme/tokens';

/** RN fontWeight → 대응 Pretendard 패밀리명. */
export function familyForWeight(weight?: TextStyle['fontWeight']): string {
  switch (String(weight)) {
    case '500':
      return fontFamily.medium;
    case '600':
      return fontFamily.semibold;
    case '700':
    case 'bold':
      return fontFamily.bold;
    default:
      return fontFamily.regular;
  }
}

/** 전달된 스타일에 Pretendard 패밀리를 비파괴적으로 주입. 이미 fontFamily가 있으면 존중. */
function withFamily(style: TextProps['style']) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const family = flat.fontFamily ?? familyForWeight(flat.fontWeight);
  return [style, { fontFamily: family }];
}

/** `Text` 드롭인. 앱 전역 기본 폰트를 Pretendard로 만든다. */
export const AppText = React.forwardRef<RNText, TextProps>(
  ({ style, ...rest }, ref) => (
    <RNText ref={ref} {...rest} style={withFamily(style)} />
  ),
);
AppText.displayName = 'AppText';

/** `TextInput` 드롭인. */
export const AppTextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ style, ...rest }, ref) => (
    <RNTextInput ref={ref} {...rest} style={withFamily(style)} />
  ),
);
AppTextInput.displayName = 'AppTextInput';
