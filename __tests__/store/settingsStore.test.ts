import { useSettingsStore } from '../../src/store/settingsStore';

describe('useSettingsStore', () => {
  it('기본 표시 모드는 실근무(actual)다', () => {
    expect(useSettingsStore.getState().workTimeDisplayMode).toBe('actual');
  });
  it('표시 모드를 변경한다', () => {
    useSettingsStore.getState().setWorkTimeDisplayMode('total');
    expect(useSettingsStore.getState().workTimeDisplayMode).toBe('total');
    useSettingsStore.getState().setWorkTimeDisplayMode('actual');
  });
});
