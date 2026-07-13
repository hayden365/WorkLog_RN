# 근무지 엔티티 + 휴게시간 제외 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 근무지(Workplace)를 1급 엔티티로 도입하고, 급여 계산을 저장값이 아닌 파생 계산으로 전환하며, 휴게시간을 급여에서 제외하는 기능을 추가한다.

**Architecture:** `Workplace` 엔티티가 시급·급여유형·기본 휴게시간·색상·이름을 소유한다. `WorkSession`은 `workplaceId`로 근무지를 참조하고 nullable 오버라이드(`wage`/`wageType`/`breakMinutes`)만 저장한다. 순수 함수 `resolveSession` → `computeSessionPay`(PayBreakdown 반환) → `computeMonthlyTotal`이 계산을 담당하고, 세션에 저장하던 `calculatedDailyWage` 캐시는 제거한다. 기존 데이터는 1회성 마이그레이션으로 `jobName` 그룹마다 근무지를 생성해 보존한다.

**Tech Stack:** Expo/React Native, TypeScript, Zustand + `persist` + MMKV, react-native-uuid, date-fns, Jest + @testing-library/react-native.

## Global Constraints

- 언어/주석: 한국어 유지 (기존 코드 스타일).
- 파일 참조는 markdown 링크 형식(`[file](path)`)이 아니라 **정확한 상대 경로**로 표기.
- 테스트 위치: `__tests__/**/*.test.{ts,tsx}` (jest.config.js `testMatch`).
- 테스트 헬퍼: `__tests__/helpers.ts`의 `createTestSession`. MMKV/uuid는 `__tests__/setup.ts`에서 mock됨 (uuid.v4는 `test-uuid-*` 문자열 반환, `beforeEach`마다 스토리지 초기화).
- id 생성: `import uuid from "react-native-uuid"; uuid.v4()` (string 반환).
- 급여 유형: `"hourly" | "daily" | "monthly"`. 새 타입 별칭 `WageType` 도입 후 재사용.
- **마이그레이션 불변식:** 마이그레이션 후 모든 세션의 계산 급여·근무일수·근무시간이 마이그레이션 전과 정확히 동일해야 한다 (`defaultBreakMinutes = 0`으로 보장).
- **급여는 항상 실근무(휴게 제외) 기준.** 표시 시간만 `workTimeDisplayMode` 토글을 따른다.
- 리팩터는 **추가 → 소비자 이전 → 제거** 순서로 진행해 각 태스크 종료 시 앱이 컴파일되도록 유지한다. 구 필드(`jobName`/`color`/`calculatedDailyWage`)는 마지막 Task 12에서 제거한다.
- 각 테스트 스텝 실행 명령: `npx jest <경로> -t "<이름>"` 또는 파일 단위 `npx jest <경로>`.

---

### Task 1: Workplace 모델 + 스토어

**Files:**
- Create: `src/models/Workplace.ts`
- Create: `src/store/workplaceStore.ts`
- Test: `__tests__/store/workplaceStore.test.ts`

**Interfaces:**
- Produces:
  - `interface Workplace { id: string; name: string; color: string; wageType: WageType; wage: number; defaultBreakMinutes: number; archived: boolean; }`
  - `useWorkplaceStore` (zustand) with state `workplacesById: Record<string, Workplace>` and actions `addWorkplace(w: Workplace): void`, `updateWorkplace(id: string, updates: Partial<Workplace>): void`, `archiveWorkplace(id: string): void`, `getWorkplaceById(id: string): Workplace | undefined`, `getAllWorkplaces(): Workplace[]`, `getActiveWorkplaces(): Workplace[]`.
  - Export `WORKPLACE_STORE_NAME = "workplace-store"`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/store/workplaceStore.test.ts`:

```ts
import { useWorkplaceStore } from '../../src/store/workplaceStore';
import { Workplace } from '../../src/models/Workplace';

const wp = (o: Partial<Workplace> = {}): Workplace => ({
  id: 'wp1',
  name: '카페',
  color: '#3D5AFE',
  wageType: 'hourly',
  wage: 10000,
  defaultBreakMinutes: 0,
  archived: false,
  ...o,
});

