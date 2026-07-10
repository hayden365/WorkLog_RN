import { familyForWeight } from '../../src/components/AppText';

describe('familyForWeight', () => {
  test('maps numeric + keyword weights to Pretendard families', () => {
    expect(familyForWeight('700')).toBe('Pretendard-Bold');
    expect(familyForWeight('800')).toBe('Pretendard-Bold');
    expect(familyForWeight('900')).toBe('Pretendard-Bold');
    expect(familyForWeight('bold')).toBe('Pretendard-Bold');
    expect(familyForWeight('600')).toBe('Pretendard-SemiBold');
    expect(familyForWeight('500')).toBe('Pretendard-Medium');
    expect(familyForWeight('400')).toBe('Pretendard-Regular');
    expect(familyForWeight(undefined)).toBe('Pretendard-Regular');
  });
});
