export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const sizes = {
  touchTarget: 48,
  buttonHeight: 48,
  inputHeight: 48,
  bottomNavHeight: 64,
  headerHeight: 56,
  fab: 56,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '600' as const },
  heading: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  meta: { fontSize: 12, fontWeight: '400' as const },
} as const;