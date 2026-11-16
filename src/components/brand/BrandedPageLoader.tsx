import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import './BrandedPageLoader.css';

type BrandedLoadingContextValue = {
  setSuspensePending: (pending: boolean) => void;
};

const BrandedLoadingContext = createContext<BrandedLoadingContextValue | null>(null);

/**
 * One shared brand overlay for route changes and genuinely pending lazy pages.
 * Route changes show it briefly; Suspense keeps it visible for as long as a
 * destination page's JavaScript chunk is still loading.
 */
export function BrandedPageLoaderProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const [routePending, setRoutePending] = useState(false);
  const [suspensePending, setSuspensePendingState] = useState(false);

  const setSuspensePending = useCallback((pending: boolean) => {
    setSuspensePendingState(pending);
  }, []);
  const contextValue = useMemo(() => ({ setSuspensePending }), [setSuspensePending]);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;

    previousPath.current = location.pathname;
    setRoutePending(true);

    const timeout = window.setTimeout(() => setRoutePending(false), 320);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <BrandedLoadingContext.Provider value={contextValue}>
      {children}
      {(routePending || suspensePending) && <BrandedPageLoaderView />}
    </BrandedLoadingContext.Provider>
  );
}

/** Suspense signal; the provider owns the single visible overlay. */
export function BrandedPageLoaderFallback() {
  const context = useContext(BrandedLoadingContext);

  if (!context) {
    throw new Error('BrandedPageLoaderFallback must be rendered inside BrandedPageLoaderProvider.');
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => context.setSuspensePending(true), 120);
    return () => {
      window.clearTimeout(timeout);
      context.setSuspensePending(false);
    };
  }, [context]);

  return null;
}

function BrandedPageLoaderView() {
  return (
    <div className="sc-branded-page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="sc-branded-page-loader__content">
        <img
          src="/sophia-central-logo.png"
          alt="Sophis Central"
          className="sc-branded-page-loader__logo"
          decoding="async"
        />
        <div className="sc-branded-page-loader__progress" aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Loading page…</span>
      </div>
    </div>
  );
}
