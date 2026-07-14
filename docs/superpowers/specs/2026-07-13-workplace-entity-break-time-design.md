# 근무지 엔티티 + 휴게시간 제외 설계

- 작성일: 2026-07-13
- 상태: 승인됨 (설계 단계)
- 범위: Tier 1 급여 기능의 **기반 작업 + 첫 계산 기능**

## 배경 및 목표

경쟁 앱(Tica) 리뷰 분석 결과, 이 앱에 빠진 급여 계산 핵심 레이어가 확인됨:
휴게시간 제외, 주휴수당, 야간/초과수당, 세금/공제. 이 네 기능은 모두 같은
계산 엔진(`wageFns.ts`)과 데이터 모델(`WorkSession.ts`)을 건드린다.

주휴수당·세금은 **세션(하루)이 아니라 근무지 단위 규칙**이지만, 현재 앱은
근무지가 `jobName` 자유텍스트일 뿐 설정을 붙일 곳이 없다. 따라서 이번 스펙은
공통 기반을 먼저 세우고 그 위에 첫 계산 기능(휴게시간)을 얹는다.

**이번 스펙 범위:**
1. `Workplace` 엔티티 신설 + 기존 데이터 마이그레이션
2. 계산 엔진 리팩터 (파생 계산 방식으로 전환)
3. 휴게시간 제외 기능 + 관련 UI

**향후 별도 스펙:** 주휴수당, 야간/초과수당, 세금/공제. 본 설계는 이 셋을
얹을 수 있도록 확장점(예약 필드)만 남긴다.

## 현재 구조 (변경 전)

- `src/models/WorkSession.ts` — `WorkSession`이 `jobName`(자유텍스트),
  `wageType`, `wage`, `color`, `calculatedDailyWage`(미리 계산된 일급)를 보유
- `src/utils/wageFns.ts` — `calculateDailyWage(session)`가 `시간 × 시급`만 계산.
  `displayMonthlyWage`가 세션에 저장된 `calculatedDailyWage`를 합산
- `src/store/shiftStore.ts` — zustand + MMKV 영구저장, `SCHEDULE_STORE_VERSION = 1`,
  Date/Set 직렬화 처리. `migrate` 함수는 아직 없음
- 문제점: `calculatedDailyWage`가 세션에 캐시되어 있어, 근무지 설정 변경 시
  캐시 무효화가 어렵고, 주휴/세금 같은 주·월 단위 계산을 세션에 담을 수 없다

## 아키텍처 결정

**계산은 저장하지 않고 파생 값으로 (A안).** `calculatedDailyWage` 캐시를 제거하고
`computeSessionPay(session, workplace)`가 구조화된 급여 내역(`PayBreakdown`)을
그때그때 계산한다. 월/주 합계는 그 위에 얹는 순수 집계 함수. 단일 진실 공급원이라
캐시 스테일 문제가 사라지고, 향후 3개 기능이 `PayBreakdown` 필드로 확장된다.
성능은 화면단 `useMemo` 메모이제이션으로 해결.

## 섹션 1 — 데이터 모델

### 신규 엔티티 `Workplace`

새 스토어 `useWorkplaceStore` (MMKV 영구저장, `workplace-store`).

```ts
interface Workplace {
  id: string;
  name: string;              // 기존 jobName이 여기로 승격
  color: string;             // 기존 세션 color가 근무지 단위로 승격
  wageType: "hourly" | "daily" | "monthly";  // 기본값
  wage: number;                               // 기본값
  defaultBreakMinutes: number;                // 기본 휴게(분), 0 가능
  archived: boolean;         // '근무 종료'된 근무지 숨김용
  // ── 확장 예약 (이번엔 미구현, 향후 스펙에서 사용) ──
  // weeklyHolidayPay?, nightPremium?, overtime?, deductions?
}
```

### `WorkSession` 변경

값을 근무지에서 상속하고, 세션은 오버라이드만 저장한다.

```ts
interface WorkSession {
  id: string;
  workplaceId: string;             // 신규. jobName 대체
  // 오버라이드 (null이면 근무지 기본값 사용)
  wageType: "hourly" | "daily" | "monthly" | null;
  wage: number | null;
  breakMinutes: number | null;     // 신규. null이면 근무지 defaultBreakMinutes
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>;
  isCurrentlyWorking: boolean;
  description: string;
  // 제거: jobName, color(근무지로 이동), calculatedDailyWage(파생으로 대체)
}
```

핵심:
- `jobName`/`color` → 근무지로 승격 (N잡러 근무지별 소계·범례가 자연스러워짐)
- `calculatedDailyWage` **제거** → 파생 계산
- `wage`/`wageType`/`breakMinutes`는 **nullable 오버라이드** (null = 근무지 상속)

## 섹션 2 — 마이그레이션 (기존 데이터 보존)

zustand persist `migrate`로 버전 1→2 승격. 앱 시작 시 1회 실행.

1. 마이그레이션 직전 원본 스냅샷을 별도 MMKV 키(`schedule-store-backup-v1`)에
   저장 → 실패 시 롤백 가능 (업데이트 후 데이터 유실 사고 방지)
2. 모든 기존 세션을 순회하며 **distinct `jobName` + `wageType` + `wage` 조합**마다
   `Workplace` 1개 생성
   - 같은 이름이라도 시급이 다르면 별도 근무지 (혼선 방지)
   - 이름이 겹치면 `"이름 (2)"` 식으로 suffix
   - 근무지 `color`는 그 그룹 세션들의 기존 color 중 첫 값
   - `defaultBreakMinutes = 0` (기존엔 휴게 개념이 없었으므로 급여 불변 보장)
3. 각 세션에 `workplaceId` 연결. `wage`/`wageType`는 근무지 기본값과 같으므로 `null`
   (조합 기준으로 묶었으니 항상 일치). `breakMinutes = null`
