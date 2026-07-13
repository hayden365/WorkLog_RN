import { resolveSession, computeSessionPay, ResolvedSession } from '../../src/utils/payFns';
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

const resolved = (o: Partial<ResolvedSession> = {}): ResolvedSession => ({
  id: 's1',
  workplaceId: 'wp1',
  jobName: '카페',
  color: '#111111',
  wageType: 'hourly',
  wage: 10000,
  breakMinutes: 0,
  startTime: new Date(2026, 3, 15, 9, 0),
  endTime: new Date(2026, 3, 15, 18, 0),
  startDate: new Date(2026, 3, 15),
  endDate: new Date(2026, 3, 15),
  repeatOption: 'none',
  selectedWeekDays: new Set<number>(),
  isCurrentlyWorking: false,
  description: '',
  ...o,
});

describe('resolveSession', () => {
  it('오버라이드가 null이면 근무지 기본값을 상속한다', () => {
    const s = createTestSession({ wage: null as any, wageType: null as any, breakMinutes: null } as any);
    const r = resolveSession(s, workplace());
    expect(r.wage).toBe(10000);
    expect(r.wageType).toBe('hourly');
    expect(r.breakMinutes).toBe(60);
    expect(r.jobName).toBe('카페');
    expect(r.color).toBe('#111111');
  });

  it('세션 오버라이드가 근무지 기본값을 이긴다', () => {
    const s = createTestSession({ wage: 15000, wageType: 'daily', breakMinutes: 30 } as any);
    const r = resolveSession(s, workplace());
    expect(r.wage).toBe(15000);
    expect(r.wageType).toBe('daily');
    expect(r.breakMinutes).toBe(30);
  });
});

describe('computeSessionPay', () => {
  it('시급제: 실근무 = 총근무 - 휴게, base = 실근무시간 × 시급', () => {
    const pay = computeSessionPay(resolved({ breakMinutes: 60 })); // 9시간 - 1시간 = 8시간
    expect(pay.totalMinutes).toBe(540);
    expect(pay.breakMinutes).toBe(60);
    expect(pay.paidMinutes).toBe(480);
    expect(pay.base).toBe(80000);
    expect(pay.gross).toBe(80000);
    expect(pay.net).toBe(80000);
  });

  it('휴게가 근무보다 크면 실근무·급여는 0 하한', () => {
    const pay = computeSessionPay(resolved({ breakMinutes: 999 }));
    expect(pay.paidMinutes).toBe(0);
    expect(pay.base).toBe(0);
  });

  it('일급제: 휴게와 무관하게 base = wage', () => {
    const pay = computeSessionPay(resolved({ wageType: 'daily', wage: 80000, breakMinutes: 60 }));
    expect(pay.base).toBe(80000);
    expect(pay.paidMinutes).toBe(480); // 표시용으로는 계산됨
  });

  it('월급제: base = 0 (월 집계에서 1회 반영)', () => {
    const pay = computeSessionPay(resolved({ wageType: 'monthly', wage: 3000000 }));
    expect(pay.base).toBe(0);
  });

  it('자정 넘김 + 휴게 조합', () => {
    const pay = computeSessionPay(
      resolved({ startTime: new Date(2026, 3, 15, 22, 0), endTime: new Date(2026, 3, 16, 6, 0), breakMinutes: 60 })
    ); // 8시간 - 1시간 = 7시간
    expect(pay.totalMinutes).toBe(480);
    expect(pay.paidMinutes).toBe(420);
    expect(pay.base).toBe(70000);
  });
});
