# WorkLog_RN 기능 정의 및 테스트 설계

## 개요

WorkLog_RN 앱의 현재 기능을 정의하고, Jest 기반 자동화 테스트를 레이어별로 작성한다.
MMKV/Zustand은 Mock 처리하며, 기능 정의 문서와 테스트 코드를 분리하여 관리한다.

## 기능 정의

### 1. 스케줄 관리

- **생성**: 직업명, 급여(시급/일급/월급), 근무 시간, 날짜, 반복 설정, 메모를 입력하여 스케줄 생성
- **수정**: 기존 스케줄의 모든 필드 수정 가능
- **삭제**: 확인 알림 후 스케줄 삭제, 관련 날짜맵/캘린더 데이터 정리
- **조회**: ID로 단건 조회, 전체 목록 조회
- **초기화**: 모든 스케줄 데이터 일괄 삭제

### 2. 반복 패턴

- **없음(none)**: 단일 날짜 또는 시작~종료 날짜 범위
- **매일(daily)**: 시작일~종료일 사이 매일
- **매주(weekly)**: 선택된 요일(월~일)에만 반복
- **격주(biweekly)**: 선택된 요일, 2주 간격으로 반복
- **매월(monthly)**: 매월 같은 날짜에 반복

### 3. 급여 계산

- **시급→일급 변환**: 시급 × (종료시간 - 시작시간)
- **일급**: 입력값 그대로 사용
- **월급→일급**: 월급 ÷ 30
- **월별 합산**: 해당 월 근무일수 × 일급, 모든 스케줄 합산
- **포맷**: 천 단위 콤마 (예: 1,500,000)

### 4. 캘린더 표시

- **날짜별 매핑**: 각 날짜에 해당하는 스케줄 ID 목록 관리
- **색상 배지**: 스케줄별 고유 색상 할당 (20색 팔레트, 순환)
- **월 이동**: 이전/다음 월 탐색 시 해당 월 스케줄 데이터 재계산
- **날짜 선택**: 탭하면 해당 날짜의 스케줄 목록 표시

### 5. 데이터 관리

- **영속성**: MMKV 기반 로컬 저장 (앱 재시작 시 유지)
- **내보내기**: 전체 스케줄 데이터를 JSON으로 직렬화
- **가져오기**: JSON 데이터를 역직렬화하여 복원

---

## 테스트 설계

### 접근 방식

레이어별 점진적 테스트 (Layer 1 → 5 순서)로 작성한다.
하위 레이어가 검증된 상태에서 상위 레이어를 테스트한다.

### 테스트 인프라

#### 디렉토리 구조

```
__tests__/
├── setup.ts
├── mocks/
│   ├── mmkv.ts
│   └── zustand.ts
├── utils/
│   ├── calendarfns.test.ts
│   ├── wageFns.test.ts
│   ├── colorManager.test.ts
│   └── formatNumbs.test.ts
├── store/
│   ├── shiftStore.test.ts
│   └── dateStore.test.ts
├── hooks/
│   └── useScheduleManager.test.ts
├── components/
│   ├── ScheduleCard.test.tsx
│   ├── EarningsCard.test.tsx
│   ├── CalendarPage.test.tsx
│   └── NewSessionModal.test.tsx
└── integration/
    ├── schedule-creation.test.tsx
    ├── calendar-display.test.tsx
    └── wage-calculation.test.tsx
```

#### 추가 패키지

- `@testing-library/react-native` — 컴포넌트/통합 테스트 렌더링 및 인터랙션
- `@testing-library/jest-native` — 커스텀 매처 (toBeVisible, toHaveTextContent 등)

#### Jest 설정

- `jest.config.js` 생성 (preset: react-native, setupFiles, transformIgnorePatterns)
- `package.json`에 `"test": "jest"` 스크립트 추가
- `__tests__/setup.ts`에서 MMKV를 Map 기반 인메모리 mock으로 교체
- Zustand persist 미들웨어를 동기식 mock으로 교체

#### MMKV Mock 전략

```typescript
// Map 기반 인메모리 구현
const storage = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => storage.get(key),
    set: (key: string, value: string) => storage.set(key, value),
    delete: (key: string) => storage.delete(key),
    clearAll: () => storage.clear(),
  })),
}));
```

### 테스트 케이스

#### Layer 1: 유틸리티 함수

**wageFns.test.ts**

| 테스트 | 입력 | 기대 결과 |
|--------|------|-----------|
| 시급→일급 계산 | 시급 10000, 09:00~18:00 | 90000 |
| 일급 타입 그대로 반환 | 일급 80000 | 80000 |
| 월급→일급 변환 | 월급 3000000 | 100000 |
| 월급여 합산 | 2개 스케줄, 각각 20일 근무 | 합산값 |
| 스케줄 없으면 0 | 빈 배열 | 0 |

**calendarfns.test.ts**

