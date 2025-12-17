import { BrandConfig, BrandColors } from './types';

const defaultLightColors: BrandColors = {
  background: '169 56% 88%',
  foreground: '222 47% 11%',
  card: '0 0% 100%',
  cardForeground: '222 47% 11%',
  popover: '0 0% 100%',
  popoverForeground: '222 47% 11%',
  primary: '211 100% 45%',
  primaryForeground: '210 40% 98%',
  secondary: '199 89% 48%',
  secondaryForeground: '210 40% 98%',
  muted: '220 14% 96%',
  mutedForeground: '225 12% 45%',
  accent: '211 100% 45%',
  accentForeground: '210 40% 98%',
  destructive: '0 84% 60%',
  destructiveForeground: '210 40% 98%',
  border: '220 13% 91%',
  input: '220 13% 91%',
  ring: '211 100% 45%',
  sidebarBackground: '169 56% 88%',
  sidebarForeground: '222 47% 11%',
  sidebarPrimary: '211 100% 45%',
  sidebarPrimaryForeground: '210 40% 98%',
  sidebarAccent: '220 14% 96%',
  sidebarAccentForeground: '222 47% 11%',
  sidebarBorder: '220 13% 91%',
  sidebarRing: '211 100% 45%',
  header: '169 56% 73%',
};

const defaultDarkColors: BrandColors = {
  background: '224 72% 13%',
  foreground: '210 40% 98%',
  card: '224 72% 13%',
  cardForeground: '210 40% 98%',
  popover: '224 72% 13%',
  popoverForeground: '210 40% 98%',
  primary: '211 100% 45%',
  primaryForeground: '210 40% 98%',
  secondary: '201 96% 32%',
  secondaryForeground: '210 40% 98%',
  muted: '223 47% 19%',
  mutedForeground: '215 20% 65%',
  accent: '223 47% 19%',
  accentForeground: '210 40% 98%',
  destructive: '0 62% 30%',
  destructiveForeground: '210 40% 98%',
  border: '223 47% 19%',
  input: '223 47% 19%',
  ring: '211 100% 45%',
  sidebarBackground: '224 72% 13%',
  sidebarForeground: '210 40% 98%',
  sidebarPrimary: '211 100% 45%',
  sidebarPrimaryForeground: '210 40% 98%',
  sidebarAccent: '223 47% 19%',
  sidebarAccentForeground: '210 40% 98%',
  sidebarBorder: '223 47% 19%',
  sidebarRing: '211 100% 45%',
  header: '169 56% 73%',
};

export const defaultBrand: BrandConfig = {
  id: 'dootsons',
  name: 'Dootsons',
  domains: [], // Default fallback for unmatched domains
  logoUrl: '/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png',
  colors: {
    light: defaultLightColors,
    dark: defaultDarkColors,
  },
};

// Fergi brand - coral (#fa4659) and dark (#202020)
const fergiLightColors: BrandColors = {
  ...defaultLightColors,
  background: '0 0% 98%',
  foreground: '0 0% 13%',
  primary: '353 94% 63%',
  primaryForeground: '0 0% 100%',
  secondary: '353 80% 50%',
  secondaryForeground: '0 0% 100%',
  accent: '353 94% 63%',
  accentForeground: '0 0% 100%',
  ring: '353 94% 63%',
  sidebarBackground: '0 0% 98%',
  sidebarForeground: '0 0% 13%',
  sidebarPrimary: '353 94% 63%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarRing: '353 94% 63%',
  header: '353 94% 63%',
};

const fergiDarkColors: BrandColors = {
  ...defaultDarkColors,
  background: '0 0% 10%',
  foreground: '0 0% 95%',
  primary: '353 94% 63%',
  primaryForeground: '0 0% 100%',
  secondary: '353 70% 45%',
  secondaryForeground: '0 0% 100%',
  accent: '353 70% 30%',
  accentForeground: '0 0% 100%',
  ring: '353 94% 63%',
  sidebarPrimary: '353 94% 63%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarRing: '353 94% 63%',
  header: '353 70% 35%',
};

export const fergiBrand: BrandConfig = {
  id: 'fergi',
  name: 'Fergi',
  domains: ['fergi.app', 'www.fergi.app'],
  logoUrl: '/fergi-logo.png',
  colors: {
    light: fergiLightColors,
    dark: fergiDarkColors,
  },
};

export const brands: BrandConfig[] = [fergiBrand, defaultBrand];
