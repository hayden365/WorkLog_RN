import { font, fontFamily, numeric } from '../../src/theme/tokens';

describe('typography helpers', () => {
  test('font() maps weight to Pretendard family + RN weight', () => {
    expect(font('bold')).toEqual({ fontFamily: 'Pretendard-Bold', fontWeight: '700' });
    expect(font('semibold')).toEqual({ fontFamily: 'Pretendard-SemiBold', fontWeight: '600' });
    expect(font('medium')).toEqual({ fontFamily: 'Pretendard-Medium', fontWeight: '500' });
    expect(font()).toEqual({ fontFamily: 'Pretendard-Regular', fontWeight: '400' });
  });

  test('fontFamily map exposes the four Pretendard families', () => {
    expect(fontFamily.regular).toBe('Pretendard-Regular');
    expect(fontFamily.bold).toBe('Pretendard-Bold');
  });

  test('numeric enables tabular figures', () => {
    expect(numeric.fontVariant).toContain('tabular-nums');
  });
});
