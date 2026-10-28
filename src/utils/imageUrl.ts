/**
 * Utility to parse and format image URLs, with full robust support for Google Drive public links.
 */

export const DEFAULT_CANDIDATE_PHOTO =
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

/**
 * Extracts the Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/([a-zA-Z0-9_-]+)
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: [?&]id=([a-zA-Z0-9_-]+)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Pattern 3: googleusercontent.com/d/([a-zA-Z0-9_-]+)
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1];
  }

  // Pattern 4: /thumbnail?id=([a-zA-Z0-9_-]+)
  const thumbMatch = trimmed.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch && thumbMatch[1]) {
    return thumbMatch[1];
  }

  // Pattern 5: /d/([a-zA-Z0-9_-]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('googleusercontent.com')
  );
}

/**
 * Returns direct CDN image URL for any Google Drive link.
 * Using lh3.googleusercontent.com/d/{id} provides direct image streaming without HTML wrappers or cookies.
 */
export function formatCandidateImageUrl(url?: string | null): string {
  if (!url || !url.trim()) {
    return DEFAULT_CANDIDATE_PHOTO;
  }

  const trimmed = url.trim();

  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}

/**
 * Returns secondary fallback thumbnail URL for Google Drive.
 */
export function getGoogleDriveThumbnailUrl(url?: string | null): string | null {
  if (!url) return null;
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}
