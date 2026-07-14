import { renderHook, act } from '@testing-library/react-native';
import { useScheduleManager } from '../../src/hooks/useScheduleManager';
import { useScheduleStore, useDateScheduleStore, useCalendarDisplayStore } from '../../src/store/shiftStore';
import { resetColorManager } from '../../src/utils/colorManager';

describe('useScheduleManager', () => {
  beforeEach(() => {
    useScheduleStore.getState().clear();
    useDateScheduleStore.getState().clear();
    useCalendarDisplayStore.getState().clearCalendarDisplay();
    resetColorManager();
  });

  // 급여는 더 이상 훅에서 미리 계산하지 않고(payFns의 파생 계산으로 전환),
  // addSchedule은 uuid 채번 + 스토어 반영만 담당한다.
  it('addSchedule로 uuid 채번 + 스토어 업데이트한다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        workplaceId: 'wp-1',
        wageType: 'hourly',
        wage: 10000,
        startTime: new Date(2026, 3, 15, 9, 0),
        endTime: new Date(2026, 3, 15, 18, 0),
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
    expect(schedules[0].workplaceId).toBe('wp-1');
    expect(schedules[0].id).toBeTruthy();
  });

  it('deleteSchedule로 스케줄 삭제 + 관련 데이터 정리한다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '삭제 테스트',
        wageType: 'daily',
        wage: 80000,
        startTime: new Date(2026, 3, 15, 9, 0),
        endTime: new Date(2026, 3, 15, 18, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    const schedules = result.current.getAllSchedules();
    const id = schedules[0].id;

    act(() => {
      result.current.deleteSchedule(id);
    });

    expect(result.current.getAllSchedules().length).toBe(0);
    expect(useDateScheduleStore.getState().dateSchedule).toEqual({});
  });

  it('clearAllData로 모든 스토어를 초기화한다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '초기화 테스트',
        wageType: 'daily',
        wage: 80000,
        startTime: new Date(2026, 3, 15, 9, 0),
        endTime: new Date(2026, 3, 15, 18, 0),
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    act(() => {
      result.current.clearAllData();
    });

    expect(useScheduleStore.getState().getAllSchedules().length).toBe(0);
  });
});
