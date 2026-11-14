import { useEffect, useRef, useState, type ReactNode } from 'react';
import { profileImageApi } from '../api/upload';

type ProfileImageProps = {
  userId?: string;
  reference?: string;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

/**
 * Resolves private R2 object references through the authenticated image endpoint.
 * A shared, session-scoped URL cache prevents repeated signed-URL requests as users
 * move between pages and lets the browser reuse the same image after a refresh.
 */
export function ProfileImage({ userId, reference, alt = '', className, fallback = null }: ProfileImageProps) {
  const [src, setSrc] = useState<string | null>(() => {
    if (!reference) return null;
    if (/^https?:\/\//i.test(reference)) return reference;
    return userId ? profileImageApi.getCachedUrl(userId) : null;
  });
  const hasRetried = useRef(false);

  useEffect(() => {
    hasRetried.current = false;
    if (!userId || !reference) {
      setSrc(reference && /^https?:\/\//i.test(reference) ? reference : null);
      return;
    }

    let active = true;
    const refresh = async () => {
      try {
        const result = await profileImageApi.getUrl(userId);
        if (active) setSrc(result.url);
      } catch {
        // Keep a previously cached image visible if the URL endpoint is temporarily unavailable.
        if (active && !profileImageApi.getCachedUrl(userId)) setSrc(null);
      }
    };

    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 12 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, reference]);

  const retryExpiredUrl = async () => {
    if (!userId || hasRetried.current) return;
    hasRetried.current = true;
    try {
      const result = await profileImageApi.getUrl(userId, { forceRefresh: true });
      if (result.url) setSrc(result.url);
    } catch {
      // Leave the account's initials/placeholder visible when refresh cannot complete.
    }
  };

  if (!src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} decoding="async" onError={() => { void retryExpiredUrl(); }} />;
}
