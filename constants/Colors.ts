/**
 * PawRing 컬러 시스템
 * 포인트 컬러: oklch(58.8% 0.158 241.966) → #0084D1
 *
 * - Colors.light / Colors.dark: JS에서 직접 참조 (아이콘, 네비게이션 등)
 * - themeVars: NativeWind vars()로 CSS 변수 주입 (Screen 컴포넌트에서 사용)
 */

import { vars } from 'nativewind';

const palette = {
  blue: {
    50: '#EAF7FF',
    100: '#D1ECFF',
    200: '#A6DBFF',
    300: '#69BDFA',
    400: '#25A1EC',
    500: '#0084D1',
    600: '#006FB9',
    700: '#005A9B',
    800: '#004478',
    900: '#00315B',
    950: '#001C3C',
  },
} as const;

const Colors = {
  light: {
    primary: palette.blue[500],
    primaryForeground: '#FFFFFF',
    background: '#FFFFFF',
    foreground: '#171717',
    surface: '#F5F5F5',
    surfaceElevated: '#FFFFFF',
    mutedForeground: '#737373',
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    success: '#16A34A',
    error: '#DC2626',
    warning: '#D97706',
  },
  dark: {
    primary: palette.blue[400],
    primaryForeground: '#FFFFFF',
    background: '#0A0A0A',
    foreground: '#FAFAFA',
    surface: '#171717',
    surfaceElevated: '#262626',
    mutedForeground: '#A3A3A3',
    border: '#404040',
    borderStrong: '#525252',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  palette,
} as const;

function toVars(theme: Record<keyof typeof Colors.light, string>) {
  return vars({
    '--color-primary': theme.primary,
    '--color-primary-foreground': theme.primaryForeground,
    '--color-background': theme.background,
    '--color-foreground': theme.foreground,
    '--color-surface': theme.surface,
    '--color-surface-elevated': theme.surfaceElevated,
    '--color-muted-foreground': theme.mutedForeground,
    '--color-border': theme.border,
    '--color-border-strong': theme.borderStrong,
    '--color-success': theme.success,
    '--color-error': theme.error,
    '--color-warning': theme.warning,
  });
}

export const themeVars = {
  light: toVars(Colors.light),
  dark: toVars(Colors.dark),
} as const;

export default Colors;
