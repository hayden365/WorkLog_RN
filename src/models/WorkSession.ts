import { WageType } from "./Workplace";
export type { WageType };

export type RepeatOption = "none" | "daily" | "weekly" | "biweekly" | "monthly";

// 데이터 저장 형식
export interface WorkSession {
  id: string;
  workplaceId: string; // 신규: 근무지 참조
  // 오버라이드 (null이면 근무지 기본값 상속)
  wageType: WageType | null;
  wage: number | null;
  breakMinutes: number | null; // 신규: null이면 근무지 defaultBreakMinutes
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>; // 0 = 월 ~ 6 = 일
  isCurrentlyWorking: boolean;
  description: string;
}

export type ScheduleByDate = {
  [date: string]: string[];
};

// 달력 UI용 표시 데이터
export interface CalendarDisplayItem {
  color: string;
  selected: boolean;
  sessionId: string;
  jobName: string;
}

export type CalendarDisplayMap = {
  [date: string]: CalendarDisplayItem[];
};

// 스케줄 원본 데이터 (by ID)
export type SchedulesById = {
  [id: string]: WorkSession;
};
