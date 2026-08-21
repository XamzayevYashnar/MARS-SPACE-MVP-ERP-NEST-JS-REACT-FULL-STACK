import { useEffect, useState } from 'react';

/** Reactive media-query match. SSR-safe (returns false before mount). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on viewports below the md breakpoint (768px). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when the user prefers reduced motion (spec §4.6). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
