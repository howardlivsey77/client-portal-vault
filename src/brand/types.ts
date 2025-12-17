export interface BrandColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  header: string;
}

export interface SemanticColors {
  success: string;
  successForeground: string;
  successLight: string;
  info: string;
  infoForeground: string;
  infoLight: string;
  warning: string;
  warningForeground: string;
  warningLight: string;
  positive: string;        // For positive values like net pay, earnings
  positiveForeground: string;
  positiveLight: string;
  current: string;         // For current selection indicators
  currentForeground: string;
  currentLight: string;
  chartColors: string[];
}

export interface BrandConfig {
  id: string;
  name: string;
  domains: string[];
  logoUrl: string;
  faviconUrl?: string;
  colors: {
    light: BrandColors;
    dark: BrandColors;
  };
  semanticColors: {
    light: SemanticColors;
    dark: SemanticColors;
  };
}
