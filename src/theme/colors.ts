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
  brand: string;
  brandStrong: string;
  danger: string;
  saturday: string;
  sunday: string;
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
  accent: '#4e9280',
  accentText: '#ffffff',
  brand: '#4e9280',
  brandStrong: '#3e7e6b',
  danger: '#ff3b30',
  saturday: '#3e6fd0',
  sunday: '#e0503c',
  calendarSelected: '#4e9280',
  calendarToday: '#4e9280',
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
  accent: '#4e9280',
  accentText: '#ffffff',
  brand: '#4e9280',
  brandStrong: '#5fa997',
  danger: '#ff453a',
  saturday: '#5b8def',
  sunday: '#ff6b5b',
  calendarSelected: '#4e9280',
  calendarToday: '#4e9280',
  calendarDisabled: '#48484a',
};

export type Scheme = 'light' | 'dark';
