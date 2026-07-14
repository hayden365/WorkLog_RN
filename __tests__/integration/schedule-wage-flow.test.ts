import { renderHook, act } from '@testing-library/react-native';
import { useScheduleManager } from '../../src/hooks/useScheduleManager';
import { useScheduleStore, useDateScheduleStore, useCalendarDisplayStore } from '../../src/store/shiftStore';
import { useWorkplaceStore } from '../../src/store/workplaceStore';
import { computeMonthlyTotal, resolveSession } from '../../src/utils/payFns';
import { generateViewMonthScheduleData } from '../../src/utils/calendarfns';
import { resetColorManager } from '../../src/utils/colorManager';
import { Workplace } from '../../src/models/Workplace';
import { WorkSession } from '../../src/models/WorkSession';

// 급여는 더 이상 세션에 미리 계산되어 저장되지 않는다(구 calculatedDailyWage 캐시 제거).
// 이 통합 테스트는 스케줄 생성/삭제 → 캘린더 반영 → 근무지+세션 파생 계산
// (computeMonthlyTotal)까지의 전체 흐름을 검증한다.
describe('스케줄 생성 → 캘린더 → 급여 계산 통합 플로우', () => {
  const cafe: Workplace = {
    id: 'wp-cafe',
    name: '카페',
    color: '#111111',
    wageType: 'hourly',
    wage: 10000,
    defaultBreakMinutes: 0,
    archived: false,
  };
  const store: Workplace = {
    id: 'wp-store',
    name: '편의점',
    color: '#222222',
    wageType: 'daily',
    wage: 80000,
    defaultBreakMinutes: 0,
    archived: false,
  };

  beforeEach(() => {
    useScheduleStore.getState().clear();
    useDateScheduleStore.getState().clear();
    useCalendarDisplayStore.getState().clearCalendarDisplay();
    useWorkplaceStore.setState({ workplacesById: {} });
    useWorkplaceStore.getState().addWorkplace(cafe);
    useWorkplaceStore.getState().addWorkplace(store);
    resetColorManager();
  });

  // calendarfns.generateViewMonthScheduleData는 근무지 병합 결과(ResolvedSession[])를
  // 입력으로 받으므로, 저장된 원본 WorkSession[]을 각 근무지에 대해 해석한다.
  const resolveAll = (schedules: WorkSession[]) =>
    schedules.map((s) => resolveSession(s, useWorkplaceStore.getState().workplacesById[s.workplaceId]));

  it('스케줄 생성 → 캘린더에 반영 → 월급여 합산', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        workplaceId: 'wp-cafe',
        wageType: null,
        wage: null,
        breakMinutes: null,
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
    expect(schedules[0].workplaceId).toBe('wp-cafe');

    const { markedDates, dateSchedule } = generateViewMonthScheduleData(
      resolveAll(schedules),
      new Date(2026, 3, 1)
    );

    expect(Object.keys(markedDates).length).toBe(30);

    const monthlyWage = computeMonthlyTotal(
      dateSchedule,
      result.current.allSchedulesById,
      useWorkplaceStore.getState().workplacesById,
      new Date(2026, 3, 1)
    ).net;

    expect(monthlyWage).toBe(90000 * 30);
  });

  it('여러 급여 타입 혼합 → 정확한 월급여 합산', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        workplaceId: 'wp-cafe',
        wageType: null,
        wage: null,
        breakMinutes: null,
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
        workplaceId: 'wp-store',
        wageType: null,
        wage: null,
        breakMinutes: null,
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
      resolveAll(schedules),
      new Date(2026, 3, 1)
    );

    const monthlyWage = computeMonthlyTotal(
      dateSchedule,
      result.current.allSchedulesById,
      useWorkplaceStore.getState().workplacesById,
      new Date(2026, 3, 1)
    ).net;

    // 카페: 50000 × 30일 = 1,500,000
    // 편의점: 80000 × 10일 = 800,000
    // 합계: 2,300,000
    expect(monthlyWage).toBe(2300000);
  });

  it('스케줄 삭제 후 급여 재계산에 반영된다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        workplaceId: 'wp-store',
        wageType: null,
        wage: 100000,
        breakMinutes: null,
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
      resolveAll(result.current.getAllSchedules()),
      new Date(2026, 3, 1)
    );

    const monthlyWage = computeMonthlyTotal(
      dateSchedule,
      result.current.allSchedulesById,
      useWorkplaceStore.getState().workplacesById,
      new Date(2026, 3, 1)
    ).net;

    expect(monthlyWage).toBe(0);
  });

  it('빈 월은 0원을 반환한다', () => {
    const monthlyWage = computeMonthlyTotal(
      {},
      {},
      useWorkplaceStore.getState().workplacesById,
      new Date(2026, 3, 1)
    ).net;
    expect(monthlyWage).toBe(0);
  });
});
