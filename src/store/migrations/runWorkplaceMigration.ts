import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";
import { buildWorkplaceMigration } from "./workplaceMigration";

export const MIGRATION_FLAG_KEY = "migration-workplace-v2-done";
export const SCHEDULE_BACKUP_KEY = "schedule-store-backup-v1";

const SCHEDULE_STORE_KEY = "schedule-store";
const WORKPLACE_STORE_KEY = "workplace-store";

const storage = new MMKV();

// 앱 시작 시 1회 실행. 구 jobName 기반 세션을 근무지 엔티티로 승격한다.
export const runWorkplaceMigration = (): boolean => {
  if (storage.getString(MIGRATION_FLAG_KEY) === "1") return false;

  const rawScheduleStr = storage.getString(SCHEDULE_STORE_KEY);
  if (!rawScheduleStr) {
    // 저장된 스케줄이 없으면 마이그레이션 불필요 — 플래그만 세운다.
    storage.set(MIGRATION_FLAG_KEY, "1");
    return false;
  }

  // 실패 대비 원본 스냅샷 백업 (데이터 유실 방지)
  storage.set(SCHEDULE_BACKUP_KEY, rawScheduleStr);

  const parsed = JSON.parse(rawScheduleStr);
  const allSchedulesById = parsed?.state?.allSchedulesById ?? {};

  const { workplacesById, sessionsById } = buildWorkplaceMigration(
    allSchedulesById,
    () => uuid.v4() as string
  );

  // 근무지 스토어 기록 (zustand persist 래핑 형태)
  storage.set(
    WORKPLACE_STORE_KEY,
    JSON.stringify({ state: { workplacesById }, version: 1 })
  );

  // 스케줄 스토어 갱신 (버전 2로 승격)
  storage.set(
    SCHEDULE_STORE_KEY,
    JSON.stringify({ state: { allSchedulesById: sessionsById }, version: 2 })
  );

  storage.set(MIGRATION_FLAG_KEY, "1");
  return true;
};
