import { calculateDailyWage, displayMonthlyWage } from '../../src/utils/wageFns';
import { createTestSession } from '../helpers';
import { ScheduleByDate, SchedulesById } from '../../src/models/WorkSession';

describe('calculateDailyWage', () => {
  it('시급 × 근무시간 = 일급을 계산한다', () => {
    const session = createTestSession({
      wageType: 'hourly',
      wage: 10000,
      startTime: new Date(2026, 3, 15, 9, 0),
      endTime: new Date(2026, 3, 15, 18, 0),
    });
    expect(calculateDailyWage(session)).toBe(90000);
  });

  it('일급 타입이면 wage를 그대로 반환한다', () => {
    const session = createTestSession({
      wageType: 'daily',
      wage: 80000,
    });
    expect(calculateDailyWage(session)).toBe(80000);
  });

  it('월급 타입이면 null을 반환한다', () => {
    const session = createTestSession({
      wageType: 'monthly',
      wage: 3000000,
    });
    expect(calculateDailyWage(session)).toBeNull();
  });

  it('시급 반시간 단위도 정확히 계산한다', () => {
    const session = createTestSession({
      wageType: 'hourly',
      wage: 10000,
      startTime: new Date(2026, 3, 15, 9, 0),
      endTime: new Date(2026, 3, 15, 13, 30),
    });
    expect(calculateDailyWage(session)).toBe(45000);
  });

  it('자정을 넘기는 야간 근무도 정확히 계산한다', () => {
    const session = createTestSession({
      wageType: 'hourly',
      wage: 10000,
      startTime: new Date(2026, 3, 15, 22, 0),
      endTime: new Date(2026, 3, 16, 6, 0),
    });
    // 22:00 ~ 06:00 = 8시간 × 10000 = 80000
    expect(calculateDailyWage(session)).toBe(80000);
  });
});

describe('displayMonthlyWage', () => {
  it('해당 월 근무일수 × 일급을 합산한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1'],
      '2026-04-02': ['s1'],
      '2026-04-03': ['s1'],
    };
    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: 90000 }),
    };
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(270000);
  });

  it('여러 스케줄의 급여를 합산한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1', 's2'],
      '2026-04-02': ['s1'],
    };
    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: 80000 }),
      s2: createTestSession({ id: 's2', calculatedDailyWage: 100000 }),
    };
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(260000);
  });

  it('스케줄이 없으면 0을 반환한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    expect(displayMonthlyWage({}, {}, viewMonth)).toBe(0);
  });

  it('calculatedDailyWage가 null인 세션은 건너뛴다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = { '2026-04-01': ['s1'] };
    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: null }),
    };
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(0);
  });

  it('다른 월의 날짜는 제외한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1'],
      '2026-05-01': ['s1'],
    };
    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: 90000 }),
    };
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(90000);
  });

  it('월급 세션은 그 달에 근무일이 있으면 전액을 1회만 더한다 (발생주의)', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['m1'],
      '2026-04-02': ['m1'],
      '2026-04-03': ['m1'],
    };
    const allSchedulesById: SchedulesById = {
      m1: createTestSession({
        id: 'm1',
        wageType: 'monthly',
        wage: 3000000,
        calculatedDailyWage: null,
      }),
    };
    // 3일 근무했지만 월급이므로 300만원 1회만 반영
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(3000000);
  });

  it('월급 세션과 시급 세션을 함께 합산한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['m1', 's1'],
      '2026-04-02': ['m1'],
    };
    const allSchedulesById: SchedulesById = {
      m1: createTestSession({
        id: 'm1',
        wageType: 'monthly',
        wage: 3000000,
        calculatedDailyWage: null,
      }),
      s1: createTestSession({ id: 's1', calculatedDailyWage: 90000 }),
    };
    // 월급 300만 (1회) + 시급 일급 90000 (1일) = 3090000
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(3090000);
  });

  it('월급 세션이 그 달에 근무일이 없으면 더하지 않는다', () => {
    const viewMonth = new Date(2026, 3, 1);
    const dateSchedule: ScheduleByDate = {
      '2026-05-01': ['m1'],
    };
    const allSchedulesById: SchedulesById = {
      m1: createTestSession({
        id: 'm1',
        wageType: 'monthly',
        wage: 3000000,
        calculatedDailyWage: null,
      }),
    };
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(0);
  });
});
