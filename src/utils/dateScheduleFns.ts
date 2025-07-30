import { ScheduleByDate, WorkSession } from "../models/WorkSession";

export function generateScheduleByDate(
  sessions: WorkSession[]
): ScheduleByDate {
  const result: ScheduleByDate = {};

  sessions.forEach((session) => {
    const { startDate, endDate, repeatOption, selectedWeekDays } = session;

    if (repeatOption === "daily") {
      const key = formatDate(startDate);
      if (!result[key]) result[key] = [];
      result[key].push(session.id);
      return;
    }
  });

  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
