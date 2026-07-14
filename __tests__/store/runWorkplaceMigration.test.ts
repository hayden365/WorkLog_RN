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

  it('손상된 schedule-store에서도 예외 없이 false를 반환하고 플래그를 세우지 않는다', () => {
    storage.set('schedule-store', '{{{not json');

    let ran: boolean | undefined;
    expect(() => {
      ran = runWorkplaceMigration();
    }).not.toThrow();

    expect(ran).toBe(false);
    expect(storage.getString(MIGRATION_FLAG_KEY)).not.toBe('1');
  });

  it('중단된 마이그레이션을 재시도해도 백업을 훼손하지 않고 근무지를 병합하지 않는다', () => {
    // 최초 실행이 중단된 상황을 모사: 순정 백업은 이미 기록되어 있고,
    // schedule-store는 절반만 마이그레이션되어 jobName이 사라진 상태.
    const pristine = {
      allSchedulesById: {
        s1: oldSession('s1', '카페', 10000),
        s2: oldSession('s2', '편의점', 12000),
      },
    };
    storage.set(SCHEDULE_BACKUP_KEY, persisted(pristine));

    storage.set('schedule-store', JSON.stringify({
      state: {
        allSchedulesById: {
          s1: { ...oldSession('s1', '카페', 10000), jobName: undefined, workplaceId: 'half-migrated-wp' },
          s2: { ...oldSession('s2', '편의점', 12000), jobName: undefined, workplaceId: 'half-migrated-wp' },
        },
      },
      version: 2,
    }));
    // 플래그는 세워지지 않은 상태 (인터럽트로 인해)

    const ran = runWorkplaceMigration();
    expect(ran).toBe(true);

    const wp = JSON.parse(storage.getString('workplace-store')!);
    expect(Object.keys(wp.state.workplacesById).length).toBe(2);

    // 백업은 순정 그대로 유지되어야 함 (덮어쓰기 금지)
    const backup = JSON.parse(storage.getString(SCHEDULE_BACKUP_KEY)!);
    expect(backup.state.allSchedulesById.s1.jobName).toBe('카페');
    expect(backup.state.allSchedulesById.s2.jobName).toBe('편의점');
  });

  it('allSchedulesById가 비어있으면 false를 반환하고 플래그를 세운다', () => {
    storage.set('schedule-store', persisted({ allSchedulesById: {} }));

    const ran = runWorkplaceMigration();
    expect(ran).toBe(false);
    expect(storage.getString(MIGRATION_FLAG_KEY)).toBe('1');
  });
});
