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

// Fergi brand - customize colors here
const fergiLightColors: BrandColors = {
  ...defaultLightColors,
  // Override with Fergi-specific colors
  background: '220 20% 97%',
  foreground: '220 30% 15%',
  primary: '280 70% 50%',
  primaryForeground: '0 0% 100%',
  secondary: '280 50% 60%',
  secondaryForeground: '0 0% 100%',
  accent: '280 70% 50%',
  accentForeground: '0 0% 100%',
  ring: '280 70% 50%',
  sidebarBackground: '220 20% 97%',
  sidebarForeground: '220 30% 15%',
  sidebarPrimary: '280 70% 50%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarRing: '280 70% 50%',
  header: '280 60% 85%',
};

const fergiDarkColors: BrandColors = {
  ...defaultDarkColors,
  // Override with Fergi-specific dark colors
  primary: '280 70% 60%',
  primaryForeground: '0 0% 100%',
  secondary: '280 50% 40%',
  secondaryForeground: '0 0% 100%',
  accent: '280 50% 25%',
  accentForeground: '0 0% 100%',
  ring: '280 70% 60%',
  sidebarPrimary: '280 70% 60%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarRing: '280 70% 60%',
  header: '280 40% 30%',
};

export const fergiBrand: BrandConfig = {
  id: 'fergi',
  name: 'Fergi',
  domains: ['fergi.app', 'www.fergi.app'],
  logoUrl: '/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png', // Replace with Fergi logo when available
  colors: {
    light: fergiLightColors,
    dark: fergiDarkColors,
  },
};

export const brands: BrandConfig[] = [fergiBrand, defaultBrand];
