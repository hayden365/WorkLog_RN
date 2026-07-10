/**
 * Design tokens — spacing, radius, and typography scales.
 *
 * Scheme-independent (unlike colors, which vary by light/dark — see ./colors).
 * Values are derived from the current codebase usage so migration is 1:1;
 * off-scale legacy values are noted per scale and should collapse to the
 * nearest token over time.
 */

/**
 * 4-based spacing scale for padding, margin, and gap.
 * Legacy off-scale values still in the code: 6 → sm(8), 10 → md(12).
 * One-off layout numbers (36, 60, 100) may stay inline.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Border-radius scale.
 * Legacy off-scale values: 6 → sm(8), 10 → md(12), 30/50 → use `full` for pills.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/**
 * Font-size scale.
 * `base` (16) is the app's dominant body size.
 * Legacy off-scale value: 15 → prefer md(14) or base(16).
 */
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 24,
  xxxl: 28,
  /** Hero numbers (e.g. the salary total on the home card). */
  display: 44,
} as const;

/**
 * Canonical font weights. Numeric strings match React Native's TextStyle.
 * Existing `"bold"` in components is equivalent to `bold` (700) here.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * The single embedded Pretendard family. Weight is selected by `fontWeight`,
 * NOT by per-weight family names ("Pretendard-Bold" etc.) — those match neither
 * the font's internal family name ("Pretendard") nor the family the expo-font
 * plugin registers, so they silently fall back to the system font. On Android
 * the weight resolves through the generated font-family XML (weight→file); on
 * iOS through the family's registered faces.
 */
export const FONT_FAMILY = 'Pretendard';

/** Style fragment binding the Pretendard family + the requested weight. */
export function font(weight: keyof typeof fontWeight = 'regular') {
  return { fontFamily: FONT_FAMILY, fontWeight: fontWeight[weight] };
}

/** Tabular (fixed-width) figures — spread onto any numeric Text style. */
export const numeric = { fontVariant: ['tabular-nums'] as ['tabular-nums'] };

/** Grouped typography tokens for ergonomic imports. */
export const typography = {
  size: fontSize,
  weight: fontWeight,
  family: FONT_FAMILY,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
