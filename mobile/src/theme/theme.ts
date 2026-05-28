export const darkColors = {
  background: '#090B0A',
  backgroundSoft: '#0E110E',
  surface: '#121512',
  surfaceElevated: '#171C17',
  surfaceGlass: '#151A15',
  card: '#1B211B',
  border: '#303A30',
  borderStrong: '#465446',
  text: '#F8FAF8',
  textMuted: '#9CA89C',
  textSoft: '#DDE5DD',
  primary: '#A3E635',
  primaryText: '#090B0A',
  accent: '#22C55E',
  info: '#38BDF8',
  teal: '#22C55E',
  tealDark: '#15803D',
  lime: '#a3e635',
  amber: '#EAB308',
  red: '#F43F5E',
  danger: '#F43F5E',
  redDark: '#7F1D1D',
  cyan: '#38BDF8',
  cyanSoft: '#E0F2FE',
  navy: '#111827',
};

export const lightColors = {
  background: '#F6F8F4',
  backgroundSoft: '#EEF3EA',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAF6',
  surfaceGlass: '#F1F5EE',
  card: '#FFFFFF',
  border: '#D7E1D3',
  borderStrong: '#AEBFA8',
  text: '#101510',
  textMuted: '#657063',
  textSoft: '#344133',
  primary: '#65A30D',
  primaryText: '#FFFFFF',
  accent: '#16A34A',
  info: '#0284C7',
  teal: '#16A34A',
  tealDark: '#166534',
  lime: '#65A30D',
  amber: '#B7791F',
  red: '#DC2626',
  danger: '#DC2626',
  redDark: '#FECACA',
  cyan: '#0284C7',
  cyanSoft: '#E0F2FE',
  navy: '#111827',
};

export type ThemeColors = typeof darkColors;

export const themes = {
  dark: darkColors,
  light: lightColors,
};

export const colors = darkColors;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 8,
};

export const spacing = {
  screenX: 20,
  screenTop: 54,
  screenBottom: 34,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
};
