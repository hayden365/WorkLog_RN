import { useDateStore } from '../../src/store/dateStore';

describe('useDateStore', () => {
  it('초기값은 현재 월이다', () => {
    const { month } = useDateStore.getState();
    expect(month).toBe(new Date().getMonth());
  });

  it('setMonth로 월을 변경한다', () => {
    useDateStore.getState().setMonth(5);
    expect(useDateStore.getState().month).toBe(5);
  });

  it('setMonth(0)으로 1월을 설정한다', () => {
    useDateStore.getState().setMonth(0);
    expect(useDateStore.getState().month).toBe(0);
  });

  it('setMonth(11)으로 12월을 설정한다', () => {
    useDateStore.getState().setMonth(11);
    expect(useDateStore.getState().month).toBe(11);
  });

  it('초기값은 현재 연도이다', () => {
    // 다른 테스트가 상태를 바꾸므로 현재 연도로 되돌린 뒤 확인
    const now = new Date();
    useDateStore.getState().setYearMonth(now.getFullYear(), now.getMonth());
    expect(useDateStore.getState().year).toBe(now.getFullYear());
  });

  it('setYearMonth로 연도와 월을 함께 변경한다', () => {
    useDateStore.getState().setYearMonth(2027, 0);
    expect(useDateStore.getState().year).toBe(2027);
    expect(useDateStore.getState().month).toBe(0);
  });
});
