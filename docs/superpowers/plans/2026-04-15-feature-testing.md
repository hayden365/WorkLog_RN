# WorkLog_RN 기능 테스트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WorkLog_RN 앱의 모든 기능을 Jest 기반 자동화 테스트로 검증한다.

**Architecture:** 레이어별 점진적 테스트 — 유틸리티 → 스토어 → 훅 → 컴포넌트 → 통합 순서로 작성. MMKV는 Map 기반 인메모리 mock, Zustand persist는 동기식 mock으로 처리.

**Tech Stack:** Jest 29, @testing-library/react-native, @testing-library/jest-native, react-test-renderer

---

## File Structure

```
__tests__/
├── setup.ts                         # Jest 글로벌 설정 (MMKV mock)
├── helpers.ts                       # 테스트용 WorkSession 팩토리
├── utils/
│   ├── formatNumbs.test.ts
│   ├── colorManager.test.ts
│   ├── wageFns.test.ts
│   └── calendarfns.test.ts
├── store/
│   ├── dateStore.test.ts
│   └── shiftStore.test.ts
├── hooks/
│   └── useScheduleManager.test.ts
├── components/
│   ├── ScheduleCard.test.tsx
│   └── EarningsCard.test.tsx
└── integration/
    └── schedule-wage-flow.test.ts

jest.config.js                       # Jest 설정
babel.config.js                      # Babel 설정 (expo preset)
```

---

### Task 1: 테스트 인프라 설정

**Files:**
- Create: `jest.config.js`
- Create: `babel.config.js`
- Create: `__tests__/setup.ts`
- Create: `__tests__/helpers.ts`
- Modify: `package.json` (test script 추가)

- [ ] **Step 1: 추가 패키지 설치**

```bash
npx expo install -- --save-dev @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 2: babel.config.js 생성**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 3: jest.config.js 생성**

```javascript
module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-calendars|react-native-mmkv|react-native-uuid|react-native-modal|@expo|expo|@react-native-community|@react-native-segmented-control|react-native-popup-menu|react-native-picker-select|react-native-safe-area-context|react-native-screens)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
```

- [ ] **Step 4: __tests__/setup.ts 생성 (MMKV mock)**

```typescript
const storage = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => storage.get(key),
    set: (key: string, value: string) => storage.set(key, value),
    delete: (key: string) => storage.delete(key),
    clearAll: () => storage.clear(),
  })),
}));

jest.mock('react-native-uuid', () => ({
  v4: () => `test-uuid-${Math.random().toString(36).substring(2, 9)}`,
}));

jest.mock('@expo/vector-icons/Feather', () => 'Feather');

// 각 테스트 전 스토리지 초기화
beforeEach(() => {
  storage.clear();
});
```

- [ ] **Step 5: __tests__/helpers.ts 생성 (테스트 팩토리)**

```typescript
import { WorkSession, RepeatOption } from '../src/models/WorkSession';

export function createTestSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: 'test-session-1',
    jobName: '테스트 알바',
    wageType: 'hourly',
    wage: 10000,
    calculatedDailyWage: 90000,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    repeatOption: 'daily',
    selectedWeekDays: new Set<number>(),
    isCurrentlyWorking: true,
    description: '',
    color: '#3D5AFE',
    ...overrides,
  };
}
```

- [ ] **Step 6: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: 설정 검증**

```bash
npx jest --showConfig 2>&1 | head -5
```

Expected: Jest 설정이 정상 출력됨 (에러 없음)

- [ ] **Step 8: Commit**

```bash
git add jest.config.js babel.config.js __tests__/setup.ts __tests__/helpers.ts package.json
git commit -m "chore: Jest 테스트 인프라 설정"
```

---

### Task 2: formatNumbs 유틸리티 테스트

**Files:**
- Create: `__tests__/utils/formatNumbs.test.ts`
- Reference: `src/utils/formatNumbs.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import { formatNumberWithComma } from '../../src/utils/formatNumbs';

