import {
  useShiftStore,
  useScheduleStore,
  useDateScheduleStore,
  useCalendarDisplayStore,
} from '../../src/store/shiftStore';
import { createTestSession } from '../helpers';

describe('useShiftStore', () => {
  beforeEach(() => {
    useShiftStore.getState().reset();
  });

  it('초기 상태는 빈 폼이다', () => {
    const state = useShiftStore.getState();
    expect(state.jobName).toBe('');
    expect(state.wage).toBe(0);
    expect(state.wageType).toBe('hourly');
    expect(state.repeatOption).toBe('none');
  });

  it('setJobName으로 직업명을 변경한다', () => {
    useShiftStore.getState().setJobName('카페 알바');
    expect(useShiftStore.getState().jobName).toBe('카페 알바');
  });

  it('setWage로 급여를 변경한다', () => {
    useShiftStore.getState().setWage(15000);
    expect(useShiftStore.getState().wage).toBe(15000);
  });

  it('setWageType으로 급여 타입을 변경한다', () => {
    useShiftStore.getState().setWageType('daily');
    expect(useShiftStore.getState().wageType).toBe('daily');
  });

  it('reset()으로 모든 필드를 초기화한다', () => {
    useShiftStore.getState().setJobName('테스트');
    useShiftStore.getState().setWage(20000);
    useShiftStore.getState().reset();
    expect(useShiftStore.getState().jobName).toBe('');
    expect(useShiftStore.getState().wage).toBe(0);
  });
});

describe('useScheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.getState().clear();
  });

  it('addSchedule로 스케줄을 추가한다', () => {
    const session = createTestSession({ id: 'add-1' });
    useScheduleStore.getState().addSchedule(session);
    expect(useScheduleStore.getState().getScheduleById('add-1')).toBeDefined();
    expect(useScheduleStore.getState().getScheduleById('add-1')!.jobName).toBe('테스트 알바');
  });

  it('updateSchedule로 스케줄을 수정한다', () => {
    const session = createTestSession({ id: 'update-1' });
    useScheduleStore.getState().addSchedule(session);
    useScheduleStore.getState().updateSchedule('update-1', { jobName: '수정됨' });
    expect(useScheduleStore.getState().getScheduleById('update-1')!.jobName).toBe('수정됨');
  });

  it('deleteSchedule로 스케줄을 삭제한다', () => {
    const session = createTestSession({ id: 'delete-1' });
    useScheduleStore.getState().addSchedule(session);
    useScheduleStore.getState().deleteSchedule('delete-1');
    expect(useScheduleStore.getState().getScheduleById('delete-1')).toBeUndefined();
  });

  it('getAllSchedules로 전체 목록을 조회한다', () => {
    useScheduleStore.getState().addSchedule(createTestSession({ id: 'all-1' }));
    useScheduleStore.getState().addSchedule(createTestSession({ id: 'all-2' }));
    expect(useScheduleStore.getState().getAllSchedules().length).toBe(2);
  });

  it('clear로 전체 스케줄을 제거한다', () => {
    useScheduleStore.getState().addSchedule(createTestSession({ id: 'clear-1' }));
    useScheduleStore.getState().clear();
    expect(useScheduleStore.getState().getAllSchedules().length).toBe(0);
  });
});

describe('useDateScheduleStore', () => {
  beforeEach(() => {
    useDateScheduleStore.getState().clear();
  });

  it('setDateSchedule로 날짜-세션ID 매핑을 저장한다', () => {
    useDateScheduleStore.getState().setDateSchedule({
      '2026-04-01': ['s1', 's2'],
    });
    expect(useDateScheduleStore.getState().dateSchedule['2026-04-01']).toEqual(['s1', 's2']);
  });

  it('removeDateSchedule로 특정 날짜를 제거한다', () => {
    useDateScheduleStore.getState().setDateSchedule({
      '2026-04-01': ['s1'],
      '2026-04-02': ['s2'],
    });
    useDateScheduleStore.getState().removeDateSchedule('2026-04-01');
    expect(useDateScheduleStore.getState().dateSchedule['2026-04-01']).toBeUndefined();
    expect(useDateScheduleStore.getState().dateSchedule['2026-04-02']).toEqual(['s2']);
  });
});

describe('useCalendarDisplayStore', () => {
  beforeEach(() => {
    useCalendarDisplayStore.getState().clearCalendarDisplay();
  });

  it('setCalendarDisplay로 표시 데이터를 저장한다', () => {
    useCalendarDisplayStore.getState().setCalendarDisplay({
      '2026-04-01': [{ color: '#3D5AFE', selected: true, sessionId: 's1', jobName: '알바' }],
    });
    const items = useCalendarDisplayStore.getState().getCalendarDisplayForDate('2026-04-01');
    expect(items.length).toBe(1);
    expect(items[0].jobName).toBe('알바');
  });

  it('없는 날짜는 빈 배열을 반환한다', () => {
    const items = useCalendarDisplayStore.getState().getCalendarDisplayForDate('2026-04-01');
    expect(items).toEqual([]);
  });

  it('clearCalendarDisplay로 모든 데이터를 초기화한다', () => {
    useCalendarDisplayStore.getState().setCalendarDisplay({
      '2026-04-01': [{ color: '#3D5AFE', selected: true, sessionId: 's1', jobName: '알바' }],
    });
    useCalendarDisplayStore.getState().clearCalendarDisplay();
    expect(useCalendarDisplayStore.getState().getCalendarDisplayForDate('2026-04-01')).toEqual([]);
  });
});
