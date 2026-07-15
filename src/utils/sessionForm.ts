import { WorkSession } from "../models/WorkSession";
import { Workplace, WageType } from "../models/Workplace";

export interface EditInitValues {
  wageType: WageType;
  wage: number;
  breakMinutes: number | null;
}

// 세션 편집 초기값 계산: 세션 오버라이드가 null이면 근무지 기본값으로 상속.
// 근무지를 찾지 못해도(보관/삭제 등) 크래시 없이 시급/0으로 폴백한다.
export function resolveEditInitValues(
  session: Pick<WorkSession, "wage" | "wageType" | "breakMinutes">,
  workplace:
    | Pick<Workplace, "wage" | "wageType" | "defaultBreakMinutes">
    | undefined
): EditInitValues {
  return {
    wageType: session.wageType ?? workplace?.wageType ?? "hourly",
    wage: session.wage ?? workplace?.wage ?? 0,
    breakMinutes: session.breakMinutes ?? workplace?.defaultBreakMinutes ?? null,
  };
}

export interface SavedOverrides {
  wageType: WageType | null;
  wage: number | null;
}

// 저장 시 입력값이 근무지 기본값과 동일하면 null(상속)로 되돌려 상속 관계를 유지한다.
export function toSavedOverrides(
  entered: { wageType: WageType; wage: number },
  workplace: Pick<Workplace, "wage" | "wageType"> | undefined
): SavedOverrides {
  if (
    workplace &&
    entered.wageType === workplace.wageType &&
    entered.wage === workplace.wage
  ) {
    return { wageType: null, wage: null };
  }
  return { wageType: entered.wageType, wage: entered.wage };
}
