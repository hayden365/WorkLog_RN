# 홈 리디자인 + Pretendard 타이포그래피 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면의 시스템 기본 폰트를 Pretendard로 교체하고, 숫자·달력 위계를 재정비해 "촌스러움"을 제거한다.

**Architecture:** Pretendard 정적 4 웨이트를 `expo-font`의 `useFonts`로 런타임 로드(리빌드 불필요). 안드로이드 웨이트 선택 이슈는 `tokens.ts`의 `font(weight)` 헬퍼(웨이트→fontFamily 매핑)로 단일화. 전역 기본 폰트를 Pretendard-Regular로 깔고, 홈 화면은 `font()`로 정밀 웨이트 적용. 달력 금액은 옅은 회색으로 후퇴.

**Tech Stack:** React Native 0.83, Expo SDK 55, expo-font, TypeScript, Jest + @testing-library/react-native.

## Global Constraints

- 폰트 파일: `assets/fonts/Pretendard-{Regular,Medium,SemiBold,Bold}.ttf` (이미 저장소에 준비됨, SIL OFL 1.1, `Pretendard-LICENSE.txt` 포함).
- 폰트 패밀리명은 정확히 `Pretendard-Regular` / `Pretendard-Medium` / `Pretendard-SemiBold` / `Pretendard-Bold` (useFonts 키 = fontFamily 값).
- brand 색상 `#3b82f6` 등 기존 팔레트·spacing·radius·fontSize 스케일은 유지. 레이아웃 골격 변경 없음.
- 커밋 메시지는 기존 컨벤션(`feat(ui):` / `chore:` / `test:` 등, 한글 요약) 따름.

---

### Task 1: 타이포그래피 토큰 — `font()` / `numeric` 헬퍼

**Files:**
- Modify: `src/theme/tokens.ts`
- Test: `__tests__/theme/tokens.test.ts` (create)

**Interfaces:**
- Produces:
  - `fontFamily: { regular; medium; semibold; bold }` — 값은 위 패밀리명 문자열.
  - `font(weight?: 'regular'|'medium'|'semibold'|'bold'): { fontFamily: string; fontWeight: string }` — 기본값 `'regular'`.
  - `numeric: { fontVariant: ['tabular-nums'] }`.

- [ ] **Step 1: Write the failing test**

`__tests__/theme/tokens.test.ts`:
```ts
import { font, fontFamily, numeric } from '../../src/theme/tokens';

describe('typography helpers', () => {
  test('font() maps weight to Pretendard family + RN weight', () => {
    expect(font('bold')).toEqual({ fontFamily: 'Pretendard-Bold', fontWeight: '700' });
    expect(font('semibold')).toEqual({ fontFamily: 'Pretendard-SemiBold', fontWeight: '600' });
    expect(font('medium')).toEqual({ fontFamily: 'Pretendard-Medium', fontWeight: '500' });
    expect(font()).toEqual({ fontFamily: 'Pretendard-Regular', fontWeight: '400' });
  });

  test('fontFamily map exposes the four Pretendard families', () => {
    expect(fontFamily.regular).toBe('Pretendard-Regular');
    expect(fontFamily.bold).toBe('Pretendard-Bold');
  });

  test('numeric enables tabular figures', () => {
    expect(numeric.fontVariant).toContain('tabular-nums');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/theme/tokens.test.ts`
Expected: FAIL — `font is not a function` / module has no such export.

- [ ] **Step 3: Add the helpers to `src/theme/tokens.ts`**

기존 `fontWeight` 선언 아래에 추가:
```ts
/**
 * Pretendard family names, keyed by the same weight labels as `fontWeight`.
 * Android cannot pick a static font's weight from `fontWeight` alone, so we
 * bind an explicit family per weight and let `fontWeight` cover iOS.
 */
export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

/** Style fragment binding the correct Pretendard family + RN weight. */
export function font(weight: keyof typeof fontFamily = 'regular') {
  return { fontFamily: fontFamily[weight], fontWeight: fontWeight[weight] };
}

/** Tabular (fixed-width) figures — spread onto any numeric Text style. */
export const numeric = { fontVariant: ['tabular-nums'] as ['tabular-nums'] };
```

그리고 `typography` 그룹에 `family: fontFamily`를 추가:
```ts
export const typography = {
  size: fontSize,
  weight: fontWeight,
  family: fontFamily,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/theme/tokens.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts __tests__/theme/tokens.test.ts
git commit -m "feat(theme): Pretendard font() 헬퍼 및 tabular numeric 토큰 추가"
```

---

### Task 2: 폰트 로드 + 전역 기본 폰트 (App.tsx)

