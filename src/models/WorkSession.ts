export type RepeatOption =
  | "daily"
  | "weekly"
  | "biweekly"
  | "triweekly"
  | "monthly";

// 데이터 저장 형식
export interface WorkSession {
  id: string;
  jobName: string;
  wage: number;
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>; // 0 = 월 ~ 6 = 일
  isCurrentlyWorking: boolean;
  description: string;
  color: string; // 스케줄 색상
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
