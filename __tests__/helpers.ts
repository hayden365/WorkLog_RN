import { WorkSession } from '../src/models/WorkSession';

export function createTestSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: 'test-session-1',
    workplaceId: 'test-wp-1',
    wageType: 'hourly',
    wage: 10000,
    breakMinutes: 0,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    repeatOption: 'daily',
    selectedWeekDays: new Set<number>(),
    isCurrentlyWorking: true,
    description: '',
    // deprecated 호환
    jobName: '테스트 알바',
    color: '#3D5AFE',
    calculatedDailyWage: 90000,
    ...overrides,
  };
}
