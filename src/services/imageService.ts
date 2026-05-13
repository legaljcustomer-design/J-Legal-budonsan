
/**
 * Image processing service for Admin CMS
 * Handles resizing and compression to WebP on the client side.
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export interface ProcessedImage {
  blob: Blob;
  base64: string; // Used for previews and GitHub API
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export const compressImage = async (
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    format = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              const base64data = reader.result as string;
              // Remove data:image/webp;base64, prefix for GitHub API
              const base64Pure = base64data.split(',')[1];

              resolve({
                blob,
                base64: base64Pure,
                originalSize: file.size,
                compressedSize: blob.size,
                width,
                height
              });
            };
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Format bytes to readable size
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
