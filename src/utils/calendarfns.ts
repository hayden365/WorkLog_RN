import {
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
  parseISO,
  startOfMonth,
  endOfMonth,
  isAfter,
  addMonths,
  isSameDay,
} from "date-fns";
import {
  ScheduleByDate,
  WorkSession,
  CalendarDisplayMap,
  CalendarDisplayItem,
} from "../models/WorkSession";

// 날짜별 스케줄 인덱싱 함수
export function calculateScheduleByDate(
  dates: string[],
  sessionId: string,
  existingSchedule: ScheduleByDate
): ScheduleByDate {
  const scheduleByDate: ScheduleByDate = { ...existingSchedule };
  dates.forEach((date) => {
    if (scheduleByDate[date] && !scheduleByDate[date].includes(sessionId)) {
      scheduleByDate[date] = [...scheduleByDate[date], sessionId];
    } else if (!scheduleByDate[date]) {
      scheduleByDate[date] = [sessionId];
    }
  });
  return scheduleByDate;
}

// 달력 UI용 표시 데이터 생성 함수
export function generateCalendarDisplayMap(
  dateSchedule: ScheduleByDate,
  schedulesById: { [id: string]: WorkSession }
): CalendarDisplayMap {
  const calendarDisplayMap: CalendarDisplayMap = {};

  Object.entries(dateSchedule).forEach(([date, sessionIds]) => {
    const displayItems: CalendarDisplayItem[] = sessionIds
      .map((sessionId) => {
        const session = schedulesById[sessionId];
        if (!session) return null;

        return {
          color: session.color,
          selected: false,
          sessionId: session.id,
          jobName: session.jobName,
        };
      })
      .filter(Boolean) as CalendarDisplayItem[];

    if (displayItems.length > 0) {
      calendarDisplayMap[date] = displayItems;
    }
  });

  return calendarDisplayMap;
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

// repeatOption is daily
export function getMarkedDatesFromDailySchedule({
  schedule,
  viewMonth,
}: {
  schedule: WorkSession;
  viewMonth: Date;
}): Record<string, CalendarDisplayItem> {
  const markedDates: Record<string, CalendarDisplayItem> = {};
  const startDate = parseISO(schedule.startDate.toISOString());
  const endDate = schedule.endDate
    ? parseISO(schedule.endDate.toISOString())
    : endOfMonth(addMonths(viewMonth, 2));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const matchedDates = days
    .filter((day) => {
      return (
        (isAfter(day, startDate) || isSameDay(day, startDate)) &&
        (isBefore(day, endDate) || isSameDay(day, endDate))
      );
    })
    .map((d) => format(d, "yyyy-MM-dd"));

  const sessionColor = schedule.color || getSessionColor(schedule.id);

  matchedDates.forEach((dateStr: string) => {
    (markedDates as Record<string, CalendarDisplayItem>)[dateStr] = {
      color: sessionColor,
      selected: true,
      sessionId: schedule.id,
      jobName: schedule.jobName,
    };
  });

  console.log("matchedDates", matchedDates);
  console.log("markedDates", markedDates);

  return markedDates;
}

// // schedule's repeatOption is weekly
// export function getMarkedDatesFromWeeklySchedule({
//   schedule,
//   viewMonth,
// }: {
//   schedule: WorkSession;
//   viewMonth: Date;
// }): Record<string, CalendarDisplayItem> {
//   const markedDates: Record<string, CalendarDisplayItem> = {};
//   const startDate = parseISO(schedule.startDate.toISOString());
//   const endDate = schedule.endDate
//     ? parseISO(schedule.endDate.toISOString())
//     : null;
//   const selectedWeekDays = [...schedule.selectedWeekDays];
//   const monthStart = startOfMonth(new Date(viewMonth));
//   const monthEnd = endOfMonth(new Date(viewMonth));

//   const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
//   const matchedDates = days
//     .filter((day) => {
//       const dayOfWeek = getDay(day);
//       return (
//         selectedWeekDays.includes(dayOfWeek) &&
//         !isBefore(day, startDate) &&
//         (!endDate || !isBefore(day, endDate))
//       );
//     })
//     .map((d) => format(d, "yyyy-MM-dd"));

//   const dateChunks: string[][] =
//     groupDatesByConsecutiveChunks(matchedDates) ?? [];

//   const sessionColor = schedule.color || getSessionColor(schedule.id);

//   dateChunks.forEach((chunk: string[]) => {
//     chunk.forEach((dateStr: string) => {
//       markedDates[dateStr] = {
//         color: sessionColor,
//         selected: true,
//         sessionId: schedule.id,
//         jobName: schedule.jobName,
//       };
//     });
//   });

//   return markedDates;
// }

// // schedule's repeatOption is monthly
// export function getMarkedDatesFromMonthlySchedule({
//   schedule,
//   viewMonth,
// }: {
//   schedule: WorkSession;
//   viewMonth: Date;
// }): Record<string, CalendarDisplayItem> {
//   const markedDates: Record<string, CalendarDisplayItem> = {};
//   const startDate = parseISO(schedule.startDate.toISOString());
//   const endDate = schedule.endDate
//     ? parseISO(schedule.endDate.toISOString())
//     : null;
//   const selectedDays = [...schedule.selectedWeekDays];
//   const monthStart = startOfMonth(new Date(viewMonth));
//   const monthEnd = endOfMonth(new Date(viewMonth));

//   const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

//   const matchedDates = days
//     .filter((day) => {
//       const dayOfMonth = day.getDate();
//       return (
//         selectedDays.includes(dayOfMonth) &&
//         !isBefore(day, startDate) &&
//         (!endDate || !isBefore(day, endDate))
//       );
//     })
//     .map((d) => format(d, "yyyy-MM-dd"));

//   const dateChunks: string[][] =
//     groupDatesByConsecutiveChunks(matchedDates) ?? [];

//   const sessionColor = schedule.color || getSessionColor(schedule.id);

//   dateChunks.forEach((chunk: string[]) => {
//     chunk.forEach((dateStr: string) => {
//       markedDates[dateStr] = {
//         color: sessionColor,
//         selected: true,
//         sessionId: schedule.id,
//         jobName: schedule.jobName,
//       };
//     });
//   });

//   return markedDates;
// }

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

// 월별 스케줄 데이터 생성 함수
export function generateViewMonthScheduleData(
  schedules: WorkSession[],
  viewMonth: Date
): {
  markedDates: Record<string, CalendarDisplayItem[]>;
  dateSchedule: ScheduleByDate;
} {
  const markedDates: Record<string, CalendarDisplayItem[]> = {};
  const dateSchedule: ScheduleByDate = {};

  schedules.forEach((session) => {
    let sessionMarkedDates: Record<string, CalendarDisplayItem> = {};
    let sessionDates: string[] = [];

    switch (session.repeatOption) {
      case "daily":
        sessionMarkedDates = getMarkedDatesFromDailySchedule({
          schedule: session,
          viewMonth,
        });
        sessionDates = Object.keys(sessionMarkedDates);
        console.log("sessionDates", sessionDates);
        break;
      // case "weekly":
      //   sessionMarkedDates = Object.values(
      //     getMarkedDatesFromWeeklySchedule({
      //       schedule: session,
      //       viewMonth,
      //     })
      //   );
      //   sessionDates = Object.keys(sessionMarkedDates);
      //   break;
      // case "monthly":
      //   sessionMarkedDates = Object.values(
      //     getMarkedDatesFromMonthlySchedule({
      //       schedule: session,
      //       viewMonth,
      //     })
      //   );
      //   sessionDates = Object.keys(sessionMarkedDates);
      //   break;
      default:
        break;
    }

    // markedDates 병합
    Object.entries(sessionMarkedDates).forEach(([date, markedDate]) => {
      if (markedDates[date]) {
        markedDates[date].push(markedDate);
      } else {
        markedDates[date] = [markedDate] as CalendarDisplayItem[];
      }
    });

    // dateSchedule 업데이트
    sessionDates.forEach((date) => {
      if (dateSchedule[date]) {
        if (!dateSchedule[date].includes(session.id)) {
          dateSchedule[date] = [...dateSchedule[date], session.id];
        }
      } else {
        dateSchedule[date] = [session.id];
      }
    });
  });

  return { markedDates, dateSchedule };
}
