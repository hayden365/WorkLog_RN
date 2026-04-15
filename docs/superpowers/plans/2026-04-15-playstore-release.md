# WorkLog 플레이스토어 출시 준비 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WorkLog 앱을 Google Play Store에 출시할 수 있도록 설정 변경, 코드 정리, 광고 SDK 연동, 아이콘 제작, 입력 검증, 개인정보 처리방침을 완료한다.

**Architecture:** 기존 앱 구조를 유지하면서 설정 파일 수정, 디버그 코드 제거, AdMob 배너 광고 추가, 입력 검증 로직 추가를 진행한다. 아이콘은 SVG로 디자인 후 PNG 변환한다.

**Tech Stack:** React Native 0.80.2, Expo 53, EAS Build, react-native-google-mobile-ads, GitHub Pages

---

### Task 1: app.json 설정 변경

**Files:**
- Modify: `app.json`

- [ ] **Step 1: 패키지명과 앱 이름 변경**

`app.json`을 다음과 같이 수정:

```json
{
  "expo": {
    "name": "WorkLog - 시급 자동 계산",
    "slug": "WorkLogApp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hayden365.worklog",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.hayden365.worklog"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "63eca05e-3d48-437d-bf15-f8946eb39f19"
      }
    },
    "scheme": "worklogapp",
    "plugins": [
      "expo-dev-client",
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy",
          "iosAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
        }
      ]
    ]
  }
}
```

> **NOTE:** AdMob 앱 ID는 Task 3에서 AdMob 계정 생성 후 실제 값으로 교체한다. 개발 중에는 테스트 ID 사용.

- [ ] **Step 2: 커밋**

```bash
git add app.json
git commit -m "chore: 앱 이름/패키지명 변경 및 AdMob 플러그인 설정"
```

---

### Task 2: 디버그 코드 제거

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: HomeScreen에서 디버그 import 및 코드 제거**

`src/screens/HomeScreen.tsx`에서 다음을 제거:

1. import 2줄 제거:
```typescript
// 이 줄들을 삭제:
import { initializeMockData } from '../data/mockSchedules';
import { StorageTestComponent } from '../components/StorageTestComponent';
```

2. 주석 처리된 목데이터 로드 useEffect 블록 제거 (라인 62~72):
```typescript
// 이 전체 블록을 삭제:
  // 앱 초기화 시 목데이터 로드
  // useEffect(() => {
  //   if (!isInitialized && Object.keys(allSchedulesById).length === 0) {
  //     const mockData = initializeMockData();
  //     mockData.forEach((schedule) => {
  //       addSchedule(schedule);
  //     });
  //     setIsInitialized(true);
  //     console.log("목데이터 로드 완료");
  //   }
  // }, [isInitialized, allSchedulesById, addSchedule]);
```

3. 주석 처리된 StorageTestComponent 사용 제거 (라인 145~146):
```typescript
// 이 줄들을 삭제:
        {/* 스케줄 저장 테스트 컴포넌트 */}
        {/* <StorageTestComponent /> */}
```

4. 주석 처리된 HeaderSection 제거 (라인 118):
```typescript
// 이 줄을 삭제:
        {/* <HeaderSection /> */}
```

- [ ] **Step 2: App.tsx에서 미사용 styles 제거**

`App.tsx`에서 사용되지 않는 styles 객체 제거:

```typescript
// 이 전체를 삭제:
const styles = StyleSheet.create({
  text: {
    fontSize: 25,
    fontWeight: '500',
  },
});
```

그리고 `StyleSheet` import도 제거:

```typescript
// 변경 전:
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

// 변경 후:
import { SafeAreaProvider } from 'react-native-safe-area-context';
```

- [ ] **Step 3: 테스트 실행**

```bash
npm test
```

Expected: 기존 67개 테스트 모두 통과

- [ ] **Step 4: 커밋**

```bash
git add src/screens/HomeScreen.tsx App.tsx
git commit -m "chore: 디버그 코드 및 미사용 코드 제거"
```

---

### Task 3: AdMob 배너 광고 추가

**Files:**
- Modify: `package.json` (npm install로 자동)
- Create: `src/components/AdBanner.tsx`
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: react-native-google-mobile-ads 설치**

```bash
npx expo install react-native-google-mobile-ads
```

- [ ] **Step 2: AdBanner 컴포넌트 생성**

`src/components/AdBanner.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy'; // 실제 배너 광고 ID로 교체

export const AdBanner = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          networkExtras: {
            collapsible: 'bottom',
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
```

- [ ] **Step 3: HomeScreen에 AdBanner 배치**

`src/screens/HomeScreen.tsx`에서:

1. import 추가:
```typescript
import { AdBanner } from '../components/AdBanner';
```

2. ScrollView 닫히는 태그 바로 위에 AdBanner 배치:

