import { useEffect, useRef } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';

/**
 * Blocks in-app navigation and browser unload while a form has unsaved changes
 * (spec §6.4). Returns the blocker plus `allow()` — call it right before a
 * programmatic navigation after a successful save so the guard doesn't block it
 * (the form is still technically dirty at that instant).
 */
export function useUnsavedGuard(isDirty: boolean): { blocker: Blocker; allow: () => void } {
  const isDirtyRef = useRef(isDirty);
  const bypassRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirtyRef.current && !bypassRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return { blocker, allow: () => (bypassRef.current = true) };
}
