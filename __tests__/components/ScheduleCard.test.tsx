import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScheduleCard from '../../src/components/ScheduleCard';
import { createTestSession } from '../helpers';

describe('ScheduleCard', () => {
  const session = createTestSession({
    id: 'card-1',
    jobName: '카페 알바',
    wage: 10000,
    startTime: new Date(2026, 3, 15, 9, 0),
    endTime: new Date(2026, 3, 15, 18, 0),
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
    description: '주말 근무',
    color: '#3D5AFE',
  });

  it('직업명을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('카페 알바')).toBeTruthy();
  });

  it('근무 시간을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('09:00 ~ 18:00')).toBeTruthy();
  });

  it('급여를 표시한다 (wage > 0)', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('10,000원')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = render(<ScheduleCard session={session} />);
    expect(getByText('주말 근무')).toBeTruthy();
  });

  it('onPress 콜백을 호출한다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ScheduleCard session={session} onPress={onPress} />);
    fireEvent.press(getByText('카페 알바'));
    expect(onPress).toHaveBeenCalledWith(session);
  });

  it('onDelete 제공 시 삭제 버튼을 표시한다', () => {
    const onDelete = jest.fn();
    const { getByText } = render(<ScheduleCard session={session} onDelete={onDelete} />);
    const deleteButton = getByText('×');
    expect(deleteButton).toBeTruthy();
    fireEvent.press(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('card-1');
  });

  it('onDelete 미제공 시 삭제 버튼을 표시하지 않는다', () => {
    const { queryByText } = render(<ScheduleCard session={session} />);
    expect(queryByText('×')).toBeNull();
  });
});
