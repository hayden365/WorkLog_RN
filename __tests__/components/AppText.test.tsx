import { StyleSheet } from 'react-native';
import { withFontFamily } from '../../src/components/AppText';

describe('withFontFamily', () => {
  test('injects the Pretendard family while preserving the call-site weight', () => {
    const flat = StyleSheet.flatten(withFontFamily({ fontWeight: '700' }));
    expect(flat.fontFamily).toBe('Pretendard');
    expect(flat.fontWeight).toBe('700');
  });

  test('applies Pretendard when no style is given', () => {
    const flat = StyleSheet.flatten(withFontFamily());
    expect(flat.fontFamily).toBe('Pretendard');
  });

  test('an explicit fontFamily in the call-site style wins', () => {
    const flat = StyleSheet.flatten(withFontFamily({ fontFamily: 'Other' }));
    expect(flat.fontFamily).toBe('Other');
  });
});
