import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ScheduleModal from '../../src/components/ScheduleModal';
import { useWorkplaceStore } from '../../src/store/workplaceStore';
import { Workplace } from '../../src/models/Workplace';
import { WorkSession } from '../../src/models/WorkSession';
import { createTestSession } from '../helpers';

// SafeAreaView는 네이티브 컨텍스트를 요구하므로 단순 View로 대체한다.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

// 편집 모달은 이 테스트의 관심사가 아니며 네이티브 피커를 끌고 온다.
jest.mock('../../src/components/NewSessionModal', () => ({
  NewSessionModal: () => null,
}));

const mockGetScheduleById = jest.fn();
jest.mock('../../src/hooks/useScheduleManager', () => ({
  useScheduleManager: () => ({
    getScheduleById: mockGetScheduleById,
    deleteSchedule: jest.fn(),
    updateSchedule: jest.fn(),
  }),
}));

const workplace = (o: Partial<Workplace> = {}): Workplace => ({
  id: 'wp1',
  name: '카페',
  color: '#111111',
  wageType: 'hourly',
  wage: 10000,
  defaultBreakMinutes: 60,
  archived: false,
  ...o,
});

const renderDetail = (session: WorkSession, wp: Workplace) => {
  useWorkplaceStore.setState({ workplacesById: { [wp.id]: wp } });
  mockGetScheduleById.mockReturnValue(session);
  return render(
    <ScheduleModal visible onClose={jest.fn()} sessionId={session.id} />,
  );
};

describe('ScheduleModal 휴게시간 표시', () => {
  it('휴게 오버라이드가 null이면 근무지 기본 휴게시간을 상속해 보여준다', () => {
    // 09:00-18:00 = 총 9시간, 휴게 60분 상속 → 실 근무 8.0시간
    const session = createTestSession({ workplaceId: 'wp1', breakMinutes: null });
    renderDetail(session, workplace({ defaultBreakMinutes: 60 }));

    expect(screen.getByText('휴게 60분')).toBeTruthy();
    expect(
      screen.getByText('실 근무 8.0시간 (총 9.0시간, 휴게 60분)'),
    ).toBeTruthy();
  });

  it('세션에 휴게 오버라이드가 있으면 근무지 기본값 대신 그 값을 보여준다', () => {
    const session = createTestSession({ workplaceId: 'wp1', breakMinutes: 30 });
    renderDetail(session, workplace({ defaultBreakMinutes: 60 }));

    expect(screen.getByText('휴게 30분')).toBeTruthy();
    expect(
      screen.getByText('실 근무 8.5시간 (총 9.0시간, 휴게 30분)'),
    ).toBeTruthy();
  });

  it('휴게 0분이면 총 근무시간과 실 근무시간이 같다', () => {
    const session = createTestSession({ workplaceId: 'wp1', breakMinutes: 0 });
    renderDetail(session, workplace({ defaultBreakMinutes: 60 }));

    expect(screen.getByText('휴게 0분')).toBeTruthy();
    expect(
      screen.getByText('실 근무 9.0시간 (총 9.0시간, 휴게 0분)'),
    ).toBeTruthy();
  });
});

describe('ScheduleModal 근무지·급여 표시', () => {
  it('급여 오버라이드가 null이면 근무지 급여·급여유형을 상속해 보여준다', () => {
    const session = createTestSession({
      workplaceId: 'wp1',
      wage: null,
      wageType: null,
    });
    renderDetail(session, workplace({ wageType: 'monthly', wage: 2500000 }));

    expect(screen.getByText('카페')).toBeTruthy();
    expect(screen.getByText('2,500,000')).toBeTruthy();
    expect(screen.getByText('월급')).toBeTruthy();
  });
});
