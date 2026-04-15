import { WorkSession, RepeatOption } from '../src/models/WorkSession';

export function createTestSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: 'test-session-1',
    jobName: '테스트 알바',
    wageType: 'hourly',
    wage: 10000,
    calculatedDailyWage: 90000,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    repeatOption: 'daily',
    selectedWeekDays: new Set<number>(),
    isCurrentlyWorking: true,
    description: '',
    color: '#3D5AFE',
    ...overrides,
  };
}
