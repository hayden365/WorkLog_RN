import { buildWorkplaceMigration } from '../../src/store/migrations/workplaceMigration';

let counter = 0;
const genId = () => `wp-${++counter}`;
beforeEach(() => { counter = 0; });

const raw = (o: any) => ({
  id: o.id,
  jobName: o.jobName,
  wageType: o.wageType ?? 'hourly',
  wage: o.wage ?? 10000,
  color: o.color ?? '#111',
  calculatedDailyWage: 90000,
  startTime: '2026-04-15T09:00:00.000Z',
  endTime: '2026-04-15T18:00:00.000Z',
  startDate: '2026-04-15T00:00:00.000Z',
  endDate: null,
  repeatOption: 'none',
  selectedWeekDays: [],
  isCurrentlyWorking: true,
  description: '',
});

describe('buildWorkplaceMigration', () => {
  it('이름+시급 조합마다 근무지를 1개 생성한다', () => {
    const result = buildWorkplaceMigration(
      {
        s1: raw({ id: 's1', jobName: '카페', wage: 10000 }),
        s2: raw({ id: 's2', jobName: '카페', wage: 10000 }),
        s3: raw({ id: 's3', jobName: '카페', wage: 12000 }), // 같은 이름 다른 시급 → 별도
      },
      genId
    );
    const workplaces = Object.values(result.workplacesById);
    expect(workplaces.length).toBe(2);
    // 같은 이름 다른 시급이면 suffix로 구분
    const names = workplaces.map((w) => w.name).sort();
    expect(names).toEqual(['카페', '카페 (2)']);
  });

  it('세션에 workplaceId를 연결하고 오버라이드를 null로 만든다', () => {
    const result = buildWorkplaceMigration({ s1: raw({ id: 's1', jobName: '카페', wage: 10000 }) }, genId);
    const s = result.sessionsById.s1;
    expect(s.workplaceId).toBe(result.workplacesById[s.workplaceId].id);
    expect(s.wage).toBeNull();
    expect(s.wageType).toBeNull();
    expect(s.breakMinutes).toBeNull();
    expect(s.jobName).toBeUndefined();
    expect(s.color).toBeUndefined();
    expect(s.calculatedDailyWage).toBeUndefined();
  });

  it('근무지 defaultBreakMinutes는 0이다 (급여 불변 보증)', () => {
    const result = buildWorkplaceMigration({ s1: raw({ id: 's1', jobName: '카페' }) }, genId);
    expect(Object.values(result.workplacesById)[0].defaultBreakMinutes).toBe(0);
  });

  it('근무지 색상은 그룹 첫 세션의 색을 쓴다', () => {
    const result = buildWorkplaceMigration({ s1: raw({ id: 's1', jobName: '카페', color: '#ABC123' }) }, genId);
    expect(Object.values(result.workplacesById)[0].color).toBe('#ABC123');
  });
});
