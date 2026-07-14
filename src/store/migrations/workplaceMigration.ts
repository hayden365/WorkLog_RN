import { Workplace, WageType } from "../../models/Workplace";

export interface RawSession {
  id: string;
  jobName: string;
  wageType: string;
  wage: number;
  color?: string;
  calculatedDailyWage?: number | null;
  [k: string]: any;
}

export interface MigrationResult {
  workplacesById: Record<string, Workplace>;
  sessionsById: Record<string, any>;
}

// 구 형식(jobName 기반) 세션 맵을 근무지 엔티티 + workplaceId 참조 세션으로 변환한다.
export const buildWorkplaceMigration = (
  allSchedulesById: Record<string, RawSession>,
  genId: () => string
): MigrationResult => {
  const workplacesById: Record<string, Workplace> = {};
  const sessionsById: Record<string, any> = {};

  // (이름 + 시급유형 + 시급) 조합 → 근무지 id
  const groupKeyToId = new Map<string, string>();
  // 표시 이름 중복 방지용 카운터 (같은 jobName이 서로 다른 시급으로 여러 근무지가 될 때)
  const nameUseCount = new Map<string, number>();

  const sessions = Object.values(allSchedulesById);

  for (const s of sessions) {
    const groupKey = `${s.jobName}||${s.wageType}||${s.wage}`;
    let workplaceId = groupKeyToId.get(groupKey);

    if (!workplaceId) {
      workplaceId = genId();
      groupKeyToId.set(groupKey, workplaceId);

      const used = nameUseCount.get(s.jobName) ?? 0;
      const displayName = used === 0 ? s.jobName : `${s.jobName} (${used + 1})`;
      nameUseCount.set(s.jobName, used + 1);

      workplacesById[workplaceId] = {
        id: workplaceId,
        name: displayName,
        color: s.color ?? "#3D5AFE",
        wageType: s.wageType as WageType,
        wage: s.wage,
        defaultBreakMinutes: 0, // 급여 불변 보장
        archived: false,
      };
    }

    // 세션 재작성: workplaceId 연결, 오버라이드 null, 구 필드 제거
    const { jobName, color, calculatedDailyWage, ...rest } = s;
    sessionsById[s.id] = {
      ...rest,
      workplaceId,
      wageType: null,
      wage: null,
      breakMinutes: null,
    };
  }

  return { workplacesById, sessionsById };
};
