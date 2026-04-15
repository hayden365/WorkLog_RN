import { formatNumberWithComma } from '../../src/utils/formatNumbs';

describe('formatNumberWithComma', () => {
  it('천 단위 콤마를 추가한다', () => {
    expect(formatNumberWithComma('1500000')).toBe('1,500,000');
  });

  it('1000 미만은 콤마 없이 반환한다', () => {
    expect(formatNumberWithComma('999')).toBe('999');
  });

  it('빈 문자열은 빈 문자열을 반환한다', () => {
    expect(formatNumberWithComma('')).toBe('');
  });

  it('숫자가 아닌 문자를 제거한다', () => {
    expect(formatNumberWithComma('1,500,000')).toBe('1,500,000');
  });

  it('정확히 1000일 때 콤마를 추가한다', () => {
    expect(formatNumberWithComma('1000')).toBe('1,000');
  });
});
