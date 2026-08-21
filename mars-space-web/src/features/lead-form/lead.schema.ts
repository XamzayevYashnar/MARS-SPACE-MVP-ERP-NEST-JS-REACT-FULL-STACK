import { z } from 'zod';
import { phoneSchema } from '@/shared/validation/phone.schema';
import { nameSchema } from '@/shared/validation/primitives';

/** Lead form schema (spec §9). `website` is a honeypot — must stay empty. */
export const leadFormSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  courseId: z.string().optional(),
  message: z.string().max(1000).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
