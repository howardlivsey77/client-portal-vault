import { BrandConfig } from './types';
import { brands, defaultBrand } from './brands';

export function detectBrand(): BrandConfig {
  // Check for brand override via URL parameter (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const brandOverride = urlParams.get('brand');
  
  if (brandOverride) {
    const overrideBrand = brands.find(brand => brand.id === brandOverride);
    if (overrideBrand) {
      return overrideBrand;
    }
  }
  
  const hostname = window.location.hostname;
  
  // Find matching brand by domain
  const matchedBrand = brands.find(brand => 
    brand.domains.some(domain => hostname.includes(domain))
  );
  
  return matchedBrand || defaultBrand;
}
