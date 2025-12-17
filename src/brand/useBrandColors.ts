import { useBrand } from './BrandProvider';
import { SemanticColors } from './types';

export function useBrandColors(): SemanticColors {
  const brand = useBrand();
  const isDarkMode = document.documentElement.classList.contains('dark');
  return isDarkMode ? brand.semanticColors.dark : brand.semanticColors.light;
}
