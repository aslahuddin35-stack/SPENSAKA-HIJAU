import React, { useState, useEffect } from 'react';
import { 
  formatCandidateImageUrl, 
  getGoogleDriveThumbnailUrl, 
  DEFAULT_CANDIDATE_PHOTO 
} from '../../utils/imageUrl';

interface CandidatePhotoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photoUrl?: string | null;
  altText?: string;
  fallbackUrl?: string;
}

export const CandidatePhoto: React.FC<CandidatePhotoProps> = ({
  photoUrl,
  altText = 'Foto Pasangan Calon',
  fallbackUrl = DEFAULT_CANDIDATE_PHOTO,
  className,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => formatCandidateImageUrl(photoUrl));
  const [hasTriedThumbnail, setHasTriedThumbnail] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(formatCandidateImageUrl(photoUrl));
    setHasTriedThumbnail(false);
    setHasFailed(false);
  }, [photoUrl]);

  const handleError = () => {
    // If it was a Google Drive URL, attempt the thumbnail endpoint first
    const thumb = getGoogleDriveThumbnailUrl(photoUrl);
    if (thumb && !hasTriedThumbnail && currentSrc !== thumb) {
      setHasTriedThumbnail(true);
      setCurrentSrc(thumb);
    } else if (!hasFailed && currentSrc !== fallbackUrl) {
      setHasFailed(true);
      setCurrentSrc(fallbackUrl);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={altText}
      onError={handleError}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};
