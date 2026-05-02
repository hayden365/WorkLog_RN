# 다크 모드 (Dark Mode) 설계

- 작성일: 2026-05-02
- 상태: 설계 확정
- 배경: Play Store 클로즈드 테스트 기간 중 기능 추가 업데이트로 심사 통과 확률 제고

## 목표

WorkLog 앱에 다크 모드를 추가한다. 사용자는 라이트/다크/시스템 따라가기 중에서 선택할 수 있고, 선택은 영구 저장되어 앱 재시작 후에도 유지된다. 시스템 따라가기 모드에서는 OS 설정 변경 시 자동 반영된다.

## 비목표

- 광고(AdMob) 영역 색상 변경 — SDK 위임
- 일정 칩(주황/보라/연두 등 9색) 의 다크 모드 변형 — 다크에서도 시인성 충분, v1 유지
- `StorageTestComponent.tsx` (개발용) 의 다크 대응
- 다국어/언어 설정 — 별도 작업
- 네이티브 스플래시 화면 다크 변형 — 별도 작업

## 결정사항 요약

| 항목 | 결정 |
|---|---|
| 토글 방식 | 라이트 / 다크 / 시스템 (3옵션) |
| 진입 경로 | HomeScreen 헤더의 ⚙️ 아이콘 → 슬라이드업 모달 |
| 컬러 적용 방식 | 중앙 토큰 + 점진 마이그레이션 (사용자 노출 화면 우선) |
| 상태 저장 | zustand + MMKV (기존 `shiftStore` 패턴) |
| 시스템 감지 | RN `useColorScheme()` |

## 아키텍처

```
src/
├── theme/
│   └── colors.ts          ← lightColors / darkColors 토큰
├── store/
│   └── themeStore.ts      ← mode: 'system' | 'light' | 'dark' (zustand+MMKV persist)
├── hooks/
│   └── useTheme.ts        ← mode + 시스템값 → { scheme, colors } 반환
└── components/
    └── SettingsModal.tsx  ← 신규: 테마 선택 (향후 설정 확장 지점)
```

### 데이터 흐름

1. 사용자가 SettingsModal에서 mode 선택
2. `themeStore.setMode(mode)` 호출 → 상태 업데이트 + MMKV 영구 저장
3. `useTheme()` 훅은 store의 `mode` 와 RN의 `useColorScheme()` 을 조합:
   - `mode === 'system'` → 시스템 값(`'light' | 'dark'`)
   - 그 외 → `mode` 그대로
4. 컴포넌트는 `const { colors } = useTheme()` 로 토큰 참조 → mode 변경 시 즉시 리렌더
5. `App.tsx` 의 `expo-status-bar` 도 resolved scheme 따라 자동 전환

### `useTheme` 인터페이스

```ts
type Scheme = 'light' | 'dark';
type ThemeColors = typeof lightColors;

function useTheme(): {
  scheme: Scheme;        // 'system' 해석된 결과
  colors: ThemeColors;   // 해당 scheme의 토큰
};
```

### `themeStore` 인터페이스

```ts
type Mode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: Mode;            // 기본값: 'system'
  setMode: (mode: Mode) => void;
}
```

MMKV persist 미들웨어로 `mode` 키 영구 저장.

## 컬러 토큰

`src/theme/colors.ts` 에 동일 shape의 `lightColors`, `darkColors` 객체를 정의한다.

