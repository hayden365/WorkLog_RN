export type RepeatOption =
  | "none"
  | "weekly"
  | "biweekly"
  | "triweekly"
  | "monthly";

// 데이터 저장 형식
export interface WorkSession {
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
}
