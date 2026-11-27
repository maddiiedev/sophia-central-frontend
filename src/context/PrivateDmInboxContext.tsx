import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { chatApi, type ChatInboxItem } from '../api/chat';
import { useAuth } from './AuthContext';

type InboxState = { ownerId: string | null; items: ChatInboxItem[] };
type PrivateDmInboxContextValue = {
  inbox: ChatInboxItem[];
  refreshInbox: () => Promise<ChatInboxItem[]>;
  eventVersion: number;
};

const PrivateDmInboxContext = createContext<PrivateDmInboxContextValue | null>(null);

export function PrivateDmInboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canUsePrivateDm = user?.role === 'student' || user?.role === 'lecturer';
  const [state, setState] = useState<InboxState>({ ownerId: null, items: [] });
  const [eventVersion, setEventVersion] = useState(0);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  const requestSequenceRef = useRef(0);
  const inFlightRef = useRef<{ ownerId: string; promise: Promise<ChatInboxItem[]> } | null>(null);
  currentUserIdRef.current = user?.id ?? null;

  const refreshInbox = useCallback(async () => {
    if (!user?.id || !canUsePrivateDm) {
      setState({ ownerId: user?.id ?? null, items: [] });
      return [];
    }

    const ownerId = user.id;
    if (inFlightRef.current?.ownerId === ownerId) {
      return inFlightRef.current.promise;
    }

    const sequence = ++requestSequenceRef.current;
    const request = chatApi.inbox()
      .then((result) => {
        const items = Array.isArray(result) ? result : [];

        // A delayed response from a previous account or an older request must never
        // overwrite the active account's inbox state.
        if (currentUserIdRef.current === ownerId && sequence === requestSequenceRef.current) {
          setState({ ownerId, items });
        }
        return items;
      })
      .finally(() => {
        if (inFlightRef.current?.promise === request) inFlightRef.current = null;
      });

    inFlightRef.current = { ownerId, promise: request };
    return request;
  }, [user?.id, canUsePrivateDm]);

  useEffect(() => {
    const ownerId = user?.id ?? null;
    requestSequenceRef.current += 1;
    setState({ ownerId, items: [] });

    if (!ownerId || !canUsePrivateDm) return;

    let active = true;
    let lastEventRefreshAt = 0;
    const refresh = () => {
      if (!active || document.visibilityState === 'hidden') return;
      const now = Date.now();
      // focus, pageshow and visibilitychange can fire together on browser restore.
      // Coalesce those lifecycle events instead of issuing duplicate inbox requests.
      if (now - lastEventRefreshAt < 750) return;
      lastEventRefreshAt = now;
      setEventVersion(version => version + 1);
      void refreshInbox().catch(() => {
        // The last successful inbox remains visible; foreground recovery and polling retry.
      });
    };

    const unsubscribe = chatApi.subscribe(refresh);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onOnline = () => refresh();
    const onPageShow = () => refresh();

    void refreshInbox().catch(() => undefined);
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id, canUsePrivateDm, refreshInbox]);

  const inbox = state.ownerId === user?.id ? state.items : [];
  const value = useMemo(() => ({ inbox, refreshInbox, eventVersion }), [inbox, refreshInbox, eventVersion]);

  return <PrivateDmInboxContext.Provider value={value}>{children}</PrivateDmInboxContext.Provider>;
}

export function usePrivateDmInbox() {
  const value = useContext(PrivateDmInboxContext);
  if (!value) throw new Error('usePrivateDmInbox must be used inside PrivateDmInboxProvider.');
  return value;
}