```tsx
        {/* 기존 스케줄 리스트 View 닫히는 태그 뒤 */}
        <AdBanner />
      </ScrollView>
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/AdBanner.tsx src/screens/HomeScreen.tsx package.json
git commit -m "feat: AdMob 배너 광고 추가"
```

---

### Task 4: 앱 아이콘 제작

**Files:**
- Create: `assets/icon-source.svg`
- Replace: `assets/icon.png`
- Replace: `assets/adaptive-icon.png`

- [ ] **Step 1: SVG 아이콘 디자인 생성**

`assets/icon-source.svg` 생성 - 미니멀 플랫 디자인, 파란색(#007aff) 배경에 흰색 달력+시계 모티프:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <!-- 배경: 둥근 사각형 -->
  <rect width="1024" height="1024" rx="220" fill="#007aff"/>

  <!-- 달력 본체 -->
  <rect x="220" y="280" width="584" height="500" rx="40" fill="white"/>

  <!-- 달력 상단 바 -->
  <rect x="220" y="280" width="584" height="100" rx="40" fill="white"/>
  <rect x="220" y="340" width="584" height="40" fill="white"/>

  <!-- 달력 고리 왼쪽 -->
  <rect x="360" y="230" width="40" height="100" rx="20" fill="white"/>

  <!-- 달력 고리 오른쪽 -->
  <rect x="624" y="230" width="40" height="100" rx="20" fill="white"/>

  <!-- 달력 그리드 라인 가로 -->
  <line x1="280" y1="460" x2="744" y2="460" stroke="#007aff" stroke-width="6" opacity="0.3"/>
  <line x1="280" y1="540" x2="744" y2="540" stroke="#007aff" stroke-width="6" opacity="0.3"/>
  <line x1="280" y1="620" x2="744" y2="620" stroke="#007aff" stroke-width="6" opacity="0.3"/>

  <!-- 시계 (우하단) -->
  <circle cx="680" cy="660" r="120" fill="#007aff" stroke="white" stroke-width="12"/>
  <circle cx="680" cy="660" r="100" fill="white"/>

  <!-- 시계 바늘 -->
  <line x1="680" y1="660" x2="680" y2="590" stroke="#007aff" stroke-width="10" stroke-linecap="round"/>
  <line x1="680" y1="660" x2="730" y2="660" stroke="#007aff" stroke-width="8" stroke-linecap="round"/>

  <!-- 시계 중심점 -->
  <circle cx="680" cy="660" r="8" fill="#007aff"/>
</svg>
```

- [ ] **Step 2: SVG를 PNG로 변환**

sharp-cli를 사용하여 변환:

```bash
npx sharp-cli -i assets/icon-source.svg -o assets/icon.png resize 1024 1024
npx sharp-cli -i assets/icon-source.svg -o assets/adaptive-icon.png resize 1024 1024
```

만약 sharp-cli가 SVG를 지원하지 않으면, 대안으로 `@aspect-build/rules-nodejs`나 온라인 도구를 사용하거나 Expo의 기본 도구를 사용한다.

대안: Node.js 스크립트로 변환:

```bash
npx svg2png-cli --input assets/icon-source.svg --output assets/icon.png --width 1024 --height 1024
cp assets/icon.png assets/adaptive-icon.png
```

- [ ] **Step 3: 아이콘 확인 및 커밋**

아이콘이 정상적으로 생성되었는지 확인 후:

```bash
git add assets/icon.png assets/adaptive-icon.png assets/icon-source.svg
git commit -m "feat: 앱 아이콘 디자인 추가 (달력+시계 모티프)"
```

---

### Task 5: 입력값 기본 검증 추가

**Files:**
- Modify: `src/components/NewSessionModal.tsx`

- [ ] **Step 1: handleSave에 검증 로직 추가**

`src/components/NewSessionModal.tsx`의 `handleSave` 함수를 수정:

```typescript
  const handleSave = () => {
    if (!startDate || !endDate) return;

    // 입력값 검증
    const trimmedJobName = jobName.trim();
    if (!trimmedJobName) {
      Alert.alert('입력 오류', '근무지명을 입력해주세요.');
      return;
    }
    if (wage <= 0) {
      Alert.alert('입력 오류', '급여를 입력해주세요.');
      return;
    }
    if (wage > 100_000_000) {
      Alert.alert('입력 오류', '급여가 너무 큽니다. 다시 확인해주세요.');
      return;
    }

    const endDateValue = isCurrentlyWorking ? null : endDate;

    const newSession = {
      id: existingSession?.id,
      jobName: trimmedJobName,
      wage,
      wageType,
      startTime,
      endTime,
      startDate,
      endDate: endDateValue,
      repeatOption,
      selectedWeekDays,
      isCurrentlyWorking,
      description,
    };
    onSave(newSession as WorkSession);
    setWageValue("");
    setIsCurrentlyWorking(true);
    setDescription("");
    reset();
    onClose();
  };
```

`Alert` import 추가:

```typescript
// 변경 전:
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
} from "react-native";

