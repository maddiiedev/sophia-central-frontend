import { useEffect, useState, type ReactNode } from 'react';
import { profileImageApi } from '../api/upload';

type ProfileImageProps = {
  userId?: string;
  reference?: string;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

/**
 * Resolves legacy profile-image references into short-lived private-R2 URLs.
 * Refreshes before the 15-minute URL expiry while the component remains mounted.
 */
export function ProfileImage({ userId, reference, alt = '', className, fallback = null }: ProfileImageProps) {
  const [src, setSrc] = useState<string | null>(reference ?? null);

  useEffect(() => {
    if (!userId || !reference) {
      setSrc(reference ?? null);
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        const result = await profileImageApi.getUrl(userId);
        if (active) setSrc(result.url);
      } catch {
        // Keep the last usable URL if a refresh is temporarily unavailable.
        if (active) setSrc(current => current ?? reference);
      }
    };

    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 12 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, reference]);

  if (!src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} />;
}
