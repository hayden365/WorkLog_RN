// 색상 팔레트 정의
export const SESSION_COLORS = [
  "#9cbdff",
  "#5AC8FA",
  "#30B0C7",
  "#00C7BE",
  "#32ADE6",
  "#6ccdb8",
  "#7FB3D5",
  "#A0CFFF",
  "#7adf91",
  "#A7D3F3",
  "#AF52DE",
  "#D0A9F5",
  "#9BBBD4",
  "#C9DFF5",
  "#A2D4C0",
  "#B2C8DF",
  "#b5d1d3",
  "#ae8fc8",
  "#BFD9F2",
  "#7f90d1",
] as const;

class ColorManager {
  private usedColors: Set<string> = new Set();
  private sessionColorMap: Map<string, string> = new Map();
  private nextColorIndex: number = 0;

  getSessionColor(sessionId: string): string {
    // 이미 할당된 색상이 있으면 반환
    if (this.sessionColorMap.has(sessionId)) {
      return this.sessionColorMap.get(sessionId)!;
    }

    // 순서대로 색상 할당
    const color = this.getNextAvailableColor();
    this.sessionColorMap.set(sessionId, color);
    this.usedColors.add(color);

    return color;
  }

  // 순서대로 사용 가능한 색상 찾기
  private getNextAvailableColor(): string {
    // 모든 색상을 순회하면서 사용되지 않은 색상 찾기
    for (let i = 0; i < SESSION_COLORS.length; i++) {
      const colorIndex = (this.nextColorIndex + i) % SESSION_COLORS.length;
      const color = SESSION_COLORS[colorIndex];

      if (!this.usedColors.has(color)) {
        this.nextColorIndex = (colorIndex + 1) % SESSION_COLORS.length;
        return color;
      }
    }

    // 모든 색상이 사용된 경우, 가장 오래 사용되지 않은 색상 재사용
    return this.getLeastRecentlyUsedColor();
  }

  // 가장 오래 사용되지 않은 색상 반환 (순환 방식)
  private getLeastRecentlyUsedColor(): string {
    const color = SESSION_COLORS[this.nextColorIndex];
    this.nextColorIndex = (this.nextColorIndex + 1) % SESSION_COLORS.length;
    return color;
  }

  getRandomUnusedColor(): string {
    const unusedColors = SESSION_COLORS.filter(
      (color) => !this.usedColors.has(color)
    );

    if (unusedColors.length === 0) {
      return this.getLeastRecentlyUsedColor();
    }

    const randomIndex = Math.floor(Math.random() * unusedColors.length);
    const selectedColor = unusedColors[randomIndex];
    this.usedColors.add(selectedColor);

    return selectedColor;
  }

  releaseColor(sessionId: string): void {
    const color = this.sessionColorMap.get(sessionId);
    if (color) {
      this.sessionColorMap.delete(sessionId);
      this.usedColors.delete(color);

      // 해제된 색상을 다음 할당 시 우선적으로 사용하도록 인덱스 조정
      const colorIndex = SESSION_COLORS.indexOf(
        color as (typeof SESSION_COLORS)[number]
      );
      if (colorIndex !== -1) {
        this.nextColorIndex = colorIndex;
      }
    }
  }

  reset(): void {
    this.usedColors.clear();
    this.sessionColorMap.clear();
    this.nextColorIndex = 0;
  }

  getUsedColors(): string[] {
    return Array.from(this.usedColors);
  }

  getAvailableColors(): string[] {
    return SESSION_COLORS.filter((color) => !this.usedColors.has(color));
  }

  // 현재 다음에 할당될 색상 인덱스 반환 (디버깅용)
  getNextColorIndex(): number {
    return this.nextColorIndex;
  }
}

export const colorManager = new ColorManager();

// 편의 함수들
export function getSessionColor(sessionId: string): string {
  return colorManager.getSessionColor(sessionId);
}

export function getRandomSessionColor(): string {
  return colorManager.getRandomUnusedColor();
}

export function releaseSessionColor(sessionId: string): void {
  colorManager.releaseColor(sessionId);
}

export function resetColorManager(): void {
  colorManager.reset();
}