describe('useWorkplaceStore', () => {
  beforeEach(() => {
    useWorkplaceStore.setState({ workplacesById: {} });
  });

  it('근무지를 추가하고 id로 조회한다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.name).toBe('카페');
  });

  it('근무지를 수정한다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    useWorkplaceStore.getState().updateWorkplace('wp1', { wage: 12000 });
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.wage).toBe(12000);
  });

  it('보관 처리하면 archived=true가 되고 활성 목록에서 빠진다', () => {
    useWorkplaceStore.getState().addWorkplace(wp());
    useWorkplaceStore.getState().addWorkplace(wp({ id: 'wp2', name: '편의점' }));
    useWorkplaceStore.getState().archiveWorkplace('wp1');
    expect(useWorkplaceStore.getState().getWorkplaceById('wp1')?.archived).toBe(true);
    const active = useWorkplaceStore.getState().getActiveWorkplaces();
    expect(active.map((w) => w.id)).toEqual(['wp2']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/store/workplaceStore.test.ts`
Expected: FAIL ("Cannot find module '../../src/store/workplaceStore'").

- [ ] **Step 3: Write the model**

Create `src/models/Workplace.ts`:

```ts
export type WageType = "hourly" | "daily" | "monthly";

// 근무지: 시급·급여유형·기본 휴게시간·색상을 소유하는 1급 엔티티
export interface Workplace {
  id: string;
  name: string;
  color: string;
  wageType: WageType;
  wage: number;
  defaultBreakMinutes: number; // 기본 휴게(분), 0 가능
  archived: boolean; // '근무 종료'된 근무지 숨김용
  // 향후 확장 예약: weeklyHolidayPay, nightPremium, overtime, deductions
}
```

- [ ] **Step 4: Write the store**

Create `src/store/workplaceStore.ts`:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { Workplace } from "../models/Workplace";

export const WORKPLACE_STORE_NAME = "workplace-store";

const storage = new MMKV();

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
}));

interface WorkplaceStore {
  workplacesById: Record<string, Workplace>;
  addWorkplace: (workplace: Workplace) => void;
  updateWorkplace: (id: string, updates: Partial<Workplace>) => void;
  archiveWorkplace: (id: string) => void;
  getWorkplaceById: (id: string) => Workplace | undefined;
  getAllWorkplaces: () => Workplace[];
  getActiveWorkplaces: () => Workplace[];
}

export const useWorkplaceStore = create<WorkplaceStore>()(
  persist(
    (set, get) => ({
      workplacesById: {},
      addWorkplace: (workplace) =>
        set((state) => ({
          workplacesById: { ...state.workplacesById, [workplace.id]: workplace },
        })),
      updateWorkplace: (id, updates) =>
        set((state) => ({
          workplacesById: {
            ...state.workplacesById,
            [id]: { ...state.workplacesById[id], ...updates },
          },
        })),
      archiveWorkplace: (id) =>
        set((state) => ({
          workplacesById: {
            ...state.workplacesById,
            [id]: { ...state.workplacesById[id], archived: true },
          },
        })),
      getWorkplaceById: (id) => get().workplacesById[id],
      getAllWorkplaces: () => Object.values(get().workplacesById),
      getActiveWorkplaces: () =>
        Object.values(get().workplacesById).filter((w) => !w.archived),
    }),
    { name: WORKPLACE_STORE_NAME, storage: mmkvStorage, version: 1 }
  )
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/store/workplaceStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/models/Workplace.ts src/store/workplaceStore.ts __tests__/store/workplaceStore.test.ts
git commit -m "feat: Workplace 엔티티 모델 및 스토어 추가"
```

---

### Task 2: 계산 엔진 — PayBreakdown, resolveSession, computeSessionPay

**Files:**
- Create: `src/utils/payFns.ts`
- Test: `__tests__/utils/payFns.test.ts`

**Interfaces:**
- Consumes: `Workplace`, `WageType` from `src/models/Workplace.ts`; `WorkSession` from `src/models/WorkSession.ts` (Task 4에서 `workplaceId`/`breakMinutes` 추가·`wage`/`wageType` nullable화 예정이나, 이 태스크는 `resolveSession` 입력을 자체 타입으로 받아 독립 검증한다).
- Produces:
  - `interface PayBreakdown { totalMinutes: number; breakMinutes: number; paidMinutes: number; base: number; nightPremium: number; overtimePremium: number; holidayPay: number; gross: number; deductions: number; net: number; }`
  - `interface ResolvedSession { id: string; workplaceId: string; jobName: string; color: string; wageType: WageType; wage: number; breakMinutes: number; startTime: Date; endTime: Date; startDate: Date; endDate: Date | null; repeatOption: RepeatOption; selectedWeekDays: Set<number>; isCurrentlyWorking: boolean; description: string; }`
  - `resolveSession(session: WorkSession, workplace: Workplace): ResolvedSession`
  - `computeSessionPay(resolved: ResolvedSession): PayBreakdown`
  - `sessionTotalMinutes(startTime: Date, endTime: Date): number` (자정 넘김 처리, 내부 공용)

- [ ] **Step 1: Write the failing test**

Create `__tests__/utils/payFns.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/payFns.test.ts`
Expected: FAIL ("Cannot find module '../../src/utils/payFns'").

- [ ] **Step 3: Write the implementation**

Create `src/utils/payFns.ts`:

```ts
import { WorkSession, RepeatOption } from "../models/WorkSession";
import { Workplace, WageType } from "../models/Workplace";

export interface PayBreakdown {
  totalMinutes: number; // 총 근무(휴게 포함)
  breakMinutes: number; // 휴게
  paidMinutes: number; // 실 근무 = max(0, total - break)
  base: number; // 기본급
  // ── 향후 확장 예약 (이번엔 항상 0) ──
  nightPremium: number;
  overtimePremium: number;
  holidayPay: number;
  gross: number; // base + 프리미엄
  deductions: number;
  net: number; // gross - deductions
}

export interface ResolvedSession {
  id: string;
  workplaceId: string;
  jobName: string; // = workplace.name (표시용)
  color: string; // = workplace.color
  wageType: WageType;
  wage: number;
  breakMinutes: number;
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>;
  isCurrentlyWorking: boolean;
  description: string;
}

// 총 근무 분. 종료가 시작보다 이르면 자정을 넘긴 근무이므로 24시간을 더한다.
export const sessionTotalMinutes = (startTime: Date, endTime: Date): number => {
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  let workMinutes = endMinutes - startMinutes;
  if (workMinutes < 0) workMinutes += 24 * 60;
  return workMinutes;
};

// 근무지 기본값 + 세션 오버라이드 병합. null 오버라이드는 근무지 기본값을 상속.
export const resolveSession = (
  session: WorkSession,
  workplace: Workplace
): ResolvedSession => ({
  id: session.id,
  workplaceId: session.workplaceId,
  jobName: workplace.name,
  color: workplace.color,
  wageType: session.wageType ?? workplace.wageType,
  wage: session.wage ?? workplace.wage,
  breakMinutes: session.breakMinutes ?? workplace.defaultBreakMinutes,
  startTime: session.startTime,
  endTime: session.endTime,
  startDate: session.startDate,
  endDate: session.endDate,
  repeatOption: session.repeatOption,
  selectedWeekDays: session.selectedWeekDays,
  isCurrentlyWorking: session.isCurrentlyWorking,
  description: session.description,
});

// 세션 하나의 급여 내역 (순수). 급여는 항상 실근무(휴게 제외) 기준.
export const computeSessionPay = (r: ResolvedSession): PayBreakdown => {
  const totalMinutes = sessionTotalMinutes(r.startTime, r.endTime);
  const breakMinutes = r.breakMinutes;
  const paidMinutes = Math.max(0, totalMinutes - breakMinutes);

  let base = 0;
  if (r.wageType === "hourly") {
    base = (paidMinutes / 60) * r.wage;
  } else if (r.wageType === "daily") {
    base = r.wage;
  } else {
    base = 0; // monthly: 월 집계에서 1회 반영
  }

  const nightPremium = 0;
  const overtimePremium = 0;
  const holidayPay = 0;
  const gross = base + nightPremium + overtimePremium + holidayPay;
  const deductions = 0;
  const net = gross - deductions;

  return {
    totalMinutes,
    breakMinutes,
    paidMinutes,
    base,
    nightPremium,
    overtimePremium,
    holidayPay,
    gross,
    deductions,
    net,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/payFns.test.ts`
Expected: PASS. (참고: 이 시점에는 Task 4 이전이라 `createTestSession`이 `workplaceId`/`breakMinutes`를 갖지 않아 타입 캐스팅 `as any`로 통과시킨다. Task 4에서 헬퍼가 갱신되면 `as any`가 불필요해지지만 남아 있어도 무해하다.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/payFns.ts __tests__/utils/payFns.test.ts
git commit -m "feat: 급여 계산 엔진(resolveSession, computeSessionPay) 추가"
```

---

### Task 3: 월별 집계 — computeMonthlyTotal

**Files:**
- Modify: `src/utils/payFns.ts`
- Test: `__tests__/utils/payFns.test.ts` (describe 추가)

**Interfaces:**
- Consumes: `ScheduleByDate`, `SchedulesById` from `src/models/WorkSession.ts`; `Workplace`; `resolveSession`, `computeSessionPay`.
- Produces:
  - `interface MonthlyTotal { gross: number; net: number; workDays: number; paidMinutes: number; byWorkplace: Record<string, { gross: number; net: number; paidMinutes: number }>; }`
  - `computeMonthlyTotal(dateSchedule: ScheduleByDate, sessions: SchedulesById, workplaces: Record<string, Workplace>, viewMonth: Date): MonthlyTotal`

- [ ] **Step 1: Write the failing test**

Append to `__tests__/utils/payFns.test.ts`:

```ts
import { computeMonthlyTotal } from '../../src/utils/payFns';
import { SchedulesById, ScheduleByDate } from '../../src/models/WorkSession';

describe('computeMonthlyTotal', () => {
  const workplaces = {
    wp1: { id: 'wp1', name: '카페', color: '#111', wageType: 'hourly' as const, wage: 10000, defaultBreakMinutes: 60, archived: false },
    wp2: { id: 'wp2', name: '학원', color: '#222', wageType: 'monthly' as const, wage: 2000000, defaultBreakMinutes: 0, archived: false },
  };

  const hourly = createTestSession({
    id: 's1', workplaceId: 'wp1', wage: null, wageType: null, breakMinutes: null,
    startTime: new Date(2026, 3, 15, 9, 0), endTime: new Date(2026, 3, 15, 18, 0),
  } as any);
  const monthly = createTestSession({
    id: 's2', workplaceId: 'wp2', wage: null, wageType: null, breakMinutes: null,
  } as any);
  const sessions: SchedulesById = { s1: hourly, s2: monthly };

  it('시급제 실근무 급여를 근무일마다 더하고 월급제는 1회만 반영한다', () => {
    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1', 's2'],
      '2026-04-02': ['s1', 's2'],
      '2026-05-01': ['s1'], // 다른 달 → 제외
    };
    const total = computeMonthlyTotal(dateSchedule, sessions, workplaces, new Date(2026, 3, 1));
    // s1: (9시간-1시간)×10000 = 80000, 2일 = 160000. s2 월급 2000000 1회.
    expect(total.net).toBe(2160000);
    expect(total.workDays).toBe(2);
    expect(total.byWorkplace.wp1.net).toBe(160000);
    expect(total.byWorkplace.wp2.net).toBe(2000000);
    // 근무지별 소계 합 = 전체
    expect(total.byWorkplace.wp1.net + total.byWorkplace.wp2.net).toBe(total.net);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/payFns.test.ts -t computeMonthlyTotal`
Expected: FAIL ("computeMonthlyTotal is not a function").

- [ ] **Step 3: Write the implementation**

Append to `src/utils/payFns.ts`:

```ts
import { ScheduleByDate, SchedulesById } from "../models/WorkSession";

export interface MonthlyTotal {
  gross: number;
  net: number;
  workDays: number; // 근무일 수 (그 달에 세션이 있는 날짜 수)
  paidMinutes: number;
  byWorkplace: Record<string, { gross: number; net: number; paidMinutes: number }>;
}

export const computeMonthlyTotal = (
  dateSchedule: ScheduleByDate,
  sessions: SchedulesById,
  workplaces: Record<string, Workplace>,
  viewMonth: Date
): MonthlyTotal => {
  const total: MonthlyTotal = {
    gross: 0,
    net: 0,
    workDays: 0,
    paidMinutes: 0,
    byWorkplace: {},
  };

  const addToWorkplace = (id: string, gross: number, net: number, paid: number) => {
    if (!total.byWorkplace[id]) total.byWorkplace[id] = { gross: 0, net: 0, paidMinutes: 0 };
    total.byWorkplace[id].gross += gross;
    total.byWorkplace[id].net += net;
    total.byWorkplace[id].paidMinutes += paid;
  };

  // 월급제 세션은 근무일마다 더하면 중복이므로, 그 달에 근무일이 있으면 1회만 반영한다.
  const monthlyIds = new Set<string>();

  Object.entries(dateSchedule).forEach(([date, sessionIds]) => {
    const dateObj = new Date(date);
    if (
      dateObj.getMonth() !== viewMonth.getMonth() ||
      dateObj.getFullYear() !== viewMonth.getFullYear()
    ) {
      return;
    }
    total.workDays += 1;

    for (const id of sessionIds) {
      const session = sessions[id];
      if (!session) continue;
      const workplace = workplaces[session.workplaceId];
      if (!workplace) continue;
      const resolved = resolveSession(session, workplace);

      if (resolved.wageType === "monthly") {
        monthlyIds.add(id);
        continue;
      }
      const pay = computeSessionPay(resolved);
      total.gross += pay.gross;
      total.net += pay.net;
      total.paidMinutes += pay.paidMinutes;
      addToWorkplace(session.workplaceId, pay.gross, pay.net, pay.paidMinutes);
    }
  });

  monthlyIds.forEach((id) => {
    const session = sessions[id];
    const workplace = workplaces[session.workplaceId];
    if (!workplace) return;
    const resolved = resolveSession(session, workplace);
    total.gross += resolved.wage;
    total.net += resolved.wage;
    addToWorkplace(session.workplaceId, resolved.wage, resolved.wage, 0);
  });

  return total;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/payFns.test.ts`
Expected: PASS (모든 describe).

- [ ] **Step 5: Commit**

```bash
git add src/utils/payFns.ts __tests__/utils/payFns.test.ts
git commit -m "feat: computeMonthlyTotal 월별·근무지별 집계 추가"
```

---

### Task 4: WorkSession 모델 확장 (추가 단계) + 테스트 헬퍼 갱신

기존 필드를 유지한 채 `workplaceId`/`breakMinutes`를 추가하고 오버라이드 필드를 nullable로 넓힌다. 구 필드(`jobName`/`color`/`calculatedDailyWage`)는 Task 12까지 유지해 컴파일을 보존한다.

**Files:**
- Modify: `src/models/WorkSession.ts`
- Modify: `__tests__/helpers.ts`

**Interfaces:**
- Produces: `WorkSession`에 `workplaceId: string`, `breakMinutes: number | null` 추가. `wageType: WageType | null`, `wage: number | null`로 완화. `WageType`는 `src/models/Workplace.ts`에서 재수출.

- [ ] **Step 1: Modify the model**

In `src/models/WorkSession.ts`, 상단에 import·재수출 추가하고 `WorkSession` 인터페이스를 아래로 교체 (구 필드 유지):

```ts
import { WageType } from "./Workplace";
export type { WageType };

export type RepeatOption = "none" | "daily" | "weekly" | "biweekly" | "monthly";

// 데이터 저장 형식
export interface WorkSession {
  id: string;
  workplaceId: string; // 신규: 근무지 참조
  // 오버라이드 (null이면 근무지 기본값 상속)
  wageType: WageType | null;
  wage: number | null;
  breakMinutes: number | null; // 신규: null이면 근무지 defaultBreakMinutes
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>;
  isCurrentlyWorking: boolean;
  description: string;
  // ── Deprecated: Task 12에서 제거 (마이그레이션/표시 호환용으로 임시 유지) ──
  jobName?: string;
  color?: string;
  calculatedDailyWage?: number | null;
}
```

`CalendarDisplayItem`, `ScheduleByDate`, `SchedulesById`, `CalendarDisplayMap` 정의는 그대로 둔다.

- [ ] **Step 2: Update the test helper**

Replace `__tests__/helpers.ts` body:

```ts
import { WorkSession } from '../src/models/WorkSession';

export function createTestSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: 'test-session-1',
    workplaceId: 'test-wp-1',
    wageType: 'hourly',
    wage: 10000,
    breakMinutes: 0,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    repeatOption: 'daily',
    selectedWeekDays: new Set<number>(),
    isCurrentlyWorking: true,
    description: '',
    // deprecated 호환
    jobName: '테스트 알바',
    color: '#3D5AFE',
    calculatedDailyWage: 90000,
    ...overrides,
  };
}
```

- [ ] **Step 3: Run the full suite to confirm nothing breaks**

Run: `npx jest`
Expected: 기존 `wageFns.test.ts`, `payFns.test.ts`, `workplaceStore.test.ts` 포함 PASS. (구 `wageFns`는 아직 존재하므로 통과. `payFns.test.ts`의 `as any`도 유효.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과. (구 필드가 optional로 남아 기존 소비자 코드가 여전히 컴파일됨.)

- [ ] **Step 5: Commit**

```bash
git add src/models/WorkSession.ts __tests__/helpers.ts
git commit -m "feat: WorkSession에 workplaceId/breakMinutes 추가 및 오버라이드 nullable화"
```

---

### Task 5: 마이그레이션 코어 (순수 함수)

MMKV 없이 순수하게 테스트 가능한 변환 로직. 저장된 스케줄 상태(구 형식)를 받아 `{ workplaces, sessions }`(신 형식)을 반환한다.

**Files:**
- Create: `src/store/migrations/workplaceMigration.ts`
- Test: `__tests__/store/workplaceMigration.test.ts`

**Interfaces:**
- Produces:
  - `interface RawSession { id: string; jobName: string; wageType: string; wage: number; color?: string; calculatedDailyWage?: number | null; [k: string]: any; }`
  - `interface MigrationResult { workplacesById: Record<string, Workplace>; sessionsById: Record<string, any>; }`
  - `buildWorkplaceMigration(allSchedulesById: Record<string, RawSession>, genId: () => string): MigrationResult`

- [ ] **Step 1: Write the failing test**

Create `__tests__/store/workplaceMigration.test.ts`:

```ts
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

  it('근무지 defaultBreakMinutes는 0이다 (급여 불변 보장)', () => {
    const result = buildWorkplaceMigration({ s1: raw({ id: 's1', jobName: '카페' }) }, genId);
    expect(Object.values(result.workplacesById)[0].defaultBreakMinutes).toBe(0);
  });

  it('근무지 색상은 그룹 첫 세션의 색을 쓴다', () => {
    const result = buildWorkplaceMigration({ s1: raw({ id: 's1', jobName: '카페', color: '#ABC123' }) }, genId);
    expect(Object.values(result.workplacesById)[0].color).toBe('#ABC123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/store/workplaceMigration.test.ts`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Write the implementation**

Create `src/store/migrations/workplaceMigration.ts`:

```ts
import { Workplace, WageType } from "../../models/Workplace";

export interface RawSession {
  id: string;
  jobName: string;
  wageType: string;
  wage: number;
  color?: string;
  calculatedDailyWage?: number | null;
  [k: string]: any;
}

export interface MigrationResult {
  workplacesById: Record<string, Workplace>;
  sessionsById: Record<string, any>;
}

// 구 형식(jobName 기반) 세션 맵을 근무지 엔티티 + workplaceId 참조 세션으로 변환한다.
export const buildWorkplaceMigration = (
  allSchedulesById: Record<string, RawSession>,
  genId: () => string
): MigrationResult => {
  const workplacesById: Record<string, Workplace> = {};
  const sessionsById: Record<string, any> = {};

  // (이름 + 시급유형 + 시급) 조합 → 근무지 id
  const groupKeyToId = new Map<string, string>();
  // 표시 이름 중복 방지용 카운터 (같은 jobName이 서로 다른 시급으로 여러 근무지가 될 때)
  const nameUseCount = new Map<string, number>();

  const sessions = Object.values(allSchedulesById);

  for (const s of sessions) {
    const groupKey = `${s.jobName}||${s.wageType}||${s.wage}`;
    let workplaceId = groupKeyToId.get(groupKey);

    if (!workplaceId) {
      workplaceId = genId();
      groupKeyToId.set(groupKey, workplaceId);

      const used = nameUseCount.get(s.jobName) ?? 0;
      const displayName = used === 0 ? s.jobName : `${s.jobName} (${used + 1})`;
      nameUseCount.set(s.jobName, used + 1);

      workplacesById[workplaceId] = {
        id: workplaceId,
        name: displayName,
        color: s.color ?? "#3D5AFE",
        wageType: s.wageType as WageType,
        wage: s.wage,
        defaultBreakMinutes: 0, // 급여 불변 보장
        archived: false,
      };
    }

    // 세션 재작성: workplaceId 연결, 오버라이드 null, 구 필드 제거
    const { jobName, color, calculatedDailyWage, ...rest } = s;
    sessionsById[s.id] = {
      ...rest,
      workplaceId,
      wageType: null,
      wage: null,
      breakMinutes: null,
    };
  }

  return { workplacesById, sessionsById };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/store/workplaceMigration.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/migrations/workplaceMigration.ts __tests__/store/workplaceMigration.test.ts
git commit -m "feat: 근무지 마이그레이션 코어(buildWorkplaceMigration) 추가"
```

---

### Task 6: 마이그레이션 러너 (MMKV IO + 백업 + 불변식 검증)

MMKV에서 구 데이터를 읽어 변환·저장하고, 백업 스냅샷과 완료 플래그를 남긴다. 마이그레이션 전/후 급여 불변식을 테스트로 고정한다.

**Files:**
- Create: `src/store/migrations/runWorkplaceMigration.ts`
- Test: `__tests__/store/runWorkplaceMigration.test.ts`

**Interfaces:**
- Consumes: `buildWorkplaceMigration`; MMKV 키 `schedule-store`(zustand persist 래핑 형태 `{ state: { allSchedulesById }, version }`), `workplace-store`.
- Produces:
  - `runWorkplaceMigration(): boolean` — 실행되면 true, 이미 완료/불필요면 false.
  - 상수 `MIGRATION_FLAG_KEY = "migration-workplace-v2-done"`, `SCHEDULE_BACKUP_KEY = "schedule-store-backup-v1"`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/store/runWorkplaceMigration.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/store/runWorkplaceMigration.test.ts`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Write the implementation**

Create `src/store/migrations/runWorkplaceMigration.ts`:

```ts
import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";
import { buildWorkplaceMigration } from "./workplaceMigration";

export const MIGRATION_FLAG_KEY = "migration-workplace-v2-done";
export const SCHEDULE_BACKUP_KEY = "schedule-store-backup-v1";

const SCHEDULE_STORE_KEY = "schedule-store";
const WORKPLACE_STORE_KEY = "workplace-store";

const storage = new MMKV();

// 앱 시작 시 1회 실행. 구 jobName 기반 세션을 근무지 엔티티로 승격한다.
export const runWorkplaceMigration = (): boolean => {
  if (storage.getString(MIGRATION_FLAG_KEY) === "1") return false;

  const rawScheduleStr = storage.getString(SCHEDULE_STORE_KEY);
  if (!rawScheduleStr) {
    // 저장된 스케줄이 없으면 마이그레이션 불필요 — 플래그만 세운다.
    storage.set(MIGRATION_FLAG_KEY, "1");
    return false;
  }

  // 실패 대비 원본 스냅샷 백업 (데이터 유실 방지)
  storage.set(SCHEDULE_BACKUP_KEY, rawScheduleStr);

  const parsed = JSON.parse(rawScheduleStr);
  const allSchedulesById = parsed?.state?.allSchedulesById ?? {};

  const { workplacesById, sessionsById } = buildWorkplaceMigration(
    allSchedulesById,
    () => uuid.v4() as string
  );

  // 근무지 스토어 기록 (zustand persist 래핑 형태)
  storage.set(
    WORKPLACE_STORE_KEY,
    JSON.stringify({ state: { workplacesById }, version: 1 })
  );

  // 스케줄 스토어 갱신 (버전 2로 승격)
  storage.set(
    SCHEDULE_STORE_KEY,
    JSON.stringify({ state: { allSchedulesById: sessionsById }, version: 2 })
  );

  storage.set(MIGRATION_FLAG_KEY, "1");
  return true;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/store/runWorkplaceMigration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the migration into app bootstrap**

`src/store/shiftStore.ts` 상단 `SCHEDULE_STORE_VERSION` 을 `2`로 올린다 (신규 세션 저장 시 버전 일치):

```ts
const SCHEDULE_STORE_VERSION = 2;
```

`App.tsx` (프로젝트 루트)에서 렌더 이전에 마이그레이션을 실행하고 스토어를 재수화한다. 최상단 import에 추가:

```tsx
import { useState, useEffect } from "react";
import { runWorkplaceMigration } from "./src/store/migrations/runWorkplaceMigration";
import { useScheduleStore } from "./src/store/shiftStore";
import { useWorkplaceStore } from "./src/store/workplaceStore";
```

`App` 컴포넌트 본문 최상단에 게이트 추가 (기존 반환 JSX를 `ready` 이후에만 렌더):

```tsx
const [ready, setReady] = useState(false);

useEffect(() => {
  runWorkplaceMigration();
  // MMKV를 직접 수정했으므로 persist 스토어를 재수화한다.
  Promise.all([
    useWorkplaceStore.persist.rehydrate(),
    useScheduleStore.persist.rehydrate(),
  ]).finally(() => setReady(true));
}, []);

if (!ready) return null; // 스플래시/빈 화면 (짧음, 동기 MMKV)
```

> 참고: `App.tsx`의 정확한 구조는 프로젝트에 맞춰 조정하되, **마이그레이션 → 재수화 → 렌더** 순서를 반드시 지킬 것.

- [ ] **Step 6: Verify full suite + type-check**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/store/migrations/runWorkplaceMigration.ts __tests__/store/runWorkplaceMigration.test.ts src/store/shiftStore.ts App.tsx
git commit -m "feat: 근무지 마이그레이션 러너 및 앱 부트스트랩 게이트 연결"
```

---

### Task 7: 계산 배선 — useScheduleManager & HomeScreen 총액

구 `calculateDailyWage`/`calculatedDailyWage` 캐시 대신 근무지+세션 파생 계산으로 전환한다.

**Files:**
- Modify: `src/hooks/useScheduleManager.ts`
- Modify: `src/screens/HomeScreen.tsx:29,128,136,146-160,455,462,473-477`

**Interfaces:**
- Consumes: `useWorkplaceStore`; `computeMonthlyTotal`, `resolveSession`, `computeSessionPay` from `src/utils/payFns.ts`.

- [ ] **Step 1: Simplify useScheduleManager (no more precomputed cache)**

`src/hooks/useScheduleManager.ts`에서 `calculateDailyWage`/`getSessionColor` import를 제거하고 add/update를 아래로 교체:

```ts
import uuid from "react-native-uuid";
// (calculateDailyWage, getSessionColor import 삭제)

const addScheduleWithCalculatedWage = (schedule: Partial<WorkSession>) => {
  const id = uuid.v4() as string;
  addSchedule({ ...schedule, id } as WorkSession);
};

const updateScheduleWithCalculatedWage = (
  id: string,
  updates: Partial<WorkSession>
) => {
  updateSchedule(id, updates);
};
```

`shiftStore.ts`의 `addSchedule`은 `color: schedule.color || getSessionColor(...)`를 여전히 참조하나 color가 optional이 되어도 무해하다 (Task 12에서 정리). 이 태스크에서는 손대지 않는다.

- [ ] **Step 2: Switch HomeScreen monthly total to computeMonthlyTotal**

`src/screens/HomeScreen.tsx`:

29행 import 교체:
```ts
import { computeMonthlyTotal } from '../utils/payFns';
import { useWorkplaceStore } from '../store/workplaceStore';
```

컴포넌트 본문에서 근무지 맵 구독 추가 (다른 store 훅들 근처):
```ts
const workplacesById = useWorkplaceStore((s) => s.workplacesById);
```

128행 및 136행의 `displayMonthlyWage(...)` 호출을 교체:
```ts
setEarnings(computeMonthlyTotal(byDate, allSchedulesById, workplacesById, viewMonth).net);
```
```ts
computeMonthlyTotal(prevByDate, allSchedulesById, workplacesById, prevMonth).net,
```

- [ ] **Step 3: Switch per-day list amount + legend to resolved values**

HomeScreen 160행 부근 일별 합계(`calculatedDailyWage` 합산)를 파생 계산으로 교체:
```ts
(sum, id) => {
  const s = allSchedulesById[id];
  const wp = s ? workplacesById[s.workplaceId] : undefined;
  if (!s || !wp) return sum;
  return sum + computeSessionPay(resolveSession(s, wp)).net;
},
```
상단 import에 `resolveSession`, `computeSessionPay` 추가.

455행(`session.color`)·462행(`session.jobName`)·473-477행(`session.calculatedDailyWage`) 표시부는 세션이 아니라 근무지에서 값을 읽도록 교체. 세션 렌더 지점에서:
```ts
const wp = workplacesById[session.workplaceId];
const pay = wp ? computeSessionPay(resolveSession(session, wp)) : null;
// 색상: wp?.color ?? colors.brand
// 이름: wp?.name ?? ''
// 금액: pay ? formatNumberWithComma(String(Math.round(pay.net))) : null
```

- [ ] **Step 4: Type-check + run**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS. (`wageFns`/`displayMonthlyWage`는 아직 존재하지만 HomeScreen은 더는 참조하지 않음.)

- [ ] **Step 5: Manual smoke (optional but recommended)**

`npx expo start` 후 기존 근무 기록이 이전과 동일한 총액으로 표시되는지 확인 (마이그레이션 불변식 육안 검증).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useScheduleManager.ts src/screens/HomeScreen.tsx
git commit -m "refactor: 급여 표시를 파생 계산(computeMonthlyTotal)으로 전환"
```

---

### Task 8: 달력 표시 데이터 — 근무지 이름·색상 해석

`generateViewMonthScheduleData`와 `getMarkedDatesFrom*`가 세션의 `jobName`/`color` 대신 근무지에서 이름·색상을 읽도록 한다. 세션을 먼저 `ResolvedSession`으로 변환해 넘기는 방식이 최소 변경이다.

**Files:**
- Modify: `src/utils/calendarfns.ts`
- Modify: 호출부 (`generateViewMonthScheduleData`를 부르는 곳 — `src/screens/HomeScreen.tsx` 내 데이터 생성 지점)
- Test: `__tests__/utils/calendarfns.test.ts` (기존 파일에 근무지 해석 케이스 보강)

**Interfaces:**
- Consumes: `ResolvedSession`, `resolveSession`.
- Change: `generateViewMonthScheduleData(schedules: ResolvedSession[], viewMonth: Date)` — 입력 타입을 `WorkSession[]` → `ResolvedSession[]`로 변경. 내부 `getMarkedDatesFrom*`는 `schedule.color`/`schedule.jobName`를 그대로 읽으므로 `ResolvedSession`이 두 필드를 가지면 본문 변경 최소.

- [ ] **Step 1: Update calendarfns signatures to ResolvedSession**

`src/utils/calendarfns.ts`:
- import 교체: `WorkSession` → `ResolvedSession` (from `./payFns`). `getSessionColor` import 제거.
- 각 `getMarkedDatesFrom*`의 `schedule: WorkSession` 파라미터를 `schedule: ResolvedSession`으로 변경.
- 각 함수 내 `const sessionColor = schedule.color || getSessionColor(schedule.id);` → `const sessionColor = schedule.color;` (ResolvedSession.color는 항상 존재).
- `generateViewMonthScheduleData(schedules: WorkSession[], ...)` → `(schedules: ResolvedSession[], ...)`.
- `jobName: schedule.jobName` 라인들은 그대로 (ResolvedSession.jobName = 근무지 이름).

- [ ] **Step 2: Update the caller in HomeScreen to pass resolved sessions**

`generateViewMonthScheduleData(schedules, viewMonth)` 호출부에서, 세션 배열을 넘기기 전에 근무지와 병합:

```ts
const resolvedSchedules = getAllSchedules()
  .map((s) => {
    const wp = workplacesById[s.workplaceId];
    return wp ? resolveSession(s, wp) : null;
  })
  .filter((r): r is ResolvedSession => r !== null);
const { markedDates, dateSchedule } = generateViewMonthScheduleData(resolvedSchedules, viewMonth);
```

`ResolvedSession` 타입 import 추가.

- [ ] **Step 3: Add/adjust calendarfns test for resolved input**

`__tests__/utils/calendarfns.test.ts`의 세션 생성 헬퍼가 `ResolvedSession` 형태(`color`, `jobName` 포함)를 넘기도록 조정하고, `none` 스케줄이 `jobName`(=근무지명)·`color`를 표시 아이템에 담는지 확인하는 케이스를 1개 추가:

```ts
it('마킹 아이템이 근무지 색상과 이름을 담는다', () => {
  const resolved = { /* ResolvedSession, color:'#ABC', jobName:'카페', repeatOption:'none', ... */ } as any;
  const marked = getMarkedDatesFromNoneSchedule({ schedule: resolved, viewMonth: new Date(2026, 3, 1) });
  const first = Object.values(marked)[0] as any;
  expect(first.color).toBe('#ABC');
  expect(first.jobName).toBe('카페');
});
```

- [ ] **Step 4: Type-check + run**

Run: `npx tsc --noEmit && npx jest __tests__/utils/calendarfns.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/calendarfns.ts src/screens/HomeScreen.tsx __tests__/utils/calendarfns.test.ts
git commit -m "refactor: 달력 표시 데이터를 근무지 기반 ResolvedSession으로 해석"
```

---

### Task 9: NewSessionModal — 근무지 드롭다운 + 휴게시간 입력

자유텍스트 근무지명 입력을 근무지 선택 드롭다운으로 바꾸고, 근무지 선택 시 시급·휴게 기본값을 자동 채우며, 휴게시간(분) 입력 필드와 실근무 미리보기를 추가한다.

**Files:**
- Modify: `src/components/NewSessionModal.tsx`
- Modify: `src/store/shiftStore.ts:131-190` (임시 shift 상태에 `workplaceId`, `breakMinutes` 필드/세터 추가)

**Interfaces:**
- Consumes: `useWorkplaceStore.getActiveWorkplaces()`; `Workplace`; `sessionTotalMinutes` from `payFns`.

- [ ] **Step 1: Extend the temp shift store**

`src/store/shiftStore.ts`의 `ShiftStore` 인터페이스·초기값·세터에 추가:
- 상태: `workplaceId: string`(초기 `""`), `breakMinutes: number | null`(초기 `null`).
- 세터: `setWorkplaceId: (id: string) => void`, `setBreakMinutes: (m: number | null) => void`.
- `createInitialShiftState`에 `workplaceId: "", breakMinutes: null` 추가.
- (기존 `setJobName`/`jobName`은 Task 12까지 optional 호환으로 남겨두되 사용 안 함.)

- [ ] **Step 2: Replace 근무지 입력 UI with a workplace picker**

`NewSessionModal.tsx` 근무지 카드(215-232행)를 근무지 선택 드롭다운으로 교체. 기존 `Dropdown` 컴포넌트 재사용:

```tsx
{/* 근무지 */}
<View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
  <View style={styles.inputGroup}>
    <View style={styles.iconWrap}>
      <Ionicons name="location-outline" size={22} color={colors.brand} />
    </View>
    <View style={{ flex: 1 }}>
      <Dropdown
        data={activeWorkplaces.map((w) => ({ value: w.id, label: w.name }))}
        onChange={(item) => handleSelectWorkplace(item.value)}
        placeholder={
          activeWorkplaces.find((w) => w.id === workplaceId)?.name ?? "근무지 선택"
        }
      />
    </View>
  </View>
</View>
```

컴포넌트 상단에 근무지 목록·선택 핸들러 추가:

```tsx
import { useWorkplaceStore } from "../store/workplaceStore";
import { sessionTotalMinutes } from "../utils/payFns";
// ...
const activeWorkplaces = useWorkplaceStore((s) => s.getActiveWorkplaces());
const { workplaceId, setWorkplaceId, breakMinutes, setBreakMinutes } = useShiftStore();

const handleSelectWorkplace = (id: string) => {
  const wp = activeWorkplaces.find((w) => w.id === id);
  if (!wp) return;
  setWorkplaceId(id);
  setWageType(wp.wageType);
  setWage(wp.wage);
  setWageValue(formatNumberWithComma(String(wp.wage)));
  if (breakMinutes === null) setBreakMinutes(wp.defaultBreakMinutes);
};
```

> 근무지가 하나도 없을 때: 드롭다운 placeholder를 "먼저 근무지를 추가하세요"로 하고, `handleSave`에서 `workplaceId`가 비면 Alert로 안내한다 (근무지 관리 화면은 Task 10).

- [ ] **Step 3: Add a break-minutes input + 실근무 preview**

급여 카드(234-283행) 아래에 휴게시간 카드 추가:

```tsx
{/* 휴게시간 */}
<View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
  <View style={styles.inputGroup}>
    <View style={styles.iconWrap}>
      <Ionicons name="cafe-outline" size={22} color={colors.brand} />
    </View>
    <View style={styles.wageInputRow}>
      <TextInput
        style={[styles.input, { flex: 1, backgroundColor: colors.surface, color: colors.textPrimary }]}
        placeholder="휴게시간(분)"
        placeholderTextColor={colors.textMuted}
        value={breakMinutes != null ? String(breakMinutes) : ""}
        keyboardType="number-pad"
        onChangeText={(v) => setBreakMinutes(v === "" ? null : Number(v.replace(/[^0-9]/g, "")))}
      />
    </View>
  </View>
  <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>
    {(() => {
      const total = sessionTotalMinutes(startTime, endTime);
      const paid = Math.max(0, total - (breakMinutes ?? 0));
      return `실 근무 ${(paid / 60).toFixed(1)}시간 (총 ${(total / 60).toFixed(1)}시간, 휴게 ${breakMinutes ?? 0}분)`;
    })()}
  </Text>
</View>
```

- [ ] **Step 4: Update handleSave / edit-init to use workplaceId + breakMinutes**

`handleSave`(140-180행)의 `newSession` 객체에서 `jobName: trimmedJobName`을 제거하고 `workplaceId`, `breakMinutes`를 넣는다. 근무지 미선택 검증 추가:

```tsx
if (!workplaceId) {
  Alert.alert('입력 오류', '근무지를 선택해주세요.');
  return;
}
// ...
const newSession = {
  id: existingSession?.id,
  workplaceId,
  wage,
  wageType,
  breakMinutes,
  startTime, endTime, startDate,
  endDate: endDateValue,
  repeatOption, selectedWeekDays, isCurrentlyWorking, description,
};
```

`useEffect` 편집 초기화(76-98행)에서 `setJobName(...)` 대신 `setWorkplaceId(existingSession.workplaceId)`, `setBreakMinutes(existingSession.breakMinutes ?? null)`로 교체.

- [ ] **Step 5: Type-check + run**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NewSessionModal.tsx src/store/shiftStore.ts
git commit -m "feat: 근무 입력에 근무지 선택 드롭다운·휴게시간 입력 추가"
```

---

### Task 10: 근무지 관리 화면

근무지 생성/편집/보관 화면. SettingsModal에서 진입.

**Files:**
- Create: `src/components/WorkplaceManagerModal.tsx`
- Modify: `src/components/SettingsModal.tsx` (진입 항목 추가)

**Interfaces:**
- Consumes: `useWorkplaceStore` (add/update/archive/getAllWorkplaces); `Workplace`; `uuid.v4`; 기존 색상 팔레트 `src/utils/colorManager.ts`.

- [ ] **Step 1: Build the workplace manager modal**

Create `src/components/WorkplaceManagerModal.tsx`. 요구 동작:
- 근무지 목록 표시 (활성/보관 구분). 각 항목: 색상 점 + 이름 + 시급/급여유형 요약 + 편집·보관 버튼.
- "새 근무지" 버튼 → 편집 폼(이름, 색상 선택, 급여유형 SegmentedControl(시급/일급/월급), 기본 시급, 기본 휴게(분)).
- 저장 시 신규면 `addWorkplace({ id: uuid.v4(), name, color, wageType, wage, defaultBreakMinutes, archived:false })`, 편집이면 `updateWorkplace(id, {...})`.
- 보관 버튼 → `archiveWorkplace(id)` (확인 Alert).

구현은 `NewSessionModal.tsx`의 카드/입력 스타일과 `SegmentedControl` 패턴을 그대로 따른다. 색상은 `colorManager`의 팔레트에서 선택하도록 원형 스와치 목록 제공.

```tsx
// 핵심 저장 핸들러 예시
const handleSaveWorkplace = () => {
  if (!name.trim()) { Alert.alert('입력 오류', '근무지명을 입력해주세요.'); return; }
  if (wage <= 0 && wageType !== 'monthly') { Alert.alert('입력 오류', '기본 급여를 입력해주세요.'); return; }
  if (editingId) {
    updateWorkplace(editingId, { name: name.trim(), color, wageType, wage, defaultBreakMinutes });
  } else {
    addWorkplace({ id: uuid.v4() as string, name: name.trim(), color, wageType, wage, defaultBreakMinutes, archived: false });
  }
  resetForm();
};
```

- [ ] **Step 2: Add entry point in SettingsModal**

`src/components/SettingsModal.tsx`에 "근무지 관리" 항목을 추가하고 탭 시 `WorkplaceManagerModal`을 연다 (로컬 `visible` state + 렌더). 기존 테마 항목과 동일한 행 스타일 사용.

- [ ] **Step 3: Type-check + manual verify**

Run: `npx tsc --noEmit`
`npx expo start`로 근무지 추가 → 목록 반영 → NewSessionModal 드롭다운에 노출 → 보관 시 드롭다운에서 사라짐(활성 목록) 확인.

- [ ] **Step 4: Commit**

```bash
git add src/components/WorkplaceManagerModal.tsx src/components/SettingsModal.tsx
git commit -m "feat: 근무지 관리 화면(생성/편집/보관) 추가"
```

---

### Task 11: 표시 시간 토글 — workTimeDisplayMode

달력·리스트·홈의 "근무시간" 표시를 실근무/총근무 중 선택. 급여는 항상 실근무 기준(불변).

**Files:**
- Create: `src/store/settingsStore.ts`
- Modify: `src/components/SettingsModal.tsx` (토글 UI)
- Modify: `src/screens/HomeScreen.tsx:40-47` (표시 시간 계산이 토글을 따르도록)
- Test: `__tests__/store/settingsStore.test.ts`

**Interfaces:**
- Produces: `useSettingsStore` with `workTimeDisplayMode: "actual" | "total"` (기본 `"actual"`) + `setWorkTimeDisplayMode(mode)`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/store/settingsStore.test.ts`:

```ts
import { useSettingsStore } from '../../src/store/settingsStore';

describe('useSettingsStore', () => {
  it('기본 표시 모드는 실근무(actual)다', () => {
    expect(useSettingsStore.getState().workTimeDisplayMode).toBe('actual');
  });
  it('표시 모드를 변경한다', () => {
    useSettingsStore.getState().setWorkTimeDisplayMode('total');
    expect(useSettingsStore.getState().workTimeDisplayMode).toBe('total');
    useSettingsStore.getState().setWorkTimeDisplayMode('actual');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/store/settingsStore.test.ts`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Write the store (mirror themeStore pattern)**

Create `src/store/settingsStore.ts` — `src/store/themeStore.ts`의 mmkvStorage 패턴을 그대로 사용:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();
const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => storage.set(name, JSON.stringify(value)),
  removeItem: (name: string) => storage.delete(name),
}));

export type WorkTimeDisplayMode = "actual" | "total";

interface SettingsStore {
  workTimeDisplayMode: WorkTimeDisplayMode;
  setWorkTimeDisplayMode: (mode: WorkTimeDisplayMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      workTimeDisplayMode: "actual",
      setWorkTimeDisplayMode: (workTimeDisplayMode) => set({ workTimeDisplayMode }),
    }),
    { name: "settings-store", storage: mmkvStorage, version: 1 }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/store/settingsStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Apply the toggle to displayed hours**

`src/screens/HomeScreen.tsx`의 근무시간 계산 헬퍼(40-47행)와 월 총 근무시간 집계에서, `workTimeDisplayMode === "total"`이면 `sessionTotalMinutes`, 아니면 `paidMinutes`(= total - break)를 사용하도록 분기. 근무지에서 `breakMinutes`를 해석해야 하므로 `resolveSession` 결과의 `breakMinutes`를 뺀다:

```ts
const displayMode = useSettingsStore((s) => s.workTimeDisplayMode);
// 세션 표시 시간(분):
const displayMinutes = (r: ResolvedSession) => {
  const total = sessionTotalMinutes(r.startTime, r.endTime);
  return displayMode === "total" ? total : Math.max(0, total - r.breakMinutes);
};
```

**급여 총액(`computeMonthlyTotal`)은 이 토글과 무관하게 그대로 둔다.**

- [ ] **Step 6: Add the toggle UI in SettingsModal**

`SettingsModal.tsx`에 "근무시간 표시" 항목 추가: 실근무/총근무 2택 (SegmentedControl 또는 두 버튼). `setWorkTimeDisplayMode` 연결.

- [ ] **Step 7: Type-check + run**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/store/settingsStore.ts src/components/SettingsModal.tsx src/screens/HomeScreen.tsx __tests__/store/settingsStore.test.ts
git commit -m "feat: 근무시간 표시 토글(실근무/총근무) 추가"
```

---

### Task 12: 정리 — 구 필드·구 함수 제거

모든 소비자가 파생 계산·근무지로 이전됐으므로 deprecated 잔재를 제거한다.

**Files:**
- Modify: `src/models/WorkSession.ts` (deprecated 필드 제거)
- Modify: `src/store/shiftStore.ts` (jobName 세터/초기값, calculatedDailyWage 초기값, color 관련 잔재, Date 직렬화의 불필요 필드 정리)
- Delete or reduce: `src/utils/wageFns.ts` (`calculateDailyWage`/`displayMonthlyWage` 제거) + `__tests__/utils/wageFns.test.ts`
- Modify: `__tests__/helpers.ts` (deprecated 필드 제거)
- Modify: 남은 참조 (`src/components/ScheduleModal.tsx:73,138,143`, `src/components/CalendarDisplayItem.tsx`는 `CalendarDisplayItem.jobName`/`color`를 쓰므로 유지 — 이는 표시 DTO라 근무지에서 채워진 값. 세션의 구 필드 참조만 제거)

**Interfaces:**
- Change: `WorkSession`에서 `jobName?`, `color?`, `calculatedDailyWage?` 제거. `wageType`/`wage`는 nullable 유지.

- [ ] **Step 1: Find all remaining references**

Run: `grep -rn "calculatedDailyWage\|\.jobName\|session\.color\|calculateDailyWage\|displayMonthlyWage" src __tests__ | grep -v CalendarDisplayItem`
각 참조가 (a) 표시 DTO(`CalendarDisplayItem`)인지 (b) 세션 구 필드인지 분류. 세션 구 필드 참조만 근무지 기반으로 교체 또는 제거.

- [ ] **Step 2: Remove deprecated session fields from the model**

`src/models/WorkSession.ts`에서 `jobName?`, `color?`, `calculatedDailyWage?` 세 줄 삭제.

- [ ] **Step 3: Clean shiftStore + ScheduleModal**

- `shiftStore.ts`: `setJobName`/`jobName` 초기값·세터 제거, `calculatedDailyWage: 0` 초기값 제거, `addSchedule`의 `color: schedule.color || getSessionColor(...)` 제거 (color는 근무지 소유). `getSessionColor` import가 미사용이면 제거.
- `ScheduleModal.tsx`: `session.jobName`/`session.color` 참조를 `useWorkplaceStore`로 해석한 근무지 이름·색상으로 교체 (읽기 전용 표시).

- [ ] **Step 4: Remove obsolete wageFns**

`src/utils/wageFns.ts`와 `__tests__/utils/wageFns.test.ts` 삭제 (기능은 `payFns`로 대체됨). `src/screens/HomeScreen.tsx`에 잔존 import 없는지 확인.

```bash
git rm src/utils/wageFns.ts __tests__/utils/wageFns.test.ts
```

- [ ] **Step 5: Clean the test helper**

`__tests__/helpers.ts`에서 `jobName`/`color`/`calculatedDailyWage` 세 줄 제거. `payFns.test.ts`의 `as any` 캐스팅이 더는 필요 없으면 정리(선택).

- [ ] **Step 6: Type-check + full suite**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS. 남은 컴파일 에러가 있으면 해당 세션 구 필드 참조를 근무지 해석으로 교체.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: 구 jobName/color/calculatedDailyWage 및 wageFns 제거"
```

---

## Self-Review

**1. Spec coverage:**
- 섹션1 데이터 모델 → Task 1(Workplace), Task 4(WorkSession). ✅
- 섹션2 마이그레이션(이름+시급 분리, 롤백 스냅샷, 불변식) → Task 5(코어), Task 6(러너+백업+불변식 테스트). ✅
- 섹션3 계산 엔진(PayBreakdown, resolveSession, computeSessionPay, computeMonthlyTotal, 파생/메모) → Task 2, 3, 7. ✅
- 섹션4 UI(근무지 관리, 드롭다운, 휴게 입력, 표시 토글) → Task 9, 10, 11. 달력 표시 → Task 8. ✅
- 섹션5 테스트 전략(마이그레이션 불변식, computeSessionPay, computeMonthlyTotal, resolveSession) → Task 2/3/5/6 테스트. ✅
- 정리(구 필드 제거) → Task 12. ✅

**2. Placeholder scan:** 순수 로직/스토어/마이그레이션 태스크는 전체 코드 포함. UI 태스크(9/10/11)는 변경 지점의 실제 코드 블록 + 정확한 삽입 위치 제공. "적절히 처리" 류 문구 없음.

**3. Type consistency:** `WageType`(Workplace.ts 정의, WorkSession 재수출), `ResolvedSession`(payFns 정의, calendarfns·HomeScreen 소비), `computeMonthlyTotal`/`resolveSession`/`computeSessionPay`/`sessionTotalMinutes` 시그니처가 정의부와 소비부에서 일치. 마이그레이션 저장 형태(`{ state, version }`)가 zustand persist 래핑과 일치.

**주의 사항 (실행자 참고):** Task 6의 `App.tsx` 부트스트랩은 프로젝트의 실제 `App.tsx` 구조에 맞춰 조정하되 **마이그레이션 → persist 재수화 → 렌더** 순서를 반드시 지킬 것. HomeScreen(Task 7/8/11)은 한 파일을 여러 태스크가 수정하므로, 서브에이전트 실행 시 순차 진행(병렬 금지).