4. `jobName`/`color`/`calculatedDailyWage` 필드 제거

**불변식 (테스트로 고정):** 마이그레이션 후 모든 세션의 계산 급여·근무일수·근무시간이
마이그레이션 전과 **정확히 동일**해야 한다. `defaultBreakMinutes=0`이므로 보장된다.

## 섹션 3 — 계산 엔진

`wageFns.ts`를 순수 함수 모듈로 재편. 값을 저장하지 않고 파생 계산.

### 핵심 반환 타입 `PayBreakdown`

향후 3개 기능의 확장 홈. 미구현 필드는 이번엔 항상 0.

```ts
interface PayBreakdown {
  totalMinutes: number;    // 총 근무(휴게 포함)
  breakMinutes: number;    // 휴게
  paidMinutes: number;     // 실 근무 = max(0, total - break)
  base: number;            // 기본급 (paidHours × wage) 또는 일급/월급액
  // ── 확장 예약 (이번엔 항상 0) ──
  nightPremium: number;
  overtimePremium: number;
  holidayPay: number;
  gross: number;           // base + 위 세 프리미엄
  deductions: number;      // 이번엔 0
  net: number;             // gross - deductions
}
```

### 함수 계층

```ts
// 근무지 기본값 + 세션 오버라이드 병합 → 유효 설정
resolveSession(session: WorkSession, workplace: Workplace): ResolvedSession

// 세션 하나의 급여 내역 (순수)
computeSessionPay(resolved: ResolvedSession): PayBreakdown
//  - hourly:  paidMinutes = max(0, total - breakMinutes); base = paidHours × wage
//  - daily:   base = wage (휴게 무관); paidMinutes은 표시용으로만 계산
//  - monthly: base = 0 (월 집계에서 1회 반영)

// 기간 집계 (달력/홈 총액)
computeMonthlyTotal(
  dateSchedule: ScheduleByDate,
  sessions: SchedulesById,
  workplaces: Record<string, Workplace>,
  month: Date
): {
  gross: number;
  net: number;
  workDays: number;
  paidMinutes: number;
  byWorkplace: Record<string, { gross: number; net: number; paidMinutes: number }>;
}
```

- **자정 넘김:** 기존 로직(`endMinutes < startMinutes`이면 +24h) 그대로 보존
- **월급제:** base=0로 두고 월 집계에서 해당 월 근무일이 있으면 전액 1회 반영 (현행 유지)
- **메모이제이션:** 화면단에서 `computeMonthlyTotal`을 `useMemo`(월·데이터 기준)로 감싼다

### 교체 대상

- `displayMonthlyWage` → `computeMonthlyTotal`
- `calculateDailyWage` → `computeSessionPay`
- 호출부: `HomeScreen.tsx`의 총액/일별 표시 부분

## 섹션 4 — 휴게시간 기능 & UI

### (a) 근무지 관리 화면 (신규)

- 근무지 목록 + 생성/편집/보관(archive)
- 편집 항목: 이름, 색상, 기본 시급/급여유형, 기본 휴게시간(분)
- 진입점: SettingsModal 또는 홈 범례 탭

### (b) 세션 생성/편집 모달 (`NewSessionModal.tsx`)

- 근무지 입력을 자유텍스트 → **근무지 선택 드롭다운 + "새 근무지" 추가**로 교체
- 근무지 선택 시 시급·휴게 기본값 자동 채움
- **휴게시간 입력 필드(분) 추가** — 기본값은 근무지 기본 휴게, 수정 시 세션 오버라이드
- 실시간 미리보기: "실 근무 7시간 (총 8시간, 휴게 60분)"

### (c) 휴게시간 입력 방식

- 숫자 분 입력(예: 60). 급여는 항상 무급 제외(시급제만 영향). 일급/월급제는 표시만

### (d) 표시 토글 설정

- 새 설정 `workTimeDisplayMode: "actual" | "total"` (테마 스토어 옆 `settingsStore`)
- 달력 일별 시간·리스트·홈 총 시간이 이 설정을 따름
- **급여는 토글과 무관하게 항상 실근무 기준**
- 기본값 `"actual"`

### (e) 달력 셀 표시

- 급여는 net(실근무) 기준으로 반영
- 정렬/도트 개선은 이번 스코프 제외 (Tier 2)

## 섹션 5 — 테스트 전략

TDD로 진행. 순수 계산 함수와 마이그레이션이 주 테스트 대상, UI는 얇게.

1. **마이그레이션 불변식 (최우선):** 전/후 모든 세션의 계산 급여·근무일수 동일.
   이름 충돌 suffix, 같은 이름+다른 시급 분리, 롤백 스냅샷 생성 검증
2. **`computeSessionPay`:** 시급/일급/월급 각각, 휴게 제외(60분→실7h),
   휴게가 근무보다 클 때 하한 0, 자정 넘김 + 휴게 조합, 오버라이드 우선순위(세션>근무지)
3. **`computeMonthlyTotal`:** 월급 1회 반영, 근무지별 소계 합 = 전체, 실근무분 집계
4. **`resolveSession`:** null 오버라이드 → 근무지 상속, 값 있으면 세션 우선

프레임워크는 리포 현황 확인 후 사용(없으면 Jest 세팅). UI 컴포넌트는 최소한.

## 범위에서 제외 (향후 스펙)

- 주휴수당, 야간/초과수당, 세금/공제 (확장 필드만 예약)
- 하루 기록 시간순 정렬, 달력 도트 개선 (Tier 2)
- 근무지별 급여일/급여기간 (Tier 3)
- 백업/복원 UI, 클라우드 동기화 (Tier 2, 단 마이그레이션 롤백 스냅샷은 이번에 포함)
