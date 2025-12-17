import { BrandConfig } from './types';
import { brands, defaultBrand } from './brands';

export function detectBrand(): BrandConfig {
  const hostname = window.location.hostname;
  
  // Find matching brand by domain
  const matchedBrand = brands.find(brand => 
    brand.domains.some(domain => hostname.includes(domain))
  );
  
  return matchedBrand || defaultBrand;
}
