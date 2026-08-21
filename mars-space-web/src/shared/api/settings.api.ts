import { useQuery } from '@tanstack/react-query';
import { http } from './axios-instance';
import { endpoints } from './endpoints';
import { queryKeys } from './query-keys';
import { STALE_TIME } from '@/shared/config/constants';
import type { SettingsBundle } from '@/shared/types/settings.types';

export const settingsApi = {
  bundle: () => http.get<SettingsBundle>(endpoints.settings),
};

/** Site-wide settings (contacts, socials, hero stats, SEO defaults). */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.bundle(),
    queryFn: () => settingsApi.bundle(),
    staleTime: STALE_TIME.publicContent,
  });
}