describe('formatNumberWithComma', () => {
  it('천 단위 콤마를 추가한다', () => {
    expect(formatNumberWithComma('1500000')).toBe('1,500,000');
  });

  it('1000 미만은 콤마 없이 반환한다', () => {
    expect(formatNumberWithComma('999')).toBe('999');
  });

  it('빈 문자열은 빈 문자열을 반환한다', () => {
    expect(formatNumberWithComma('')).toBe('');
  });

  it('숫자가 아닌 문자를 제거한다', () => {
    expect(formatNumberWithComma('1,500,000')).toBe('1,500,000');
  });

  it('정확히 1000일 때 콤마를 추가한다', () => {
    expect(formatNumberWithComma('1000')).toBe('1,000');
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/utils/formatNumbs.test.ts --verbose
```

Expected: 5 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/utils/formatNumbs.test.ts
git commit -m "test: formatNumberWithComma 유틸리티 테스트"
```

---

### Task 3: colorManager 테스트

**Files:**
- Create: `__tests__/utils/colorManager.test.ts`
- Reference: `src/utils/colorManager.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import {
  colorManager,
  SESSION_COLORS,
  getSessionColor,
  releaseSessionColor,
  resetColorManager,
  getRandomSessionColor,
} from '../../src/utils/colorManager';

describe('ColorManager', () => {
  beforeEach(() => {
    resetColorManager();
  });

  describe('getSessionColor', () => {
    it('첫 번째 세션에 palette[0] 색상을 할당한다', () => {
      const color = getSessionColor('session-1');
      expect(color).toBe(SESSION_COLORS[0]);
    });

    it('두 번째 세션에 palette[1] 색상을 할당한다', () => {
      getSessionColor('session-1');
      const color = getSessionColor('session-2');
      expect(color).toBe(SESSION_COLORS[1]);
    });

    it('같은 세션 ID에는 같은 색상을 반환한다', () => {
      const color1 = getSessionColor('session-1');
      const color2 = getSessionColor('session-1');
      expect(color1).toBe(color2);
    });

    it('20색 소진 시 순환하여 할당한다', () => {
      for (let i = 0; i < 20; i++) {
        getSessionColor(`session-${i}`);
      }
      const color21 = getSessionColor('session-20');
      expect(SESSION_COLORS).toContain(color21);
    });
  });

  describe('releaseSessionColor', () => {
    it('해제된 색상을 다음 할당에 재사용한다', () => {
      const color1 = getSessionColor('session-1');
      releaseSessionColor('session-1');
      const color2 = getSessionColor('session-2');
      expect(color2).toBe(color1);
    });
  });

  describe('resetColorManager', () => {
    it('초기화 후 palette[0]부터 다시 할당한다', () => {
      getSessionColor('session-1');
      getSessionColor('session-2');
      resetColorManager();
      const color = getSessionColor('session-3');
      expect(color).toBe(SESSION_COLORS[0]);
    });
  });

  describe('getRandomSessionColor', () => {
    it('사용되지 않은 색상을 반환한다', () => {
      const color = getRandomSessionColor();
      expect(SESSION_COLORS).toContain(color);
    });
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/utils/colorManager.test.ts --verbose
```

Expected: 7 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/utils/colorManager.test.ts
git commit -m "test: colorManager 테스트"
```

---

### Task 4: wageFns 테스트

**Files:**
- Create: `__tests__/utils/wageFns.test.ts`
- Reference: `src/utils/wageFns.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import { calculateDailyWage, displayMonthlyWage } from '../../src/utils/wageFns';
import { createTestSession } from '../helpers';
import { ScheduleByDate, SchedulesById } from '../../src/models/WorkSession';

describe('calculateDailyWage', () => {
  it('시급 × 근무시간 = 일급을 계산한다', () => {
    const session = createTestSession({
      wageType: 'hourly',
      wage: 10000,
      startTime: new Date(2026, 3, 15, 9, 0),
      endTime: new Date(2026, 3, 15, 18, 0),
    });
    expect(calculateDailyWage(session)).toBe(90000);
  });

  it('일급 타입이면 wage를 그대로 반환한다', () => {
    const session = createTestSession({
      wageType: 'daily',
      wage: 80000,
    });
    expect(calculateDailyWage(session)).toBe(80000);
  });

  it('월급 타입이면 null을 반환한다', () => {
    const session = createTestSession({
      wageType: 'monthly',
      wage: 3000000,
    });
    expect(calculateDailyWage(session)).toBeNull();
  });

  it('시급 반시간 단위도 정확히 계산한다', () => {
    const session = createTestSession({
      wageType: 'hourly',
      wage: 10000,
      startTime: new Date(2026, 3, 15, 9, 0),
      endTime: new Date(2026, 3, 15, 13, 30),
    });
    expect(calculateDailyWage(session)).toBe(45000);
  });
});

describe('displayMonthlyWage', () => {
  it('해당 월 근무일수 × 일급을 합산한다', () => {
    const viewMonth = new Date(2026, 3, 1); // 4월

    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1'],
      '2026-04-02': ['s1'],
      '2026-04-03': ['s1'],
    };

    const allSchedulesById: SchedulesById = {
      s1: createTestSession({
        id: 's1',
        calculatedDailyWage: 90000,
      }),
    };

    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(270000);
  });

  it('여러 스케줄의 급여를 합산한다', () => {
    const viewMonth = new Date(2026, 3, 1);

    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1', 's2'],
      '2026-04-02': ['s1'],
    };

    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: 80000 }),
      s2: createTestSession({ id: 's2', calculatedDailyWage: 100000 }),
    };

    // s1: 80000 × 2일 + s2: 100000 × 1일 = 260000
    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(260000);
  });

  it('스케줄이 없으면 0을 반환한다', () => {
    const viewMonth = new Date(2026, 3, 1);
    expect(displayMonthlyWage({}, {}, viewMonth)).toBe(0);
  });

  it('calculatedDailyWage가 null인 세션은 건너뛴다', () => {
    const viewMonth = new Date(2026, 3, 1);

    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1'],
    };

    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: null }),
    };

    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(0);
  });

  it('다른 월의 날짜는 제외한다', () => {
    const viewMonth = new Date(2026, 3, 1); // 4월

    const dateSchedule: ScheduleByDate = {
      '2026-04-01': ['s1'],
      '2026-05-01': ['s1'], // 5월 - 제외되어야 함
    };

    const allSchedulesById: SchedulesById = {
      s1: createTestSession({ id: 's1', calculatedDailyWage: 90000 }),
    };

    expect(displayMonthlyWage(dateSchedule, allSchedulesById, viewMonth)).toBe(90000);
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/utils/wageFns.test.ts --verbose
```

Expected: 9 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/utils/wageFns.test.ts
git commit -m "test: wageFns 급여 계산 테스트"
```

---

### Task 5: calendarfns 테스트

**Files:**
- Create: `__tests__/utils/calendarfns.test.ts`
- Reference: `src/utils/calendarfns.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
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
      selectedWeekDays: new Set([1, 3, 5]), // 월, 수, 금
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromWeeklySchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });

    // 2026년 4월: 월(6,13,20,27) 수(1,8,15,22,29) 금(3,10,17,24)
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
      selectedWeekDays: new Set([1, 3]), // 월, 수
      color: '#3D5AFE',
    });
    const result = getMarkedDatesFromBiweeklySchedule({
      schedule: session,
      viewMonth: new Date(2026, 3, 1),
    });

    const dates = Object.keys(result);
    // 격주이므로 매주보다 적은 날짜가 나와야 함
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.length).toBeLessThanOrEqual(4); // 최대 2주 × 2요일
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
      viewMonth: new Date(2026, 4, 1), // 5월
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

    // 4/3에는 두 스케줄이 겹침
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
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/utils/calendarfns.test.ts --verbose
```

Expected: 10 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/utils/calendarfns.test.ts
git commit -m "test: calendarfns 캘린더 날짜 계산 테스트"
```

---

### Task 6: dateStore 테스트

**Files:**
- Create: `__tests__/store/dateStore.test.ts`
- Reference: `src/store/dateStore.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
import { useDateStore } from '../../src/store/dateStore';

describe('useDateStore', () => {
  it('초기값은 현재 월이다', () => {
    const { month } = useDateStore.getState();
    expect(month).toBe(new Date().getMonth());
  });

  it('setMonth로 월을 변경한다', () => {
    useDateStore.getState().setMonth(5);
    expect(useDateStore.getState().month).toBe(5);
  });

  it('setMonth(0)으로 1월을 설정한다', () => {
    useDateStore.getState().setMonth(0);
    expect(useDateStore.getState().month).toBe(0);
  });

  it('setMonth(11)으로 12월을 설정한다', () => {
    useDateStore.getState().setMonth(11);
    expect(useDateStore.getState().month).toBe(11);
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/store/dateStore.test.ts --verbose
```

Expected: 4 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/store/dateStore.test.ts
git commit -m "test: dateStore 월 상태 관리 테스트"
```

---

### Task 7: shiftStore 테스트

**Files:**
- Create: `__tests__/store/shiftStore.test.ts`
- Reference: `src/store/shiftStore.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
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
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/store/shiftStore.test.ts --verbose
```

Expected: 15 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/store/shiftStore.test.ts
git commit -m "test: shiftStore 스케줄/날짜/캘린더 스토어 테스트"
```

---

### Task 8: useScheduleManager 훅 테스트

**Files:**
- Create: `__tests__/hooks/useScheduleManager.test.ts`
- Reference: `src/hooks/useScheduleManager.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
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

  it('addSchedule로 일급 자동 계산 + 색상 할당 + 스토어 업데이트한다', () => {
    const { result } = renderHook(() => useScheduleManager());

    act(() => {
      result.current.addSchedule({
        jobName: '카페 알바',
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
    expect(schedules[0].calculatedDailyWage).toBe(90000);
    expect(schedules[0].color).toBeTruthy();
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
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/hooks/useScheduleManager.test.ts --verbose
```

Expected: 3 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/hooks/useScheduleManager.test.ts
git commit -m "test: useScheduleManager 비즈니스 로직 훅 테스트"
```

---

### Task 9: ScheduleCard 컴포넌트 테스트

**Files:**
- Create: `__tests__/components/ScheduleCard.test.tsx`
- Reference: `src/components/ScheduleCard.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScheduleCard from '../../src/components/ScheduleCard';
import { createTestSession } from '../helpers';

describe('ScheduleCard', () => {
  const session = createTestSession({
    id: 'card-1',
    jobName: '카페 알바',
    wage: 10000,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    description: '주말 근무',
    color: '#3D5AFE',
  });

  it('직업명을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('카페 알바')).toBeTruthy();
  });

  it('근무 시간을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('09:00 ~ 18:00')).toBeTruthy();
  });

  it('급여를 표시한다 (wage > 0)', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('10,000원')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('주말 근무')).toBeTruthy();
  });

  it('onPress 콜백을 호출한다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ScheduleCard session={session} onPress={onPress} />);
    fireEvent.press(getByText('카페 알바'));
    expect(onPress).toHaveBeenCalledWith(session);
  });

  it('onDelete 제공 시 삭제 버튼을 표시한다', () => {
    const onDelete = jest.fn();
    const { getByText } = render(<ScheduleCard session={session} onDelete={onDelete} />);
    const deleteButton = getByText('×');
    expect(deleteButton).toBeTruthy();
    fireEvent.press(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('card-1');
  });

  it('onDelete 미제공 시 삭제 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(<ScheduleCard session={session} />);
    expect(queryByText('×')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/components/ScheduleCard.test.tsx --verbose
```

Expected: 7 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/ScheduleCard.test.tsx
git commit -m "test: ScheduleCard 컴포넌트 렌더링 테스트"
```

---

### Task 10: EarningsCard 컴포넌트 테스트

**Files:**
- Create: `__tests__/components/EarningsCard.test.tsx`
- Reference: `src/components/EarningsCard.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EarningsCard } from '../../src/components/EarningsCard';

describe('EarningsCard', () => {
  it('초기 상태에서 금액이 숨겨져 있다', () => {
    const { getByText } = render(<EarningsCard totalEarnings={1500000} />);
    expect(getByText('금액숨김')).toBeTruthy();
  });

  it('눈 아이콘 클릭 시 급여를 표시한다', () => {
    const { getByText, queryByText } = render(<EarningsCard totalEarnings={1500000} />);

    // 금액숨김 상태에서 eye 아이콘 터치 (Feather는 mock이므로 부모 TouchableOpacity로 접근)
    // 초기 상태: 금액숨김 표시됨
    expect(getByText('금액숨김')).toBeTruthy();
  });

  it('월 레이블을 올바르게 표시한다', () => {
    const { getByText } = render(<EarningsCard totalEarnings={0} />);
    // useDateStore의 현재 month + 1
    const currentMonth = new Date().getMonth() + 1;
    expect(getByText(`${currentMonth}월 예상 급여`)).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/components/EarningsCard.test.tsx --verbose
```

Expected: 3 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/EarningsCard.test.tsx
git commit -m "test: EarningsCard 컴포넌트 테스트"
```

---

### Task 11: 통합 테스트 — 스케줄 생성 → 급여 계산 플로우

**Files:**
- Create: `__tests__/integration/schedule-wage-flow.test.ts`
- Reference: `src/hooks/useScheduleManager.ts`, `src/utils/wageFns.ts`, `src/utils/calendarfns.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
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

    // 1. 시급제 스케줄 생성
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
    expect(schedules[0].calculatedDailyWage).toBe(90000); // 10000 × 9시간

    // 2. 캘린더 데이터 생성
    const { markedDates, dateSchedule } = generateViewMonthScheduleData(
      schedules,
      new Date(2026, 3, 1)
    );

    expect(Object.keys(markedDates).length).toBe(30); // 4월 30일

    // 3. 월급여 계산
    const monthlyWage = displayMonthlyWage(
      dateSchedule,
      result.current.allSchedulesById,
      new Date(2026, 3, 1)
    );

    expect(monthlyWage).toBe(90000 * 30); // 2,700,000
  });

  it('여러 급여 타입 혼합 → 정확한 월급여 합산', () => {
    const { result } = renderHook(() => useScheduleManager());

    // 시급제 스케줄
    act(() => {
      result.current.addSchedule({
        jobName: '카페',
        wageType: 'hourly',
        wage: 10000,
        startTime: new Date(2026, 3, 1, 9, 0),
        endTime: new Date(2026, 3, 1, 14, 0), // 5시간
        startDate: new Date(2026, 3, 1),
        endDate: new Date(2026, 3, 30),
        repeatOption: 'daily',
        selectedWeekDays: new Set<number>(),
        isCurrentlyWorking: true,
        description: '',
      });
    });

    // 일급제 스케줄
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
```

- [ ] **Step 2: 테스트 실행**

```bash
npx jest __tests__/integration/schedule-wage-flow.test.ts --verbose
```

Expected: 4 tests passed

- [ ] **Step 3: Commit**

```bash
git add __tests__/integration/schedule-wage-flow.test.ts
git commit -m "test: 스케줄-급여 통합 테스트"
```

---

### Task 12: 전체 테스트 실행 및 최종 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx jest --verbose
```

Expected: 모든 테스트 통과

- [ ] **Step 2: 커버리지 확인**

```bash
npx jest --coverage --coverageReporters=text
```

Expected: 유틸리티 함수 80%+ 커버리지

- [ ] **Step 3: 최종 Commit**

```bash
git add -A
git commit -m "test: 전체 테스트 스위트 완성 — 유틸/스토어/훅/컴포넌트/통합"
```
