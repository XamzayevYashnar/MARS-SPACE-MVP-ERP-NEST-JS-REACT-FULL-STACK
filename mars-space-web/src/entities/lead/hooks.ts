import { useMutation } from '@tanstack/react-query';
import { leadApi } from './api';
import type { CreateLeadInput } from './types';

/** Public lead submission (spec §9). Success/error UX is handled by the form. */
export function useCreateLead() {
  return useMutation({
    mutationFn: (input: CreateLeadInput) => leadApi.create(input),
  });
}