| 토큰 | Light | Dark | 사용처 |
|---|---|---|---|
| `background` | `#ffffff` | `#000000` | 페이지 배경 (SafeAreaView) |
| `surface` | `#f8f8f8` | `#1c1c1e` | 카드, 일정 카드 배경 |
| `surfaceElevated` | `#ffffff` | `#2c2c2e` | 모달 컨텐츠, Picker 배경 |
| `border` | `#dddddd` | `#3a3a3c` | 입력 테두리, 구분선 |
| `divider` | `#eeeeee` | `#2c2c2e` | 약한 구분선 |
| `textPrimary` | `#1c1c1e` | `#ffffff` | 본문, 헤더 |
| `textSecondary` | `#666666` | `#aeaeb2` | 보조 텍스트 |
| `textMuted` | `#8e8e93` | `#8e8e93` | 비활성 안내 |
| `accent` | `#007aff` | `#0a84ff` | 버튼, FAB, 강조 (iOS 다크 표준) |
| `accentText` | `#ffffff` | `#ffffff` | accent 위 텍스트 |
| `danger` | `#ff3b30` | `#ff453a` | 삭제 버튼 |
| `calendarSelected` | `#007aff` | `#0a84ff` | 캘린더 선택일 |
| `calendarToday` | `#007aff` | `#0a84ff` | 오늘 날짜 표시 |
| `calendarDisabled` | `#d9e1e8` | `#48484a` | 이전/다음 달 표시 |

다크 값은 iOS 시스템 컬러 가이드를 기준으로 매핑하여 양 플랫폼에서 자연스럽게 보이도록 한다.

### 토큰화 제외

- 일정 칩 9색 (`#ffbe89`, `#be69fa`, `#a6e159`, `#C5CAE9`, `#B39DDB`, `#A052CC`, `#90CAF9`, `#8E99F3`, `#7fb2ad`) — 칩은 사용자가 일정을 색으로 구분하기 위한 식별자이며 다크에서도 시인성이 양호함
- 광고 영역 — AdMob SDK 자체 처리

## 설정 모달 UI

### 진입 경로

HomeScreen 상단에 SafeAreaView `top` edge 를 추가하고, 작은 헤더 행을 신설한다.
- 우측: ⚙️ 이모지 아이콘 (TouchableOpacity, `accent` 컬러)
- 좌측: 비워둠 (향후 앱 타이틀용 보존)
- 탭 → `SettingsModal` 슬라이드업 (기존 `react-native-modal` 사용 일관성 유지)

아이콘은 추가 라이브러리 없이 이모지로 처리. 추후 `react-native-vector-icons` 도입 시 교체.

### SettingsModal 레이아웃

```
┌─────────────────────────────┐
│  설정                    ✕  │
├─────────────────────────────┤
│                             │
│  테마                       │
│  ┌─────┬─────┬───────┐     │
│  │라이트│ 다크│ 시스템 │     │← SegmentedControl
│  └─────┴─────┴───────┘     │
│                             │
└─────────────────────────────┘
```

- `@react-native-segmented-control/segmented-control` 재사용 (이미 의존성 보유)
- 선택 즉시 `setMode()` 호출 → 별도 저장 버튼 없음 (즉시 적용 = 사용자 기대치)
- 모달 자체도 `surfaceElevated`, `textPrimary` 토큰 사용해 다크 대응
- 향후 "언어", "알림" 등을 추가 섹션으로 확장 가능한 구조

## 마이그레이션 범위 (Phase 1)

사용자에게 노출되는 화면을 우선 마이그레이션한다. 각 파일의 하드코딩된 hex 컬러를 `useTheme()` 의 `colors.*` 토큰 참조로 교체한다.

| 파일 | 작업 |
|---|---|
| `App.tsx` | `expo-status-bar` style 을 resolved scheme 분기 |
| `screens/HomeScreen.tsx` | SafeAreaView 배경, 카드, 텍스트, FAB → 토큰. 헤더 행 신규 추가 |
| `components/EarningsCard.tsx` | 카드 배경/텍스트 → 토큰 |
| `components/ScheduleCard.tsx` | 배경/텍스트/border → 토큰 (일정 칩 색은 유지) |
| `components/NewSessionModal.tsx` | 모달 배경, 입력 필드, 버튼 → 토큰 |
| `components/ScheduleModal.tsx` | 위와 동일 |
| `components/CalendarPage.tsx` | `react-native-calendars` 의 `theme` prop 으로 토큰 주입 |
| `components/CalendarDisplayItem.tsx` | 텍스트 색 → 토큰 |
| `components/DatePicker.tsx` | 모달 내부 배경/텍스트 → 토큰 |
| `components/TimePicker.tsx` | 모달 내부 배경/텍스트 → 토큰 |
| `components/Dropdown.tsx` | 드롭다운 배경/텍스트 → 토큰 |
| `components/SettingsModal.tsx` | 신규 작성 (다크 대응 포함) |

