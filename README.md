# WorkLogApp

React Native로 개발된 근무 일정 관리 앱입니다. 스케줄 생성, 수정, 삭제 및 수익 계산 기능을 제공하며, Zustand + MMKV를 사용한 영구 저장 기능을 포함합니다.

## 주요 기능

### 📅 스케줄 관리

- 일별, 주별, 월별 반복 스케줄 생성
- 시급/일급/월급 설정
- 근무 시간 및 날짜 설정
- 스케줄 수정 및 삭제

### 💰 수익 계산

- 월별 총 수익 자동 계산
- 시급 기반 일급 자동 계산
- 달력에서 일별 수익 확인

### 💾 영구 저장 (Zustand + MMKV)

- 앱 종료 후에도 데이터 유지
- Date 객체와 Set 객체 자동 직렬화/역직렬화
- 버전 관리 및 데이터 병합 기능
- 데이터 백업 및 복원 기능

## 기술 스택

- **React Native** - 크로스 플랫폼 모바일 앱 개발
- **TypeScript** - 타입 안전성
- **Zustand** - 상태 관리
- **MMKV** - 고성능 키-값 저장소
- **React Navigation** - 네비게이션
- **React Native Calendars** - 달력 UI
- **Expo** - 개발 환경

## 설치 및 실행

```bash
# 의존성 설치
npm install

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹에서 실행
npm run web
```

## 영구 저장 기능

### 구현 방식

- **Zustand persist middleware** + **MMKV** 조합 사용
- 고성능 네이티브 저장소로 빠른 데이터 접근
- 자동 직렬화/역직렬화로 복잡한 데이터 타입 지원

### 주요 특징

1. **자동 저장**: 상태 변경 시 즉시 저장
2. **타입 안전성**: Date, Set 객체 자동 변환
3. **버전 관리**: 스키마 변경 시 데이터 병합
4. **백업/복원**: JSON 형태로 데이터 내보내기/가져오기

### 사용 예시

```typescript
// 스케줄 추가 (자동 저장됨)
const { addSchedule } = useScheduleManager();
addSchedule(newSchedule);

// 데이터 백업
const { exportData } = useScheduleManager();
const backup = exportData();

// 데이터 복원
const { importData } = useScheduleManager();
importData(backup);
```

## 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
├── hooks/              # 커스텀 훅
├── models/             # 타입 정의
├── screens/            # 화면 컴포넌트
├── store/              # Zustand 스토어
├── utils/              # 유틸리티 함수
└── data/               # 목데이터
```

## 테스트

앱 하단의 "스케줄 저장 테스트" 섹션에서 다음 기능을 테스트할 수 있습니다:

1. **테스트 스케줄 추가**: 샘플 스케줄 생성
2. **저장 상태 확인**: 현재 저장된 데이터 확인
3. **데이터 백업**: JSON 형태로 데이터 내보내기
4. **앱 재시작 테스트**: 앱을 종료하고 다시 실행하여 데이터 유지 확인
