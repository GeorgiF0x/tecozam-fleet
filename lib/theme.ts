// ─── Color palette ────────────────────────────────────────────────────────────

export const colors = {
  // Brand
  primary: "#FF8B01",
  primaryHover: "#E67A00",

  // Backgrounds
  background: "#09090B",
  surface: "#18181B",
  surfaceElevated: "#27272A",

  // Borders
  border: "#27272A",
  borderStrong: "#3F3F46",

  // Text
  muted: "#18181B",
  mutedForeground: "#A1A1AA",
  foreground: "#FAFAFA",

  // Semantic
  success: "#22C55E",
  warning: "#FACC15",
  danger: "#EF4444",
  info: "#3B82F6",

  // Provider brands
  repsol: "#60A5FA",
  moeve: "#34D399",
} as const;

export type ColorKey = keyof typeof colors;

// ─── Spacing scale ────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type SpacingKey = keyof typeof spacing;

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
} as const;

export type RadiusKey = keyof typeof radius;

// ─── Font sizes ───────────────────────────────────────────────────────────────

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

export type FontSizeKey = keyof typeof fontSize;

// ─── Font weights ─────────────────────────────────────────────────────────────

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

// ─── Shadows (iOS + Android) ──────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Full theme object (convenience) ─────────────────────────────────────────

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadows,
} as const;

export type Theme = typeof theme;
