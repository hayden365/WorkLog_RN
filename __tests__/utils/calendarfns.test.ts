import {
  calculateScheduleByDate,
  getMarkedDatesFromNoneSchedule,
  getMarkedDatesFromDailySchedule,
  getMarkedDatesFromWeeklySchedule,
  getMarkedDatesFromBiweeklySchedule,
  getMarkedDatesFromMonthlySchedule,
  generateViewMonthScheduleData,
} from '../../src/utils/calendarfns';
import { createTestSession } from '../helpers';

describe('calculateScheduleByDate', () => {
  it('날짜에 세션 ID를 매핑한다', () => {
    const result = calculateScheduleByDate(
      ['2026-04-01', '2026-04-02'],
      'session-1',
      {}
    );
    expect(result['2026-04-01']).toEqual(['session-1']);
    expect(result['2026-04-02']).toEqual(['session-1']);
  });

  it('기존 매핑에 세션 ID를 추가한다', () => {
    const existing = { '2026-04-01': ['session-1'] };
    const result = calculateScheduleByDate(['2026-04-01'], 'session-2', existing);
    expect(result['2026-04-01']).toEqual(['session-1', 'session-2']);
  });

  it('같은 세션 ID는 중복 추가하지 않는다', () => {
    const existing = { '2026-04-01': ['session-1'] };
    const result = calculateScheduleByDate(['2026-04-01'], 'session-1', existing);
    expect(result['2026-04-01']).toEqual(['session-1']);
  });
});

describe('getMarkedDatesFromNoneSchedule', () => {
  it('단일 날짜(endDate=null)를 마킹한다', () => {
    const session = createTestSession({
      id: 'none-1',
      repeatOption: 'none',
      startDate: new Date(2026, 3, 15),
      endDate: null,
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromNoneSchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });
    expect(Object.keys(result)).toEqual(['2026-04-15']);
    expect(result['2026-04-15'].sessionId).toBe('none-1');
  });

  it('날짜 범위를 마킹한다', () => {
    const session = createTestSession({
      id: 'none-2',
      repeatOption: 'none',
      startDate: new Date(2026, 3, 15),
      endDate: new Date(2026, 3, 17),
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromNoneSchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });
    expect(Object.keys(result).sort()).toEqual([
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
    ]);
  });
});

describe('getMarkedDatesFromDailySchedule', () => {
  it('시작일~종료일 사이 매일 마킹한다', () => {
    const session = createTestSession({
      id: 'daily-1',
      repeatOption: 'daily',
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 30),
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromDailySchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });
    expect(Object.keys(result).length).toBe(30);
  });
});

describe('getMarkedDatesFromWeeklySchedule', () => {
  it('선택된 요일만 마킹한다 (월,수,금 = 1,3,5)', () => {
    const session = createTestSession({
      id: 'weekly-1',
      repeatOption: 'weekly',
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 30),
      selectedWeekDays: new Set([1, 3, 5]),
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromWeeklySchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });
    const dates = Object.keys(result).sort();
    dates.forEach((dateStr) => {
      const day = new Date(dateStr).getDay();
      expect([1, 3, 5]).toContain(day);
    });
  });
});

describe('getMarkedDatesFromBiweeklySchedule', () => {
  it('격주로 선택된 요일만 마킹한다', () => {
    const session = createTestSession({
      id: 'biweekly-1',
      repeatOption: 'biweekly',
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 30),
      selectedWeekDays: new Set([1, 3]),
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromBiweeklySchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });
    const dates = Object.keys(result);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.length).toBeLessThanOrEqual(6);
  });
});

describe('getMarkedDatesFromMonthlySchedule', () => {
  it('매월 같은 날짜를 마킹한다', () => {
    const session = createTestSession({
      id: 'monthly-1',
      repeatOption: 'monthly',
      startDate: new Date(2026, 3, 15),
      endDate: null,
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromMonthlySchedule({
      schedule: session,
      viewMonth: new Date(2026, 4, 1),
    });
    expect(Object.keys(result)).toEqual(['2026-05-15']);
  });
});

describe('generateViewMonthScheduleData', () => {
  it('여러 패턴을 통합하여 markedDates와 dateSchedule을 반환한다', () => {
    const sessions = [
      createTestSession({
        id: 'daily-1',
        repeatOption: 'daily',
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 5),
        color: '#3D5AFE',
      }),
      createTestSession({
        id: 'none-1',
        repeatOption: 'none',
        startDate: new Date(2026, 3, 3),
        endDate: null,
        color: '#2b7dd4ff',
      }),
    ];
    const { markedDates, dateSchedule } = generateViewMonthScheduleData(
      sessions,
      new Date(2026, 3, 1)
    );
    expect(markedDates['2026-04-03'].length).toBe(2);
    expect(dateSchedule['2026-04-03']).toEqual(['daily-1', 'none-1']);
  });

  it('빈 스케줄 배열이면 빈 결과를 반환한다', () => {
    const { markedDates, dateSchedule } = generateViewMonthScheduleData(
      [],
      new Date(2026, 3, 1)
    );
    expect(Object.keys(markedDates).length).toBe(0);
    expect(Object.keys(dateSchedule).length).toBe(0);
  });
});