**Files:**
- Create: `src/theme/applyGlobalFont.ts`
- Modify: `App.tsx`
- (폰트 에셋은 준비 완료: `assets/fonts/Pretendard-*.ttf`)

**Interfaces:**
- Consumes: `assets/fonts/Pretendard-*.ttf`.
- Produces: `applyGlobalFont(): void` — `Text`/`TextInput`의 defaultProps.style에 `fontFamily: 'Pretendard-Regular'`를 병합. 앱 부팅 시 1회 호출.

- [ ] **Step 1: Create `src/theme/applyGlobalFont.ts`**

```ts
import { Text, TextInput } from 'react-native';
import { fontFamily } from './tokens';

/**
 * Makes Pretendard-Regular the app-wide default so every screen (not just the
 * redesigned Home) drops the system font. Weight-precise call sites still use
 * `font()`; this only sets the baseline family. Idempotent.
 */
export function applyGlobalFont(): void {
  const base = { fontFamily: fontFamily.regular };
  for (const Comp of [Text, TextInput] as any[]) {
    Comp.defaultProps = Comp.defaultProps || {};
    Comp.defaultProps.style = [base, Comp.defaultProps.style];
  }
}
```

- [ ] **Step 2: Wire font loading + global default into `App.tsx`**

`App.tsx` 상단 import 추가:
```tsx
import { useFonts } from 'expo-font';
import { applyGlobalFont } from './src/theme/applyGlobalFont';
```

`export default function App()` 를 다음으로 교체:
```tsx
export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
  });

  if (!fontsLoaded) return null;
  applyGlobalFont();

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AppContent />
      </MenuProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Verify Metro bundles the TTF assets & typecheck**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음. (`require` of `.ttf`는 RN 기본 asset resolver로 처리됨 — metro.config.js 수정 불필요; `assetExts`에 `ttf`가 기본 포함.)

- [ ] **Step 4: Commit**

```bash
git add App.tsx src/theme/applyGlobalFont.ts
git commit -m "feat(theme): Pretendard 폰트 로드 및 전역 기본 폰트 적용"
```

---

### Task 3: HomeScreen 타이포그래피 재적용 + 숫자/달력 위계 리디자인

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `font`, `numeric` from `src/theme/tokens` (Task 1).

리디자인의 실질 화면. 레이아웃 구조(JSX 트리)는 유지하고, ① 모든 텍스트 스타일에 `font()` 적용 ② 금액 숫자 특별 처리 ③ 달력 금액 후퇴만 수행한다.

- [ ] **Step 1: import에 `font`, `numeric` 추가**

`src/theme/tokens` import 라인을 수정:
```tsx
import { spacing, radius, fontSize, fontWeight, font, numeric } from '../theme/tokens';
```

- [ ] **Step 2: StyleSheet의 각 텍스트 스타일에 `font()` 주입**

아래 매핑대로 각 스타일 항목의 `fontWeight: fontWeight.X`(또는 `'bold'` 등)를 `...font('X')`로 교체한다. `fontWeight` 라인을 제거하고 스프레드로 대체:

| 스타일 | 교체 후 |
|---|---|
| `brandName` | `{ fontSize: fontSize.xl, ...font('bold') }` |
| `earningsLabel` | `{ fontSize: fontSize.md, ...font('medium') }` |
| `earningsMeta` | `{ fontSize: fontSize.md, ...font('medium') }` |
| `trendText` | `{ fontSize: fontSize.sm, ...font('semibold') }` |
| `monthTitle` | `{ fontSize: fontSize.xl, ...font('bold') }` |
| `weekHeaderCell` | `{ flex: 1, textAlign: 'center', fontSize: fontSize.sm, ...font('medium') }` |
| `dayNum` | `{ fontSize: fontSize.md, ...font('medium') }` |
| `legendLabel` | `{ fontSize: fontSize.sm, ...font('medium') }` |
| `detailDate` | `{ fontSize: fontSize.base, ...font('bold') }` |
| `detailWage` | `{ fontSize: fontSize.base, ...font('medium') }` |
| `detailWageAmount` | `{ ...font('bold'), ...numeric }` |
| `scheduleTitle` | `{ fontSize: fontSize.base, ...font('bold') }` |
| `scheduleTime` | `{ fontSize: fontSize.sm, ...font('regular') }` |
| `scheduleWage` | `{ fontSize: fontSize.base, ...font('semibold'), ...numeric }` |
| `emptyText` | `{ flex: 1, textAlign: 'center', fontSize: fontSize.md, ...font('regular') }` (기존 `fontStyle: 'italic'` 제거 — 이탤릭 시스템 폴백이 촌스러움의 원인) |

`detailWageAmount`는 기존 `fontWeight: fontWeight.medium`이 아니라 위 표대로 bold+numeric로 둔다.

- [ ] **Step 3: 예상 급여 금액 — tabular + 자간 + ₩ 위계 분리**

`earningsAmount` 스타일을 교체:
```tsx
earningsAmount: {
  fontSize: fontSize.display,
  ...font('bold'),
  ...numeric,
  letterSpacing: -1,
},
```
그리고 `earningsSymbol` 스타일 신설(₩ 기호를 숫자보다 작고 연하게):
```tsx
earningsSymbol: {
  fontSize: fontSize.xxl,
  ...font('semibold'),
},
```
JSX의 금액 렌더( `styles.earningsAmount` 를 쓰는 `<Text>` )를 기호 분리 형태로 교체:
```tsx
<Text style={[styles.earningsAmount, { color: colors.brand }]}>
  {amountVisible ? (
    <>
      <Text style={[styles.earningsSymbol, { color: colors.brand }]}>₩</Text>
      {formatNumberWithComma(String(earnings))}
    </>
  ) : (
    '₩ •••••••'
  )}
