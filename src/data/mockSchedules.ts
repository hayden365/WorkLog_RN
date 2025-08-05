import { WorkSession } from "../models/WorkSession";
import { getSessionColor } from "../utils/colorManager";

// UUID 생성을 위한 간단한 함수
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// 현재 날짜 기준으로 날짜 생성
const getCurrentDate = () => new Date();
const getDateFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// 시간 생성 헬퍼 함수
const createTime = (hours: number, minutes: number) => {
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
};

// 초기 스케줄 목데이터
export const mockSchedules: WorkSession[] = [
  // 매일 반복 스케줄
  {
    id: generateId(),
    jobName: "카페 알바",
    wage: 12000,
    wageType: "hourly",
    calculatedDailyWage: 72000,
    startTime: createTime(9, 0),
    endTime: createTime(17, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(30), // 30일 후까지
    repeatOption: "daily",
    selectedWeekDays: new Set(),
    isCurrentlyWorking: false,
    description: "카페에서 커피 제조 및 고객 응대",
    color: getSessionColor("cafe"),
  },

  // 주간 반복 스케줄 (월, 수, 금)
  {
    id: generateId(),
    jobName: "튜터링",
    wage: 25000,
    wageType: "hourly",
    calculatedDailyWage: 150000,
    startTime: createTime(19, 0),
    endTime: createTime(21, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(60), // 60일 후까지
    repeatOption: "weekly",
    selectedWeekDays: new Set([1, 3, 5]), // 월, 수, 금
    isCurrentlyWorking: false,
    description: "고등학생 수학 과외",
    color: getSessionColor("tutoring"),
  },

  // 격주 반복 스케줄 (화, 목)
  {
    id: generateId(),
    jobName: "배달 알바",
    wage: 15000,
    wageType: "hourly",
    calculatedDailyWage: 180000,
    startTime: createTime(18, 0),
    endTime: createTime(22, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(45), // 45일 후까지
    repeatOption: "biweekly",
    selectedWeekDays: new Set([2, 4]), // 화, 목
    isCurrentlyWorking: false,
    description: "음식 배달 서비스",
    color: getSessionColor("delivery"),
  },

  // 월간 반복 스케줄 (매월 1일, 15일)
  {
    id: generateId(),
    jobName: "청소 알바",
    wage: 20000,
    wageType: "hourly",
    calculatedDailyWage: 100000,
    startTime: createTime(10, 0),
    endTime: createTime(16, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(90), // 90일 후까지
    repeatOption: "monthly",
    selectedWeekDays: new Set([1, 15]), // 1일, 15일
    isCurrentlyWorking: false,
    description: "사무실 청소 및 정리",
    color: getSessionColor("cleaning"),
  },

  // 3주마다 반복 스케줄 (토, 일)
  {
    id: generateId(),
    jobName: "이벤트 스태프",
    wage: 18000,
    wageType: "hourly",
    calculatedDailyWage: 108000,
    startTime: createTime(12, 0),
    endTime: createTime(20, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(75), // 75일 후까지
    repeatOption: "triweekly",
    selectedWeekDays: new Set([6, 0]), // 토, 일
    isCurrentlyWorking: false,
    description: "전시회 및 이벤트 현장 스태프",
    color: getSessionColor("event"),
  },

  // 단일 스케줄 (내일)
  {
    id: generateId(),
    jobName: "면접",
    wage: 0,
    wageType: "hourly",
    calculatedDailyWage: 0,
    startTime: createTime(14, 0),
    endTime: createTime(15, 30),
    startDate: getDateFromNow(1), // 내일
    endDate: getDateFromNow(1),
    repeatOption: "daily",
    selectedWeekDays: new Set(),
    isCurrentlyWorking: false,
    description: "IT 회사 개발자 면접",
    color: getSessionColor("interview"),
  },

  // 주말 반복 스케줄
  {
    id: generateId(),
    jobName: "주말 아르바이트",
    wage: 13000,
    wageType: "hourly",
    calculatedDailyWage: 117000,
    startTime: createTime(9, 30),
    endTime: createTime(18, 30),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(50), // 50일 후까지
    repeatOption: "weekly",
    selectedWeekDays: new Set([6, 0]), // 토, 일
    isCurrentlyWorking: false,
    description: "주말 전용 매장 판매원",
    color: getSessionColor("weekend"),
  },

  // 평일 반복 스케줄
  {
    id: generateId(),
    jobName: "사무 보조",
    wage: 16000,
    wageType: "hourly",
    calculatedDailyWage: 144000,
    startTime: createTime(9, 0),
    endTime: createTime(18, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(40), // 40일 후까지
    repeatOption: "weekly",
    selectedWeekDays: new Set([1, 2, 3, 4, 5]), // 월~금
    isCurrentlyWorking: false,
    description: "사무실 문서 정리 및 데이터 입력",
    color: getSessionColor("office"),
  },

  // 특별한 이벤트 (다음 주)
  {
    id: generateId(),
    jobName: "컨퍼런스 스태프",
    wage: 25000,
    wageType: "hourly",
    calculatedDailyWage: 200000,
    startTime: createTime(8, 0),
    endTime: createTime(18, 0),
    startDate: getDateFromNow(7), // 다음 주
    endDate: getDateFromNow(7),
    repeatOption: "daily",
    selectedWeekDays: new Set(),
    isCurrentlyWorking: false,
    description: "IT 컨퍼런스 현장 스태프",
    color: getSessionColor("conference"),
  },

  // 야간 알바
  {
    id: generateId(),
    jobName: "야간 편의점",
    wage: 14000,
    wageType: "hourly",
    calculatedDailyWage: 168000,
    startTime: createTime(22, 0),
    endTime: createTime(6, 0),
    startDate: getCurrentDate(),
    endDate: getDateFromNow(35), // 35일 후까지
    repeatOption: "weekly",
    selectedWeekDays: new Set([2, 4, 6]), // 화, 목, 토
    isCurrentlyWorking: false,
    description: "편의점 야간 근무",
    color: getSessionColor("night"),
  },
];

// 특정 날짜에 스케줄이 있는지 확인하는 헬퍼 함수
export const hasScheduleOnDate = (
  schedules: WorkSession[],
  date: Date
): boolean => {
  const dateString = date.toISOString().slice(0, 10);

  return schedules.some((schedule) => {
    const startDate = schedule.startDate.toISOString().slice(0, 10);
    const endDate = schedule.endDate?.toISOString().slice(0, 10);

    // 단일 스케줄
    if (schedule.repeatOption === "daily") {
      return dateString >= startDate && (!endDate || dateString <= endDate);
    }

    // 주간 반복
    if (schedule.repeatOption === "weekly") {
      const dayOfWeek = date.getDay();
      return (
        schedule.selectedWeekDays.has(dayOfWeek) &&
        dateString >= startDate &&
        (!endDate || dateString <= endDate)
      );
    }

    // 격주 반복 (간단한 구현)
    if (schedule.repeatOption === "biweekly") {
      const dayOfWeek = date.getDay();
      return (
        schedule.selectedWeekDays.has(dayOfWeek) &&
        dateString >= startDate &&
        (!endDate || dateString <= endDate)
      );
    }

    // 3주마다 반복 (간단한 구현)
    if (schedule.repeatOption === "triweekly") {
      const dayOfWeek = date.getDay();
      return (
        schedule.selectedWeekDays.has(dayOfWeek) &&
        dateString >= startDate &&
        (!endDate || dateString <= endDate)
      );
    }

    // 월간 반복
    if (schedule.repeatOption === "monthly") {
      const dayOfMonth = date.getDate();
      return (
        schedule.selectedWeekDays.has(dayOfMonth) &&
        dateString >= startDate &&
        (!endDate || dateString <= endDate)
      );
    }

    return false;
  });
};

// 목데이터 초기화 함수
export const initializeMockData = () => {
  console.log("목데이터 초기화:", mockSchedules.length, "개의 스케줄 생성");
  return mockSchedules;
};