// 변경 후:
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
  Alert,
} from "react-native";
```

- [ ] **Step 2: 테스트 실행**

```bash
npm test
```

Expected: 기존 테스트 모두 통과

- [ ] **Step 3: 커밋**

```bash
git add src/components/NewSessionModal.tsx
git commit -m "feat: 스케줄 저장 시 입력값 검증 추가"
```

---

### Task 6: 개인정보 처리방침 페이지 생성

**Files:**
- Create: `docs/privacy-policy.html`

- [ ] **Step 1: 개인정보 처리방침 HTML 생성**

`docs/privacy-policy.html`:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WorkLog 개인정보 처리방침</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #007aff; }
    h2 { color: #555; margin-top: 24px; }
    .date { color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <h1>WorkLog 개인정보 처리방침</h1>
  <p class="date">시행일: 2026년 4월 15일</p>

  <h2>1. 개인정보 수집</h2>
  <p>WorkLog(이하 "앱")은 사용자의 개인정보를 수집하지 않습니다. 앱에서 입력하는 모든 데이터(근무 스케줄, 급여 정보 등)는 사용자의 기기에만 저장되며, 외부 서버로 전송되지 않습니다.</p>

  <h2>2. 데이터 저장</h2>
  <p>모든 데이터는 사용자의 기기 로컬 저장소에 저장됩니다. 앱을 삭제하면 저장된 데이터도 함께 삭제됩니다.</p>

  <h2>3. 광고</h2>
  <p>이 앱은 Google AdMob을 사용하여 광고를 표시합니다. AdMob은 광고 제공을 위해 기기 식별자 및 사용 데이터를 수집할 수 있습니다. 자세한 내용은 <a href="https://policies.google.com/privacy">Google 개인정보 처리방침</a>을 참조하세요.</p>

  <h2>4. 제3자 서비스</h2>
  <p>앱은 다음 제3자 서비스를 사용합니다:</p>
  <ul>
    <li>Google AdMob (광고 표시)</li>
  </ul>

  <h2>5. 아동 개인정보</h2>
  <p>이 앱은 13세 미만의 아동을 대상으로 하지 않으며, 의도적으로 아동의 개인정보를 수집하지 않습니다.</p>

  <h2>6. 변경사항</h2>
  <p>본 개인정보 처리방침은 변경될 수 있으며, 변경 시 앱 내 또는 이 페이지를 통해 공지합니다.</p>

  <h2>7. 문의</h2>
  <p>개인정보 처리방침에 대한 문의사항이 있으시면 아래로 연락해주세요.</p>
  <p>이메일: khj@ambience.kr</p>
</body>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add docs/privacy-policy.html
git commit -m "docs: 개인정보 처리방침 페이지 생성"
```

- [ ] **Step 3: GitHub Pages 활성화 (수동)**

GitHub 저장소 Settings > Pages > Source를 `main` 브랜치의 `/docs` 폴더로 설정.
URL은 `https://hayden365.github.io/WorkLog_RN/privacy-policy.html` 형태가 된다.

---

### Task 7: EAS 빌드 설정 확인 및 프로덕션 빌드

**Files:**
- Modify: `eas.json` (필요 시)

- [ ] **Step 1: EAS 로그인 확인**

```bash
npx eas-cli whoami
```

로그인 안 되어 있으면:

```bash
npx eas-cli login
```

- [ ] **Step 2: Android 프로덕션 빌드 실행**

```bash
npx eas-cli build --platform android --profile production
```

Expected: EAS가 자동으로 Android keystore를 생성하고 AAB 파일을 빌드한다.

- [ ] **Step 3: 빌드 결과 확인**

빌드 완료 후 EAS 대시보드에서 AAB 파일 다운로드 가능 확인.

- [ ] **Step 4: 커밋 (설정 변경 시)**

```bash
git add eas.json
git commit -m "chore: EAS 프로덕션 빌드 설정 확인"
```

---

## 출시 전 수동 작업 체크리스트

빌드 완료 후 개발자가 직접 수행해야 할 작업:

- [ ] Google Play Console 개발자 계정 가입 ($25)
- [ ] AdMob 계정 생성 → 앱 등록 → 실제 앱 ID/배너 ID 발급
- [ ] `app.json`과 `AdBanner.tsx`의 AdMob ID를 실제 값으로 교체
- [ ] GitHub Pages에서 개인정보 처리방침 URL 확인
- [ ] Play Console에서 앱 등록:
  - 앱 이름: WorkLog - 시급 자동 계산
  - 간단한 설명: 알바 시급 자동 계산, 근무 스케줄 관리
  - 자세한 설명 작성
  - 카테고리: 비즈니스 또는 도구
  - 스크린샷 업로드 (핸드폰 4~8장)
  - 개인정보 처리방침 URL 입력
  - 콘텐츠 등급 질문지 작성
  - 타겟 국가: 대한민국
- [ ] AAB 파일 업로드 및 심사 제출