</Text>
```

- [ ] **Step 4: 달력 금액(`dayAmount`) 회색 후퇴**

JSX에서 `styles.dayAmount`를 쓰는 `<Text>`의 색상을 `colors.brand` → `colors.textMuted`로 변경:
```tsx
<Text style={[styles.dayAmount, { color: colors.textMuted }]}>
  {amount}
</Text>
```
그리고 `dayAmount` 스타일에 tabular + medium 적용, 굵기 낮춤:
```tsx
dayAmount: { fontSize: 10, ...font('medium'), ...numeric, marginTop: 1 },
```

- [ ] **Step 5: 타입체크 + 앱 실행 확인**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음.

그다음 앱을 실행해 홈 화면을 육안 확인(라이트/다크):
1. 한글이 Pretendard로 렌더 (자간·굵기가 부드러움)
2. `₩` 기호가 숫자보다 작고, 금액 자릿수 정렬 안정(tabular)
3. 달력의 `xxk`가 옅은 회색으로 후퇴, 점이 주 마커로 보임

- [ ] **Step 6: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(ui): 홈 화면 Pretendard 적용 및 금액·달력 위계 재정비"
```

---

### Task 4: 레거시 컴포넌트 및 테스트 정리

**Files:**
- Delete: `src/components/EarningsCard.tsx`, `src/components/ScheduleCard.tsx`, `src/components/HeaderSection.tsx`
- Delete: `__tests__/components/EarningsCard.test.tsx`, `__tests__/components/ScheduleCard.test.tsx`

미사용 확인 완료(참조처 0개). 이들은 구형 인라인 폰트·스타일을 담고 있어 리디자인 일관성을 해친다.

- [ ] **Step 1: 참조 없음 재확인**

Run: `grep -rn "EarningsCard\|ScheduleCard\|HeaderSection" src App.tsx index.ts`
Expected: 정의 파일 외 참조 0건 (출력에 `src/components/*.tsx` 정의 라인만 나오면 안전). HeaderSection에는 테스트가 없으므로 컴포넌트만 삭제.

- [ ] **Step 2: 파일 삭제**

```bash
git rm src/components/EarningsCard.tsx src/components/ScheduleCard.tsx src/components/HeaderSection.tsx \
       __tests__/components/EarningsCard.test.tsx __tests__/components/ScheduleCard.test.tsx
```

- [ ] **Step 3: 전체 테스트 + 타입체크로 회귀 없음 확인**

Run: `npx jest && npx tsc --noEmit`
Expected: 모든 테스트 PASS, 타입 에러 없음(삭제된 컴포넌트를 참조하는 곳이 없으므로 깨지지 않음).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: 미사용 레거시 컴포넌트 및 테스트 정리"
```

---

## 검증 (전체)

- `npx jest` — 전체 그린.
- `npx tsc --noEmit` — 타입 클린.
- 앱 실행 후 홈 화면 라이트/다크 육안 확인 (Task 3 Step 5의 3개 체크포인트).

## 스펙 커버리지 자기점검

- 스펙 §1 폰트 로딩 → Task 2. §2 토큰(`font()`/`numeric`) → Task 1. §3 HomeScreen 적용(금액 tabular·₩ 위계·달력 후퇴) → Task 3. §4 레거시 정리 → Task 4. 트레이드오프(APK 크기)는 에셋 준비로 이미 반영. 누락 없음.