### Phase 1 보류

- `components/StorageTestComponent.tsx` — 개발용, 프로덕션 노출 여부 불확실
- `components/AdBanner.tsx` — AdMob 광고 영역 (SDK 위임)
- `components/HeaderSection.tsx` — 현재 어떤 화면에서도 사용되지 않음 (`grep` 확인 결과 자기 자신만 매치). 미사용이므로 v1 보류
- `components/FadeInView.tsx`, `components/SlideInView.tsx` — 스타일을 보유하지 않은 애니메이션 래퍼

## 테스트 전략

### 단위 테스트 (Jest)

1. **`themeStore`**
   - 초기 mode 가 `'system'` 인지
   - `setMode('dark')` 호출 후 state 가 `'dark'` 인지
   - MMKV persist: 새 store 인스턴스에서도 저장된 mode 가 복원되는지
2. **`useTheme`**
   - `mode === 'light'` → `colors === lightColors`, `scheme === 'light'`
   - `mode === 'dark'` → `colors === darkColors`, `scheme === 'dark'`
   - `mode === 'system'` 시 RN `useColorScheme()` 결과(`'light' | 'dark'`)에 따라 올바른 토큰 반환

### 수동 검증 체크리스트

- 라이트 → 다크 → 시스템 전환 시 모든 화면이 즉시 리렌더되며 토큰 적용
- 시스템 모드에서 OS 설정 변경 시 앱 자동 반영 (포어그라운드 상태에서 OS 다크 토글)
- 캘린더의 오늘/선택일/주말/이전·다음 달 표시가 다크에서 시인성 충분한지
- NewSessionModal, ScheduleModal, SettingsModal 모두 다크에서 컨트라스트 OK
- 상태바 텍스트 색상이 scheme에 맞게 자동 전환 (다크 → light, 라이트 → dark)
- 앱 종료 후 재시작 시 선택했던 mode 유지
- iOS / Android 시뮬레이터 양쪽에서 동일하게 동작

## 마이그레이션 패턴 (참조)

기존:
```tsx
const styles = StyleSheet.create({
  card: { backgroundColor: '#f8f8f8' },
  text: { color: '#333' },
});
```

변경 후:
```tsx
const { colors } = useTheme();
// StyleSheet.create는 정적이므로, 색상은 인라인 또는 useMemo 내부에서 처리
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  <Text style={[styles.text, { color: colors.textPrimary }]}>...</Text>
</View>
```

레이아웃/사이즈 관련 스타일은 `StyleSheet.create` 에 유지하고, 컬러 관련 속성만 인라인으로 분리한다.

## 위험 요소 및 대응

- **react-native-calendars 의 다크 대응 한계**: 일부 내부 스타일은 `theme` prop 으로 제어 불가. 시각 검증 필요. 필요 시 라이브러리 이슈/대안 검토는 v2.
- **MMKV 미설치 환경(Jest)**: 테스트에서는 mock 또는 `jest.mock('react-native-mmkv')` 처리. 기존 `shiftStore` 테스트 패턴 답습.
- **`useColorScheme()` 의 null 반환 가능성**: 일부 환경에서 초기 null 반환 → fallback 으로 `'light'` 사용.

## 작업 분량 추정

신규 파일 4개(`colors.ts`, `themeStore.ts`, `useTheme.ts`, `SettingsModal.tsx`) + 마이그레이션 9개 컴포넌트 + `HomeScreen` 헤더 행 추가 + `App.tsx` 상태바 분기. 단일 PR로 처리.
