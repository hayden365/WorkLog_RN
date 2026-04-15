import { renderHook, act } from '@testing-library/react-native';
import { useScheduleManager } from '../../src/hooks/useScheduleManager';
import { useScheduleStore, useDateScheduleStore, useCalendarDisplayStore } from '../../src/store/shiftStore';
import { displayMonthlyWage } from '../../src/utils/wageFns';
import { generateViewMonthScheduleData } from '../../src/utils/calendarfns';
import { resetColorManager } from '../../src/utils/colorManager';

describe('스케줄 생성 → 캘린더 → 급여 계산 통합 플로우', () => {
  beforeEach(() => {
    useScheduleStore.getState().clear();
    useDateScheduleStore.getState().clear();
    useCalendarDisplayStore.getState().clearCalendarDisplay();
    resetColorManager();
  });

  it('스케줄 생성 → 캘린더에 반영 → 월급여 합산', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '카페',
        wageType: 'hourly',
        wage: 10000,
        startTime: new Date(2026, 3, 1, 9, 0),
        endTime: new Date(2026, 3, 1, 18, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    const schedules = result.current.getAllSchedules();
    expect(schedules.length).toBe(1);
    expect(schedules[0].calculatedDailyWage).toBe(90000);

    const { markedDates, dateSchedule } = generateViewMonthScheduleData(
      schedules,
      new Date(2026, 3, 1)
    );

    expect(Object.keys(markedDates).length).toBe(30);

    const monthlyWage = displayMonthlyWage(
      dateSchedule,
      result.current.allSchedulesById,
      new Date(2026, 3, 1)
    );

    expect(monthlyWage).toBe(90000 * 30);
  });

  it('여러 급여 타입 혼합 → 정확한 월급여 합산', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '카페',
        wageType: 'hourly',
        wage: 10000,
        startTime: new Date(2026, 3, 1, 9, 0),
        endTime: new Date(2026, 3, 1, 14, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    act(() => {
      result.current.addSchedule({
        jobName: '편의점',
        wageType: 'daily',
        wage: 80000,
        startTime: new Date(2026, 3, 1, 18, 0),
        endTime: new Date(2026, 3, 1, 23, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 10),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    const schedules = result.current.getAllSchedules();
    expect(schedules.length).toBe(2);

    const { dateSchedule } = generateViewMonthScheduleData(
      schedules,
      new Date(2026, 3, 1)
    );

    const monthlyWage = displayMonthlyWage(
      dateSchedule,
      result.current.allSchedulesById,
      new Date(2026, 3, 1)
    );

    // 카페: 50000 × 30일 = 1,500,000
    // 편의점: 80000 × 10일 = 800,000
    // 합계: 2,300,000
    expect(monthlyWage).toBe(2300000);
  });

  it('스케줄 삭제 후 급여 재계산에 반영된다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '삭제될 스케줄',
        wageType: 'daily',
        wage: 100000,
        startTime: new Date(2026, 3, 1, 9, 0),
        endTime: new Date(2026, 3, 1, 18, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 10),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    const id = result.current.getAllSchedules()[0].id;

    act(() => {
      result.current.deleteSchedule(id);
    });

    const { dateSchedule } = generateViewMonthScheduleData(
      result.current.getAllSchedules(),
      new Date(2026, 3, 1)
    );

    const monthlyWage = displayMonthlyWage(
      dateSchedule,
      result.current.allSchedulesById,
      new Date(2026, 3, 1)
    );

    expect(monthlyWage).toBe(0);
  });

  it('빈 월은 0원을 반환한다', () => {
    const monthlyWage = displayMonthlyWage({}, {}, new Date(2026, 3, 1));
    expect(monthlyWage).toBe(0);
  });
});
