import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandConfig, BrandColors } from './types';
import { detectBrand } from './detectBrand';

const BrandContext = createContext<BrandConfig | null>(null);

export function useBrand(): BrandConfig {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

// Convert camelCase to kebab-case for CSS variables
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Apply brand colors to CSS variables
function applyBrandColors(colors: BrandColors): void {
  const root = document.documentElement;
  
  const colorMapping: Record<keyof BrandColors, string> = {
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    popover: '--popover',
    popoverForeground: '--popover-foreground',
    primary: '--primary',
    primaryForeground: '--primary-foreground',
    secondary: '--secondary',
    secondaryForeground: '--secondary-foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    accent: '--accent',
    accentForeground: '--accent-foreground',
    destructive: '--destructive',
    destructiveForeground: '--destructive-foreground',
    border: '--border',
    input: '--input',
    ring: '--ring',
    sidebarBackground: '--sidebar-background',
    sidebarForeground: '--sidebar-foreground',
    sidebarPrimary: '--sidebar-primary',
    sidebarPrimaryForeground: '--sidebar-primary-foreground',
    sidebarAccent: '--sidebar-accent',
    sidebarAccentForeground: '--sidebar-accent-foreground',
    sidebarBorder: '--sidebar-border',
    sidebarRing: '--sidebar-ring',
    header: '--header',
  };

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = colorMapping[key as keyof BrandColors];
    if (cssVar) {
      root.style.setProperty(cssVar, value);
    }
  });
}

// Update favicon dynamically
function updateFavicon(faviconUrl: string): void {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}

interface BrandProviderProps {
  children: React.ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const [brand] = useState<BrandConfig>(() => detectBrand());

  useEffect(() => {
    // Determine if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    const colors = isDarkMode ? brand.colors.dark : brand.colors.light;
    
    // Apply brand colors
    applyBrandColors(colors);
    
    // Update favicon if specified
    if (brand.faviconUrl) {
      updateFavicon(brand.faviconUrl);
    }

    // Listen for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          applyBrandColors(isDark ? brand.colors.dark : brand.colors.light);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [brand]);

  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
}
