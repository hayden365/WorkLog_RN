# WorkLog 플레이스토어 출시 준비 - 디자인 문서

## 개요

WorkLog 앱의 Google Play Store 최소 출시(MVP Release)를 위한 설계 문서.
알바생/시급 근로자를 타겟으로, 시급 자동 계산 기능을 핵심으로 한 근무 관리 앱.

## 앱 정보

| 항목 | 값 |
|------|-----|
| 앱 이름 | WorkLog - 시급 자동 계산 |
| 패키지명 | com.hayden365.worklog |
| 버전 | 1.0.0 |
| 타겟 사용자 | 알바생, 시급 근로자 (한국 우선) |
| 가격 | 무료 |
| 수익 모델 | Google AdMob 배너 광고 |

## 작업 항목

### 1. app.json 설정 변경
- `expo.name`: "WorkLog - 시급 자동 계산"
- `expo.android.package`: "com.hayden365.worklog"
- `expo.ios.bundleIdentifier`: "com.hayden365.worklog" (통일)

### 2. 디버그 코드 제거
- `StorageTestComponent` 관련 import/코드 제거
- `initializeMockData` 관련 import/코드 제거
- App.tsx 미사용 `styles.text` 제거

### 3. 광고 SDK (Google AdMob)
- `react-native-google-mobile-ads` 패키지 설치
- app.json에 AdMob 앱 ID 설정 추가
- HomeScreen 하단에 배너 광고 1개 배치
- 테스트 광고 ID로 개발, 출시 시 실제 ID로 교체

### 4. 앱 아이콘
- 미니멀 플랫 디자인, 달력+시계 모티프
- 1024x1024 icon.png (일반 아이콘)
- 1024x1024 adaptive-icon.png (Android adaptive icon)
- SVG 디자인 → PNG 변환

### 5. 입력값 기본 검증
- 급여 음수 입력 방지
- 급여 상한값 설정 (비현실적 값 방지)
- 직장명 빈 값 방지

### 6. 개인정보 처리방침
- GitHub Pages 단일 페이지 (docs/privacy-policy.html 또는 별도 저장소)
- 내용: 개인정보 미수집, 로컬 저장만, AdMob 사용 고지
- Play Console 등록 시 URL 제출

### 7. EAS 빌드 설정 확인
- eas.json production 프로파일 확인
- Android keystore 생성 (EAS 자동 관리)
- 프로덕션 빌드 테스트

## 작업 범위 밖 (추후 업데이트)
- 접근성 (a11y)
- 다국어 지원 (i18n)
- 온보딩 화면
- 전면/리워드 광고
- 데이터 백업/내보내기
- iOS App Store 출시

## 출시 전 수동 작업 (개발자 직접)
- Google Play Console 개발자 계정 가입 ($25)
- AdMob 계정 생성 + 앱 등록
- 스토어 등록 정보 작성 (설명, 스크린샷, 카테고리)
- 앱 심사 제출
