import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EarningsCard } from '../../src/components/EarningsCard';

describe('EarningsCard', () => {
  it('초기 상태에서 금액이 숨겨져 있다', () => {
    const { getByText } = render(<EarningsCard totalEarnings={1500000} />);
    expect(getByText('금액숨김')).toBeTruthy();
  });

  it('월 레이블을 올바르게 표시한다', () => {
    const { getByText } = render(<EarningsCard totalEarnings={0} />);
    const currentMonth = new Date().getMonth() + 1;
    expect(getByText(`${currentMonth}월 예상 급여`)).toBeTruthy();
  });
});
