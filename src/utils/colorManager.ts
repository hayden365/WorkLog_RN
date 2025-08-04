// 색상 팔레트 정의
export const SESSION_COLORS = [
  "#2b7dd4ff", // 메인 블루
  "#5AC8FA", // 밝은 하늘
  "#00B2A9", // 강한 민트
  "#3E8EDE", // 중간 블루
  "#6F42C1", // 딥 퍼플
  "#A052CC", // 밝은 보라
  "#009688", // 청록 계열
  "#4FC3F7", // 밝은 청색
  "#81D4FA", // 연하늘
  "#3D5AFE", // 강한 코발트블루
  "#26C6DA", // 시원한 블루그린
  "#80CBC4", // 연청록
  "#B39DDB", // 연보라
  "#64B5F6", // 베이비 블루
  "#1E88E5", // 선명한 블루
  "#90CAF9", // 페일 블루
  "#C5CAE9", // 아주 연한 블루그레이
  "#8E99F3", // 연보라+블루
  "#00ACC1", // 강한 틸
  "#B2EBF2", // 파스텔 틸
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