| 테스트 | 입력 | 기대 결과 |
|--------|------|-----------|
| 단일 날짜 마킹 | none, 2026-04-15 | { "2026-04-15": [sessionId] } |
| 날짜 범위 마킹 | none, 04-15~04-17 | 3일 마킹 |
| 매일 반복 | daily, 04-01~04-30 | 30일 마킹 |
| 매주 반복 (월,수,금) | weekly, [1,3,5] | 해당 요일만 마킹 |
| 격주 반복 | biweekly, [1,3] | 2주 간격 해당 요일만 |
| 매월 반복 | monthly, 15일 | 매월 15일 마킹 |
| 월 경계 처리 | 여러 패턴 혼합 | 올바른 통합 결과 |

**colorManager.test.ts**

| 테스트 | 기대 결과 |
|--------|-----------|
| 순차 색상 할당 | 첫 번째는 palette[0], 두 번째는 palette[1] |
| 20색 소진 시 순환 | 21번째는 palette[0] |
| releaseSessionColor 후 재할당 | 해제된 색상 재사용 |
| resetColorManager | 전체 초기화 후 palette[0]부터 재시작 |

**formatNumbs.test.ts**

| 테스트 | 입력 | 기대 결과 |
|--------|------|-----------|
| 천 단위 콤마 | "1500000" | "1,500,000" |
| 1000 미만 | "999" | "999" |
| 빈 값 처리 | "" | "" 또는 "0" |

#### Layer 2: 스토어

**shiftStore.test.ts**

| 테스트 | 기대 결과 |
|--------|-----------|
| useShiftStore 초기값 | 모든 필드 기본값 |
| 폼 값 변경 | 개별 필드 업데이트 반영 |
| reset() | 모든 필드 초기값 복원 |
| useScheduleStore.addSchedule | 스케줄 추가 후 조회 가능 |
| useScheduleStore.updateSchedule | 수정 후 변경값 반영 |
| useScheduleStore.deleteSchedule | 삭제 후 조회 불가 |
| useScheduleStore.clear | 전체 스케줄 제거 |
| useDateScheduleStore | 날짜-세션ID 매핑 정확성 |
| useCalendarDisplayStore | 표시 데이터 저장/조회/초기화 |

**dateStore.test.ts**

| 테스트 | 기대 결과 |
|--------|-----------|
| 초기값 | 현재 월 (0-11) |
| setMonth(5) | month === 5 |

#### Layer 3: 훅

**useScheduleManager.test.ts**

| 테스트 | 기대 결과 |
|--------|-----------|
| addSchedule | 일급 자동 계산 + 색상 할당 + 3개 스토어 동시 업데이트 |
| deleteSchedule | 스케줄 삭제 + 날짜맵 정리 + 캘린더 정리 |
| clearAllData | 모든 스토어 초기화 |
| exportData | JSON 직렬화 결과에 모든 스케줄 포함 |
| importData | 역직렬화 후 스토어 복원 정확성 |

#### Layer 4: 컴포넌트

**ScheduleCard.test.tsx**

| 테스트 | 기대 결과 |
|--------|-----------|
| 세션 정보 표시 | jobName, 시간, 급여 렌더링 |
| 삭제 버튼 콜백 | onDelete 호출 + 올바른 sessionId 전달 |
| onDelete 미제공 시 | 삭제 버튼 미렌더링 |

**EarningsCard.test.tsx**

| 테스트 | 기대 결과 |
|--------|-----------|
| 급여 표시 | 포맷된 금액 렌더링 |
| 눈 아이콘 토글 | 숨김/표시 전환 |

**CalendarPage.test.tsx**

| 테스트 | 기대 결과 |
|--------|-----------|
| 날짜 선택 콜백 | onDaySelected에 선택 날짜 전달 |
| 색상 배지 렌더링 | 스케줄 있는 날짜에 배지 표시 |

**NewSessionModal.test.tsx**

| 테스트 | 기대 결과 |
|--------|-----------|
| 생성 모드 렌더링 | 빈 폼 표시 |
| 수정 모드 렌더링 | 기존 데이터 프리필 |
| 저장 버튼 | onSave에 올바른 데이터 전달 |

#### Layer 5: 통합 테스트

**schedule-creation.test.tsx**

| 시나리오 | 검증 포인트 |
|----------|-------------|
| 폼 입력 → 저장 | 스토어에 스케줄 저장됨 |
| 저장 후 캘린더 | 해당 날짜에 배지 표시 |
| 저장 후 급여 | 월급여 합산에 반영 |

**calendar-display.test.tsx**

| 시나리오 | 검증 포인트 |
|----------|-------------|
| 여러 스케줄 등록 | 각 날짜에 올바른 배지 |
| 월 이동 | 해당 월 스케줄만 표시 |
| 스케줄 삭제 후 | 배지 제거됨 |

**wage-calculation.test.tsx**

| 시나리오 | 검증 포인트 |
|----------|-------------|
| 시급/일급/월급 혼합 | 월 합산 정확성 |
| 스케줄 추가/삭제 | 급여 재계산 반영 |
| 빈 월 | 0원 표시 |
