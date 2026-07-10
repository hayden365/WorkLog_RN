# 홈 화면 리디자인 + Pretendard 타이포그래피 설계

날짜: 2026-07-10
대상: `src/screens/HomeScreen.tsx` (홈), `src/theme/tokens.ts`, 폰트 로딩 부트스트랩

## 문제 정의

현재 홈 화면이 "촌스럽게" 보이는 근본 원인은 세 가지다.

1. **커스텀 폰트 부재** — `expo-font`는 설치돼 있으나 로드되는 폰트 파일이 0개. 모든 텍스트가
   안드로이드 시스템 기본 폰트(구형 본고딕/Roboto 폴백)로 렌더링돼 한글 자간·굵기가 투박함.
2. **숫자 처리 부재** — 큰 금액(`₩1,053,150`)에 tabular(고정폭) 처리와 자간 조정이 없어
   자릿수가 흔들리고 "크기만 큰" 느낌.
3. **달력 시각 노이즈** — 모든 날짜 밑에 `점 + 70k`가 brand 파랑으로 반복돼 화면이 산만함.

레이아웃 골격(카드·섀도우·코발트 블루 `#3b82f6`)은 유지한다. 문제는 타이포그래피와 위계.

## 확정된 결정

- 범위: **폰트 교체 + 홈 화면 전체 리디자인**.
- 폰트: **Pretendard 정적 4 웨이트** — Regular 400 / Medium 500 / SemiBold 600 / Bold 700.
- 달력 금액(`xxk`): **brand 파랑 → 옅은 회색(textMuted)으로 후퇴**, 더 작게. 점(직업 색)이 주 마커.

## 설계

### 1. 폰트 로딩 (Pretendard)

- `assets/fonts/`에 Pretendard 정적 TTF 4종 번들:
  `Pretendard-Regular.ttf`, `Pretendard-Medium.ttf`, `Pretendard-SemiBold.ttf`, `Pretendard-Bold.ttf`.
  라이선스: SIL Open Font License 1.1 (상용 앱 번들 가능). LICENSE 사본 포함.
- 앱 진입점에서 `expo-font`의 `useFonts`로 로드하고, 로드 완료 전까지 스플래시/빈 화면 유지.
- **안드로이드 웨이트 이슈 대응**: RN Android는 `fontWeight`만으로 Pretendard의 특정 웨이트
  파일을 선택하지 못한다. 따라서 웨이트를 **명시적 `fontFamily` 이름**으로 매핑한다.

### 2. 타이포그래피 토큰 (`src/theme/tokens.ts`)

- `fontFamily` 맵 신설 — 웨이트 토큰 → Pretendard 패밀리명:
  ```
  fontFamily = {
    regular:  'Pretendard-Regular',
    medium:   'Pretendard-Medium',
    semibold: 'Pretendard-SemiBold',
    bold:     'Pretendard-Bold',
  }
  ```
- 헬퍼 `font(weight)` 제공 — `{ fontFamily, fontWeight }`를 함께 반환해 iOS/Android 양쪽에서
  올바른 웨이트가 나오도록 한다. (안드로이드는 fontFamily가, iOS는 fontWeight가 주 역할)
- 숫자 전용 스타일 헬퍼 `numeric` — `fontVariant: ['tabular-nums']` 포함.
- 기존 `fontSize`/`fontWeight`/`spacing`/`radius` 스케일은 유지. `font()` 헬퍼로 fontFamily만 주입.

### 3. HomeScreen 적용

모든 `Text`가 `font()` 헬퍼 기반 스타일을 쓰도록 정리한다. 레이아웃/구조 변경은 최소, 다음 위계 정비.

- **예상 급여 금액**: tabular, `letterSpacing: -1`, Bold. `₩` 기호는 숫자보다 작고 연하게
  (별도 `Text`로 분리해 크기·색 위계 부여).
- **달력 셀 금액(`dayAmount`)**: 색 `colors.brand` → `colors.textMuted`, 크기 유지(10) 또는 소폭 축소,
  weight `semibold` → `medium`. 점이 주 마커가 되도록 후퇴.
- **월 타이틀 / 날짜 헤더 / 일정 카드 제목**: Bold/SemiBold를 Pretendard 패밀리로 정확히 매핑.
- 그 외 라벨·메타 텍스트: Medium/Regular 패밀리로 정리.

### 4. 레거시 정리

미사용 컴포넌트 삭제:
`src/components/EarningsCard.tsx`, `src/components/ScheduleCard.tsx`, `src/components/HeaderSection.tsx`.
(사용처 없음 확인 후 삭제. `mockSchedules.ts` 등 다른 참조가 있으면 함께 확인.)

## 트레이드오프 / 리스크

- **APK 크기**: 정적 4종 번들로 대략 12~16MB 증가. Pretendard 한글 글리프 세트가 큼. 허용.
- **안드로이드 웨이트 매핑**: 가장 흔한 실수 지점. `font()` 헬퍼로 단일화해 회귀 방지.
- **폴백**: 폰트 로드 실패 시 시스템 폰트로 자연 폴백(fontFamily 미존재 시 RN 기본 동작). 크래시 없음.

## 검증

- 앱 실행 후 홈 화면에서: (1) 한글이 Pretendard로 렌더 (2) 금액 자릿수 정렬 안정 (3) 달력 금액이
  회색으로 후퇴했는지 육안 확인. 라이트/다크 양쪽 확인.
