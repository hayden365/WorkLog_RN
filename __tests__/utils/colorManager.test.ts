import {
  colorManager,
  SESSION_COLORS,
  getSessionColor,
  releaseSessionColor,
  resetColorManager,
  getRandomSessionColor,
} from '../../src/utils/colorManager';

describe('ColorManager', () => {
  beforeEach(() => {
    resetColorManager();
  });

  describe('getSessionColor', () => {
    it('첫 번째 세션에 palette[0] 색상을 할당한다', () => {
      const color = getSessionColor('session-1');
      expect(color).toBe(SESSION_COLORS[0]);
    });

    it('두 번째 세션에 palette[1] 색상을 할당한다', () => {
      getSessionColor('session-1');
      const color = getSessionColor('session-2');
      expect(color).toBe(SESSION_COLORS[1]);
    });

    it('같은 세션 ID에는 같은 색상을 반환한다', () => {
      const color1 = getSessionColor('session-1');
      const color2 = getSessionColor('session-1');
      expect(color1).toBe(color2);
    });

    it('20색 소진 시 순환하여 할당한다', () => {
      for (let i = 0; i < 20; i++) {
        getSessionColor(`session-${i}`);
      }
      const color21 = getSessionColor('session-20');
      expect(SESSION_COLORS).toContain(color21);
    });
  });

  describe('releaseSessionColor', () => {
    it('해제된 색상을 다음 할당에 재사용한다', () => {
      const color1 = getSessionColor('session-1');
      releaseSessionColor('session-1');
      const color2 = getSessionColor('session-2');
      expect(color2).toBe(color1);
    });
  });

  describe('resetColorManager', () => {
    it('초기화 후 palette[0]부터 다시 할당한다', () => {
      getSessionColor('session-1');
      getSessionColor('session-2');
      resetColorManager();
      const color = getSessionColor('session-3');
      expect(color).toBe(SESSION_COLORS[0]);
    });
  });

  describe('getRandomSessionColor', () => {
    it('사용되지 않은 색상을 반환한다', () => {
      const color = getRandomSessionColor();
      expect(SESSION_COLORS).toContain(color);
    });
  });
});
