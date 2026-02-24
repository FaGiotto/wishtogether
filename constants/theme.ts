export const Colors = {
  // Brand
  primary: '#7C5CFC',
  secondary: '#FF6B9D',

  // Backgrounds
  background: '#EEEAF8',
  backgroundGradient: '#F8F7FF',  // auth/gradient screens
  surface: '#FFFFFF',
  surface2: '#F3F0FF',
  cardDark: '#16151F',            // dark glass card (gate screen, dark buttons)

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#8892A4',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  border: '#EDE8FF',

  // Hearts / priority
  hearts: '#29E583',
  heartsDark: '#17A058',
  inputEmpty: '#D1D5DB',          // empty hearts, unfilled input states

  // Shadows
  shadowCard: '#2A1D9E',          // card drop shadow

  // Overlays (dark)
  overlayDark: 'rgba(0,0,0,0.4)',
  overlayActionSheet: 'rgba(26,26,46,0.4)',
  overlayMedium: 'rgba(0,0,0,0.25)',
  overlayImageMid: 'rgba(0,0,0,0.55)',
  overlayImageDeep: 'rgba(0,0,0,0.80)',

  // Glass (white overlays for use on dark backgrounds)
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderAlt: 'rgba(255,255,255,0.12)',
  glassBorderMid: 'rgba(255,255,255,0.15)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBgStrong: 'rgba(255,255,255,0.18)',
  glassTextLight: 'rgba(255,255,255,0.70)',
  glassTextSub: 'rgba(255,255,255,0.55)',
  glassTextMid: 'rgba(255,255,255,0.75)',

  // Vote banner (amber)
  voteBannerBg: '#FEF3C7',
  voteBannerBorder: '#FDE68A',
  voteBannerText: '#B45309',
  voteBannerHighlight: '#FCD34D',

  // Gradient blobs
  blobPrimary: '#A78BFA',
  blobSecondary: '#C4B5FD',
};

export const Typography = {
  title: { fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radii = {
  card: 20,
  button: 50,
  full: 9999,
};

export const Shadows = {
  card: {
    shadowColor: Colors.shadowCard,
    shadowOpacity: 0.14 as number,
    shadowRadius: 16 as number,
    shadowOffset: { width: 0, height: 14 } as { width: number; height: number },
    elevation: 18 as number,
  },
};
