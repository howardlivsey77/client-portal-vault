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

// Update page title
function updatePageTitle(title: string): void {
  document.title = title;
}

// Update meta tags dynamically
function updateMetaTags(brand: BrandConfig): void {
  // Update description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', brand.tagline);

  // Update OG tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', brand.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', brand.tagline);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && brand.faviconUrl) ogImage.setAttribute('content', brand.faviconUrl);

  // Update Twitter tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', brand.title);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', brand.tagline);

  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage && brand.faviconUrl) twitterImage.setAttribute('content', brand.faviconUrl);

  // Update author
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) authorMeta.setAttribute('content', brand.name);
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

    // Update page title
    updatePageTitle(brand.title);

    // Update meta tags
    updateMetaTags(brand);
    
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
