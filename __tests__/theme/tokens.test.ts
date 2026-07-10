import { font, FONT_FAMILY, numeric } from '../../src/theme/tokens';

describe('typography helpers', () => {
  test('font() binds the single Pretendard family + the RN weight', () => {
    expect(font('bold')).toEqual({ fontFamily: 'Pretendard', fontWeight: '700' });
    expect(font('semibold')).toEqual({ fontFamily: 'Pretendard', fontWeight: '600' });
    expect(font('medium')).toEqual({ fontFamily: 'Pretendard', fontWeight: '500' });
    expect(font()).toEqual({ fontFamily: 'Pretendard', fontWeight: '400' });
  });

  test('FONT_FAMILY is the embedded Pretendard family name', () => {
    expect(FONT_FAMILY).toBe('Pretendard');
  });

  test('numeric enables tabular figures', () => {
    expect(numeric.fontVariant).toContain('tabular-nums');
  });
});
