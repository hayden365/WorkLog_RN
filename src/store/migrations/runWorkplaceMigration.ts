import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";
import { buildWorkplaceMigration } from "./workplaceMigration";

export const MIGRATION_FLAG_KEY = "migration-workplace-v2-done";
export const SCHEDULE_BACKUP_KEY = "schedule-store-backup-v1";

const SCHEDULE_STORE_KEY = "schedule-store";
const WORKPLACE_STORE_KEY = "workplace-store";

const storage = new MMKV();

// 앱 시작 시 1회 실행. 구 jobName 기반 세션을 근무지 엔티티로 승격한다.
// 이 함수는 절대 throw 하지 않는다 — 실패 시 원본 데이터를 최대한 보존하고
// 플래그를 세우지 않아 다음 실행에서 재시도할 수 있게 한다.
export const runWorkplaceMigration = (): boolean => {
  try {
    if (storage.getString(MIGRATION_FLAG_KEY) === "1") return false;

    const rawScheduleStr = storage.getString(SCHEDULE_STORE_KEY);
    if (!rawScheduleStr) {
      // 저장된 스케줄이 없으면 마이그레이션 불필요 — 플래그만 세운다.
      storage.set(MIGRATION_FLAG_KEY, "1");
      return false;
    }

    // 순정 원본 스냅샷은 최초 1회만 기록한다. 인터럽트로 인한 재시도에서는
    // 이미 기록된 백업이 곧 순정 데이터이므로, 그 backup(있다면)을 소스로
    // 사용해야 한다 — 이미 절반 마이그레이션된 live schedule-store를
    // 다시 파싱하면 jobName 소실로 인해 근무지가 모두 병합되는 사고가 난다.
    const existingBackupStr = storage.getString(SCHEDULE_BACKUP_KEY);
    const sourceStr = existingBackupStr ?? rawScheduleStr;

    // 백업 기록은 sourceStr 파싱 성공 이후로 미룬다. 최초 실행(백업 없음)에서
    // schedule-store 자체가 손상돼 있으면, 파싱 전에 백업부터 남길 경우 그
    // 손상된 문자열이 영구 백업으로 굳어버려 이후 실행마다 같은 실패가
    // 반복되고 영영 복구되지 않는다.
    const parsed = JSON.parse(sourceStr);
    const allSchedulesById = parsed?.state?.allSchedulesById ?? {};

    if (Object.keys(allSchedulesById).length === 0) {
      // 마이그레이션할 세션이 없다 — 완료로 간주.
      storage.set(MIGRATION_FLAG_KEY, "1");
      return false;
    }

    if (!existingBackupStr) {
      storage.set(SCHEDULE_BACKUP_KEY, rawScheduleStr);
    }

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
  } catch (error) {
    // 손상된 데이터 등으로 마이그레이션이 실패해도 앱이 먹통이 되면 안 된다.
    // 백업이 있으면 원본으로 복구하고, 플래그는 세우지 않아 다음 버전에서
    // 재시도할 수 있게 한다.
    console.warn("[runWorkplaceMigration] 마이그레이션 실패, 원본 데이터로 복구 시도", error);
    try {
      const backup = storage.getString(SCHEDULE_BACKUP_KEY);
      if (backup) {
        storage.set(SCHEDULE_STORE_KEY, backup);
      }
    } catch (restoreError) {
      console.warn("[runWorkplaceMigration] 백업 복구 실패", restoreError);
    }
    return false;
  }
};
