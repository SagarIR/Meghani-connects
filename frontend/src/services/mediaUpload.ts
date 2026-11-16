/**
 * Client-side media upload service.
 * Interacts with /api/upload Route Handler, ensuring Cloudinary secrets
 * are NEVER exposed in browser code.
 */

export interface UploadResult {
  success: boolean;
  url: string;
  public_id?: string;
  provider?: string;
  error?: string;
}

export async function uploadWatchImage(
  file: File,
  folder = 'meghani-watches'
): Promise<UploadResult> {
  // Client-side format pre-validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select a JPEG, PNG, or WebP image.');
  }

  // Max 5MB pre-validation
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit. Please select an optimized image.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload timepiece photography');
  }

  return data;
}

