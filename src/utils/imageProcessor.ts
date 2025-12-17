/**
 * Image processing utility for logo uploads
 * Automatically resizes, converts, and compresses images
 */

const MAX_WIDTH = 600;
const MAX_HEIGHT = 200;
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.3;

export interface ProcessedImage {
  blob: Blob;
  fileName: string;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const url = URL.createObjectURL(file);
    img.src = url;
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if width exceeds max
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  // Scale down if height still exceeds max
  if (height > maxHeight) {
    const ratio = maxHeight / height;
    height = maxHeight;
    width = Math.round(width * ratio);
  }

  return { width, height };
}

/**
 * Draw image to canvas with optional white background
 */
function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  addBackground: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Add white background if requested (for transparent images)
  if (addBackground) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Convert canvas to blob with compression
 */
async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compress image by reducing quality until it's under the size limit
 */
async function compressToSize(
  canvas: HTMLCanvasElement,
  targetSize: number = MAX_FILE_SIZE,
  preferPng: boolean = false
): Promise<Blob> {
  // Try PNG first for logos (better for graphics with transparency)
  if (preferPng) {
    const pngBlob = await canvasToBlob(canvas, 'image/png');
    if (pngBlob.size <= targetSize) {
      return pngBlob;
    }
  }

  // Fall back to JPEG with progressive quality reduction
  let quality = 0.9;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

  while (blob.size > targetSize && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  return blob;
}

/**
 * Get file extension from blob type
 */
function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

/**
 * Check if file is an SVG
 */
function isSvg(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

/**
 * Process a logo image file
 * - Resizes to max 600x200
 * - Converts to PNG or JPEG
 * - Compresses to under 500KB
 */
export async function processLogoImage(file: File): Promise<ProcessedImage> {
  const originalSize = file.size;

  // SVG files don't need processing - pass through
  if (isSvg(file)) {
    return {
      blob: file,
      fileName: file.name,
      originalSize,
      processedSize: file.size,
      width: 0,
      height: 0,
    };
  }

  // Load the image
  const img = await loadImage(file);
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  // Calculate new dimensions
  const { width, height } = calculateDimensions(originalWidth, originalHeight);

  // Check if image is already small enough
  const needsResize = originalWidth > width || originalHeight > height;
  const needsCompression = file.size > MAX_FILE_SIZE;

  // If no processing needed and format is acceptable, return original
  if (!needsResize && !needsCompression && 
      (file.type === 'image/png' || file.type === 'image/jpeg')) {
    return {
      blob: file,
      fileName: file.name,
      originalSize,
      processedSize: file.size,
      width: originalWidth,
      height: originalHeight,
    };
  }

  // Draw to canvas (with white background for non-PNG inputs to handle transparency)
  const preferPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const canvas = drawToCanvas(img, width, height, !preferPng);

  // Compress to target size
  const blob = await compressToSize(canvas, MAX_FILE_SIZE, preferPng);

  // Generate filename
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const extension = getExtension(blob.type);
  const fileName = `${baseName}.${extension}`;

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  return {
    blob,
    fileName,
    originalSize,
    processedSize: blob.size,
    width,
    height,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
