import {
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
  parseISO,
} from "date-fns";
import { ScheduleByDate, WorkSession } from "../models/WorkSession";

export function calculateScheduleByDate(
  dates: string[],
  sessionId: string,
  existingSchedule: ScheduleByDate
): ScheduleByDate {
  const scheduleByDate: ScheduleByDate = { ...existingSchedule };
  dates.forEach((date) => {
    if (scheduleByDate[date] && !scheduleByDate[date].includes(sessionId)) {
      scheduleByDate[date] = [...scheduleByDate[date], sessionId];
    } else {
      scheduleByDate[date] = [sessionId];
    }
  });
  return scheduleByDate;
}

// repeatOption is daily
export function getMarkedDatesFromDailySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}) {
  const markedDates = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  );

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const matchedDates = days
    .filter((day) => {
      return !isBefore(day, startDate) && (!endDate || isBefore(day, endDate));
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const dateChunks: string[][] =
    groupDatesByConsecutiveChunks(matchedDates) ?? [];

  const sessionColor = getSessionColor(schedule.id);

  dateChunks.forEach((chunk: string[]) => {
    chunk.forEach((dateStr: string, idx: number) => {
      (markedDates as Record<string, any>)[dateStr] = {
        periods: [
          {
            startingDay: idx === 0,
            endingDay: idx === chunk.length - 1,
            color: sessionColor,
          },
        ],
      };
    });
  });

  return markedDates;
}

function groupDatesByConsecutiveChunks(dates: string[]) {
  const sorted = [...dates].sort();
  const chunks = [];

  let currentChunk = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);

    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      currentChunk.push(sorted[i]);
    } else {
      chunks.push(currentChunk);
      currentChunk = [sorted[i]];
    }
  }
  chunks.push(currentChunk);
  return chunks;
}

// 타입 정의 추가
interface Period {
  startingDay: boolean;
  endingDay: boolean;
  color: string;
}

interface MarkedDate {
  periods: Period[];
}

// schedule's repeatOption is weekly
export function getMarkedDatesFromWeeklySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: number;
}): Record<string, MarkedDate> {
  const markedDates: Record<string, MarkedDate> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedWeekDays = [...schedule.selectedWeekDays];
  const monthStart = new Date(new Date().getFullYear(), viewMonth, 1);
  const monthEnd = new Date(new Date().getFullYear(), viewMonth + 1, 0);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const matchedDates = days
    .filter((day) => {
      const dayOfWeek = getDay(day);
      return (
        selectedWeekDays.includes(dayOfWeek) &&
        !isBefore(day, startDate) &&
        (!endDate || isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const dateChunks: string[][] =
    groupDatesByConsecutiveChunks(matchedDates) ?? [];

  const sessionColor = getSessionColor(schedule.id);

  dateChunks.forEach((chunk: string[]) => {
    chunk.forEach((dateStr: string, idx: number) => {
      markedDates[dateStr] = {
        periods: [
          {
            startingDay: idx === 0,
            endingDay: idx === chunk.length - 1,
            color: sessionColor,
          },
        ],
      };
    });
  });

  return markedDates;
}

// schedule's repeatOption is monthly
export function getMarkedDatesFromMonthlySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: number;
}): Record<string, MarkedDate> {
  const markedDates: Record<string, MarkedDate> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : null;
  const selectedDays = [...schedule.selectedWeekDays];
  const monthStart = new Date(new Date().getFullYear(), viewMonth, 1);
  const monthEnd = new Date(new Date().getFullYear(), viewMonth + 1, 0);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      const dayOfMonth = day.getDate();
      return (
        selectedDays.includes(dayOfMonth) &&
        !isBefore(day, startDate) &&
        (!endDate || isBefore(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const dateChunks: string[][] =
    groupDatesByConsecutiveChunks(matchedDates) ?? [];

  const sessionColor = getSessionColor(schedule.id);

  dateChunks.forEach((chunk: string[]) => {
    chunk.forEach((dateStr: string, idx: number) => {
      markedDates[dateStr] = {
        periods: [
          {
            startingDay: idx === 0,
            endingDay: idx === chunk.length - 1,
            color: sessionColor,
          },
        ],
      };
    });
  });

  return markedDates;
}

// 세션별 색상을 관리하는 함수들
const SESSION_COLORS = [
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
  "#F8C471", // 주황
  "#82E0AA", // 연한 초록
  "#F1948A", // 살구색
  "#85C1E9", // 하늘색
  "#D7BDE2", // 연보라
];

// 세션 ID를 기반으로 일관된 색상 반환
export function getSessionColor(sessionId: string): string {
  // sessionId의 해시값을 생성하여 색상 인덱스 결정
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const colorIndex = Math.abs(hash) % SESSION_COLORS.length;
  return SESSION_COLORS[colorIndex];
}

// 랜덤 색상 반환
export function getRandomSessionColor(): string {
  const randomIndex = Math.floor(Math.random() * SESSION_COLORS.length);
  return SESSION_COLORS[randomIndex];
}

// 사용 가능한 색상 목록 반환
export function getAvailableColors(): string[] {
  return [...SESSION_COLORS];
}
