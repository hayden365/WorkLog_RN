// 개발 환경 설정
export const DEV_CONFIG = {
  // 목데이터 자동 로드 여부
  AUTO_LOAD_MOCK_DATA: true,

  // 개발 로그 출력 여부
  ENABLE_DEV_LOGS: true,

  // 스케줄 검증 활성화 여부
  ENABLE_SCHEDULE_VALIDATION: true,

  // 샘플 스케줄 개수
  MOCK_SCHEDULE_COUNT: 10,

  // 개발용 색상 팔레트
  DEV_COLORS: [
    "#FF6B6B", // 빨강
    "#4ECDC4", // 청록
    "#45B7D1", // 파랑
    "#96CEB4", // 연두
    "#FFEAA7", // 노랑
    "#DDA0DD", // 연보라
    "#98D8C8", // 민트
    "#F7DC6F", // 골드
    "#BB8FCE", // 라벤더
    "#85C1E9", // 하늘색
  ],

  // 개발용 시급 범위
  WAGE_RANGES: {
    LOW: { min: 0, max: 10000, label: "저임금" },
    MEDIUM: { min: 10001, max: 20000, label: "중임금" },
    HIGH: { min: 20001, max: 999999, label: "고임금" },
  },

  // 개발용 반복 옵션
  REPEAT_OPTIONS: [
    { value: "daily", label: "매일" },
    { value: "weekly", label: "매주" },
    { value: "biweekly", label: "격주" },
    { value: "triweekly", label: "3주마다" },
    { value: "monthly", label: "매월" },
  ],

  // 개발용 요일
  WEEKDAYS: [
    { value: 0, label: "일" },
    { value: 1, label: "월" },
    { value: 2, label: "화" },
    { value: 3, label: "수" },
    { value: 4, label: "목" },
    { value: 5, label: "금" },
    { value: 6, label: "토" },
  ],

  // 개발용 시간 범위
  TIME_RANGES: {
    MORNING: { start: 6, end: 12, label: "오전" },
    AFTERNOON: { start: 12, end: 18, label: "오후" },
    EVENING: { start: 18, end: 24, label: "저녁" },
    NIGHT: { start: 0, end: 6, label: "새벽" },
  },
};

// 개발 환경 확인
export const isDevelopment = () => {
  return __DEV__;
};

// 개발 모드 설정
export const setDevelopmentMode = (enabled: boolean) => {
  if (enabled) {
    console.log("[DEV] 개발 모드 활성화");
  } else {
    console.log("[DEV] 개발 모드 비활성화");
  }
};

// 개발용 설정 가져오기
export const getDevConfig = () => {
  return DEV_CONFIG;
};

// 특정 설정 값 가져오기
export const getDevConfigValue = (key: keyof typeof DEV_CONFIG) => {
  return DEV_CONFIG[key];
};
