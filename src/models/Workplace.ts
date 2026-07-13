export type WageType = "hourly" | "daily" | "monthly";

// 근무지: 시급·급여유형·기본 휴게시간·색상을 소유하는 1급 엔티티
export interface Workplace {
  id: string;
  name: string;
  color: string;
  wageType: WageType;
  wage: number;
  defaultBreakMinutes: number; // 기본 휴게(분), 0 가능
  archived: boolean; // '근무 종료'된 근무지 숨김용
  // 향후 확장 예약: weeklyHolidayPay, nightPremium, overtime, deductions
}
