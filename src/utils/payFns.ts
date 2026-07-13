import { WorkSession, RepeatOption } from "../models/WorkSession";
import { Workplace, WageType } from "../models/Workplace";

export interface PayBreakdown {
  totalMinutes: number; // 총 근무(휴게 포함)
  breakMinutes: number; // 휴게
  paidMinutes: number; // 실 근무 = max(0, total - break)
  base: number; // 기본급
  // ── 향후 확장 예약 (이번엔 항상 0) ──
  nightPremium: number;
  overtimePremium: number;
  holidayPay: number;
  gross: number; // base + 프리미엄
  deductions: number;
  net: number; // gross - deductions
}

export interface ResolvedSession {
  id: string;
  workplaceId: string;
  jobName: string; // = workplace.name (표시용)
  color: string; // = workplace.color
  wageType: WageType;
  wage: number;
  breakMinutes: number;
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date | null;
  repeatOption: RepeatOption;
  selectedWeekDays: Set<number>;
  isCurrentlyWorking: boolean;
  description: string;
}

// 총 근무 분. 종료가 시작보다 이르면 자정을 넘긴 근무이므로 24시간을 더한다.
export const sessionTotalMinutes = (startTime: Date, endTime: Date): number => {
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  let workMinutes = endMinutes - startMinutes;
  if (workMinutes < 0) workMinutes += 24 * 60;
  return workMinutes;
};

// 근무지 기본값 + 세션 오버라이드 병합. null 오버라이드는 근무지 기본값을 상속.
export const resolveSession = (
  session: WorkSession,
  workplace: Workplace
): ResolvedSession => ({
  id: session.id,
  workplaceId: session.workplaceId,
  jobName: workplace.name,
  color: workplace.color,
  wageType: session.wageType ?? workplace.wageType,
  wage: session.wage ?? workplace.wage,
  breakMinutes: session.breakMinutes ?? workplace.defaultBreakMinutes,
  startTime: session.startTime,
  endTime: session.endTime,
  startDate: session.startDate,
  endDate: session.endDate,
  repeatOption: session.repeatOption,
  selectedWeekDays: session.selectedWeekDays,
  isCurrentlyWorking: session.isCurrentlyWorking,
  description: session.description,
});

// 세션 하나의 급여 내역 (순수). 급여는 항상 실근무(휴게 제외) 기준.
export const computeSessionPay = (r: ResolvedSession): PayBreakdown => {
  const totalMinutes = sessionTotalMinutes(r.startTime, r.endTime);
  const breakMinutes = r.breakMinutes;
  const paidMinutes = Math.max(0, totalMinutes - breakMinutes);

  let base = 0;
  if (r.wageType === "hourly") {
    base = (paidMinutes / 60) * r.wage;
  } else if (r.wageType === "daily") {
    base = r.wage;
  } else {
    base = 0; // monthly: 월 집계에서 1회 반영
  }

  const nightPremium = 0;
  const overtimePremium = 0;
  const holidayPay = 0;
  const gross = base + nightPremium + overtimePremium + holidayPay;
  const deductions = 0;
  const net = gross - deductions;

  return {
    totalMinutes,
    breakMinutes,
    paidMinutes,
    base,
    nightPremium,
    overtimePremium,
    holidayPay,
    gross,
    deductions,
    net,
  };
};
