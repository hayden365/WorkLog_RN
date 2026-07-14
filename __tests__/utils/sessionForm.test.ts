import { resolveEditInitValues, toSavedOverrides } from '../../src/utils/sessionForm';
import { Workplace } from '../../src/models/Workplace';
import { createTestSession } from '../helpers';

const workplace = (o: Partial<Workplace> = {}): Workplace => ({
  id: 'wp1',
  name: '카페',
  color: '#111111',
  wageType: 'hourly',
  wage: 10000,
  defaultBreakMinutes: 60,
  archived: false,
  ...o,
});

describe('resolveEditInitValues', () => {
  it('(a) 오버라이드가 null이고 근무지가 월급제이면 월급제·근무지 급여를 반환한다 (시급/0으로 변조되지 않음)', () => {
    const session = createTestSession({ wage: null, wageType: null, breakMinutes: null });
    const wp = workplace({ wageType: 'monthly', wage: 2500000 });
    const result = resolveEditInitValues(session, wp);
    expect(result.wageType).toBe('monthly');
    expect(result.wage).toBe(2500000);
    expect(result.breakMinutes).toBeNull();
  });

  it('(b) 오버라이드가 null이고 근무지가 일급제이면 일급제·근무지 급여를 반환한다', () => {
    const session = createTestSession({ wage: null, wageType: null, breakMinutes: null });
    const wp = workplace({ wageType: 'daily', wage: 100000 });
    const result = resolveEditInitValues(session, wp);
    expect(result.wageType).toBe('daily');
    expect(result.wage).toBe(100000);
  });

  it('(c) 세션에 구체적인 오버라이드가 있으면 근무지 값보다 우선한다', () => {
    const session = createTestSession({ wage: 15000, wageType: 'hourly', breakMinutes: 30 });
    const wp = workplace({ wageType: 'monthly', wage: 2500000, defaultBreakMinutes: 60 });
    const result = resolveEditInitValues(session, wp);
    expect(result.wageType).toBe('hourly');
    expect(result.wage).toBe(15000);
    expect(result.breakMinutes).toBe(30);
  });

  it('(d) 근무지를 찾을 수 없으면 크래시 없이 시급/0으로 폴백한다', () => {
    const session = createTestSession({ wage: null, wageType: null, breakMinutes: null });
    const result = resolveEditInitValues(session, undefined);
    expect(result.wageType).toBe('hourly');
    expect(result.wage).toBe(0);
    expect(result.breakMinutes).toBeNull();
  });
});

describe('toSavedOverrides', () => {
  it('입력값이 근무지 기본값과 같으면 null로 저장해 상속을 유지한다', () => {
    const wp = workplace({ wageType: 'daily', wage: 80000 });
    const result = toSavedOverrides({ wageType: 'daily', wage: 80000 }, wp);
    expect(result).toEqual({ wageType: null, wage: null });
  });

  it('입력값이 근무지 기본값과 다르면 구체값을 그대로 저장한다', () => {
    const wp = workplace({ wageType: 'daily', wage: 80000 });
    const result = toSavedOverrides({ wageType: 'daily', wage: 90000 }, wp);
    expect(result).toEqual({ wageType: 'daily', wage: 90000 });
  });

  it('급여유형이 다르면(급여가 같아도) 구체값을 그대로 저장한다', () => {
    const wp = workplace({ wageType: 'hourly', wage: 10000 });
    const result = toSavedOverrides({ wageType: 'daily', wage: 10000 }, wp);
    expect(result).toEqual({ wageType: 'daily', wage: 10000 });
  });

  it('근무지를 찾을 수 없으면 항상 구체값을 저장한다', () => {
    const result = toSavedOverrides({ wageType: 'hourly', wage: 10000 }, undefined);
    expect(result).toEqual({ wageType: 'hourly', wage: 10000 });
  });
});
