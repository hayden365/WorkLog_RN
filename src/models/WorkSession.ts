export type RepeatOption =
  | "none"
  | "weekly"
  | "biweekly"
  | "triweekly"
  | "monthly";
export type MonthlyRepeatOption = "byDayOfMonth" | "byDayOfWeek";

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface WorkSession {
  jobName: string;
  wage: number;
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>; // 0 = 월 ~ 6 = 일
  monthlyRepeatOption: MonthlyRepeatOption;
  startDate: string; // YYYY-MM-DD 형식
  endDate?: string | null;
  isCurrentlyWorking: boolean;
  note: string;
}
