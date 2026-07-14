import { MMKV } from 'react-native-mmkv';
import { runWorkplaceMigration, MIGRATION_FLAG_KEY, SCHEDULE_BACKUP_KEY } from '../../src/store/migrations/runWorkplaceMigration';

const storage = new MMKV();

// zustand persist 저장 형태를 모사
const persisted = (state: any) => JSON.stringify({ state, version: 1 });

const oldSession = (id: string, jobName: string, wage: number) => ({
  id, jobName, wageType: 'hourly', wage, color: '#111',
  calculatedDailyWage: null,
  startTime: '2026-04-15T09:00:00.000Z', endTime: '2026-04-15T18:00:00.000Z',
  startDate: '2026-04-15T00:00:00.000Z', endDate: null,
  repeatOption: 'none', selectedWeekDays: [], isCurrentlyWorking: true, description: '',
});

describe('runWorkplaceMigration', () => {
  beforeEach(() => { storage.clearAll(); });

  it('구 세션을 근무지+참조 세션으로 변환하고 백업·플래그를 남긴다', () => {
    storage.set('schedule-store', persisted({
      allSchedulesById: { s1: oldSession('s1', '카페', 10000), s2: oldSession('s2', '카페', 10000) },
    }));

    const ran = runWorkplaceMigration();
    expect(ran).toBe(true);

    // 근무지 스토어 생성됨
    const wp = JSON.parse(storage.getString('workplace-store')!);
    expect(Object.keys(wp.state.workplacesById).length).toBe(1);

    // 세션이 workplaceId를 갖고 구 필드가 제거됨
    const sched = JSON.parse(storage.getString('schedule-store')!);
    const s1 = sched.state.allSchedulesById.s1;
    expect(typeof s1.workplaceId).toBe('string');
    expect(s1.wage).toBeNull();
    expect('jobName' in s1).toBe(false);

    // 백업 + 플래그
    expect(storage.getString(SCHEDULE_BACKUP_KEY)).toBeTruthy();
    expect(storage.getString(MIGRATION_FLAG_KEY)).toBe('1');
  });

  it('이미 완료됐으면 재실행하지 않는다', () => {
    storage.set(MIGRATION_FLAG_KEY, '1');
    expect(runWorkplaceMigration()).toBe(false);
  });

  it('불변식: 마이그레이션 후 시급 계산이 이전과 동일하다', () => {
    storage.set('schedule-store', persisted({
      allSchedulesById: { s1: oldSession('s1', '카페', 10000) },
    }));
    runWorkplaceMigration();

    const wp = JSON.parse(storage.getString('workplace-store')!);
    const sched = JSON.parse(storage.getString('schedule-store')!);
    const workplace = Object.values<any>(wp.state.workplacesById)[0];
    const s1 = sched.state.allSchedulesById.s1;

    // 유효 시급 = 오버라이드(null) → 근무지 기본값, 휴게 0 → 9시간 × 10000 = 90000
    const effectiveWage = s1.wage ?? workplace.wage;
    const effectiveBreak = s1.breakMinutes ?? workplace.defaultBreakMinutes;
    expect(effectiveWage).toBe(10000);
    expect(effectiveBreak).toBe(0);
  });
});
