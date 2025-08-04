import { WorkSession } from "../models/WorkSession";
import { useScheduleStore } from "../store/shiftStore";

// 개발용 로그 함수
export const devLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[DEV] ${message}`, data || "");
  }
};

// 스케줄 데이터 검증 함수
export const validateSchedule = (schedule: WorkSession): string[] => {
  const errors: string[] = [];

  if (!schedule.jobName || schedule.jobName.trim() === "") {
    errors.push("직업명이 필요합니다");
  }

  if (schedule.wage < 0) {
    errors.push("시급은 0 이상이어야 합니다");
  }

  if (schedule.startTime >= schedule.endTime) {
    errors.push("시작 시간은 종료 시간보다 빨라야 합니다");
  }

  if (schedule.startDate > schedule.endDate!) {
    errors.push("시작 날짜는 종료 날짜보다 빨라야 합니다");
  }

  if (
    schedule.repeatOption === "weekly" &&
    schedule.selectedWeekDays.size === 0
  ) {
    errors.push("주간 반복의 경우 요일을 선택해야 합니다");
  }

  if (
    schedule.repeatOption === "monthly" &&
    schedule.selectedWeekDays.size === 0
  ) {
    errors.push("월간 반복의 경우 날짜를 선택해야 합니다");
  }

  return errors;
};

// 스케줄 통계 정보 생성
export const generateScheduleStats = (schedules: WorkSession[]) => {
  const stats = {
    totalSchedules: schedules.length,
    totalEarnings: 0,
    totalWorkHours: 0,
    byRepeatOption: {
      daily: 0,
      weekly: 0,
      biweekly: 0,
      triweekly: 0,
      monthly: 0,
    },
    byWageRange: {
      low: 0, // 0-10000
      medium: 0, // 10001-20000
      high: 0, // 20001+
    },
  };

  schedules.forEach((schedule) => {
    // 수익 계산
    const startMinutes =
      schedule.startTime.getHours() * 60 + schedule.startTime.getMinutes();
    const endMinutes =
      schedule.endTime.getHours() * 60 + schedule.endTime.getMinutes();
    const workHours = (endMinutes - startMinutes) / 60;
    const earnings = workHours * schedule.wage;

    stats.totalEarnings += earnings;
    stats.totalWorkHours += workHours;

    // 반복 옵션별 카운트
    stats.byRepeatOption[schedule.repeatOption]++;

    // 시급 범위별 카운트
    if (schedule.wage <= 10000) {
      stats.byWageRange.low++;
    } else if (schedule.wage <= 20000) {
      stats.byWageRange.medium++;
    } else {
      stats.byWageRange.high++;
    }
  });

  return {
    ...stats,
    totalEarnings: Math.round(stats.totalEarnings),
    totalWorkHours: Math.round(stats.totalWorkHours * 10) / 10,
  };
};

// 개발용 스케줄 데이터 초기화 함수
export const resetScheduleData = () => {
  const { schedulesById } = useScheduleStore.getState();

  if (Object.keys(schedulesById).length > 0) {
    devLog("기존 스케줄 데이터 초기화");
    // 실제로는 스토어의 reset 함수를 호출해야 하지만,
    // 여기서는 로그만 출력
  }
};

// 샘플 스케줄 생성 함수
export const createSampleSchedule = (
  type: "simple" | "complex" | "recurring"
): WorkSession => {
  const baseId = Math.random().toString(36).substr(2, 9);
  const now = new Date();

  switch (type) {
    case "simple":
      return {
        id: baseId,
        jobName: "샘플 알바",
        wage: 12000,
        startTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          9,
          0
        ),
        endTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          17,
          0
        ),
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        repeatOption: "daily",
        selectedWeekDays: new Set(),
        isCurrentlyWorking: false,
        description: "샘플 일자리",
        color: "#FF6B6B",
      };

    case "complex":
      return {
        id: baseId,
        jobName: "복잡한 스케줄",
        wage: 20000,
        startTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          19,
          0
        ),
        endTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          22,
          0
        ),
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        repeatOption: "weekly",
        selectedWeekDays: new Set([1, 3, 5]), // 월, 수, 금
        isCurrentlyWorking: false,
        description: "복잡한 반복 스케줄 샘플",
        color: "#4ECDC4",
      };

    case "recurring":
      return {
        id: baseId,
        jobName: "월간 반복",
        wage: 15000,
        startTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          10,
          0
        ),
        endTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          18,
          0
        ),
        startDate: now,
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90일 후
        repeatOption: "monthly",
        selectedWeekDays: new Set([1, 15]), // 1일, 15일
        isCurrentlyWorking: false,
        description: "월간 반복 스케줄 샘플",
        color: "#45B7D1",
      };

    default:
      return createSampleSchedule("simple");
  }
};

// 개발용 디버그 정보 출력
export const debugScheduleData = () => {
  const { schedulesById } = useScheduleStore.getState();
  const schedules = Object.values(schedulesById);

  devLog("=== 스케줄 데이터 디버그 정보 ===");
  devLog(`총 스케줄 수: ${schedules.length}`);

  if (schedules.length > 0) {
    const stats = generateScheduleStats(schedules);
    devLog("통계 정보:", stats);

    schedules.forEach((schedule, index) => {
      devLog(`스케줄 ${index + 1}:`, {
        id: schedule.id,
        jobName: schedule.jobName,
        repeatOption: schedule.repeatOption,
        startDate: schedule.startDate.toISOString().slice(0, 10),
        endDate: schedule.endDate?.toISOString().slice(0, 10),
        wage: schedule.wage,
        color: schedule.color,
      });
    });
  }

  devLog("=== 디버그 정보 끝 ===");
};
