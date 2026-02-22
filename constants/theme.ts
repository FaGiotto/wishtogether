export const Colors = {
  primary: '#6C63FF',
  secondary: '#FF6584',
  background: '#F8F8F8',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  success: '#10B981',
  border: '#E5E7EB',
  error: '#EF4444',
};

export const Typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radii = {
  card: 12,
  button: 8,
  full: 9999,
};
