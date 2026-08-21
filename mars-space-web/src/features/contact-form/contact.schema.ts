import { z } from 'zod';
import { phoneSchema } from '@/shared/validation/phone.schema';
import { nameSchema, optionalEmailSchema } from '@/shared/validation/primitives';

export const contactFormSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  subject: z.string().max(160).optional(),
  message: z.string().trim().min(10, { message: 'validation.message.min' }).max(2000),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
