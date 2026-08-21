import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';

interface UiState {
  /** User-selected theme preference. Dark is the product default (spec §4.2). */
  theme: ThemeMode;
  /** Admin sidebar collapsed state. */
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        set({ theme: current === 'dark' ? 'light' : 'dark' });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    { name: 'mars-ui' },
  ),
);
