import { useMutation } from '@tanstack/react-query';
import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';
import type { ContactFormValues } from './contact.schema';

export function useCreateContact() {
  return useMutation({
    mutationFn: (input: ContactFormValues) =>
      http.post<{ id: string }>(endpoints.contact, input),
  });
}
