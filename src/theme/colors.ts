export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  calendarSelected: string;
  calendarToday: string;
  calendarDisabled: string;
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f8f8',
  surfaceElevated: '#ffffff',
  border: '#dddddd',
  divider: '#eeeeee',
  textPrimary: '#1c1c1e',
  textSecondary: '#666666',
  textMuted: '#8e8e93',
  accent: '#007aff',
  accentText: '#ffffff',
  danger: '#ff3b30',
  calendarSelected: '#007aff',
  calendarToday: '#007aff',
  calendarDisabled: '#d9e1e8',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1c1c1e',
  surfaceElevated: '#2c2c2e',
  border: '#3a3a3c',
  divider: '#2c2c2e',
  textPrimary: '#ffffff',
  textSecondary: '#aeaeb2',
  textMuted: '#8e8e93',
  accent: '#0a84ff',
  accentText: '#ffffff',
  danger: '#ff453a',
  calendarSelected: '#0a84ff',
  calendarToday: '#0a84ff',
  calendarDisabled: '#48484a',
};

export type Scheme = 'light' | 'dark';
