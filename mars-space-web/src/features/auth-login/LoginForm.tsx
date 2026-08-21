import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { Button, FormField, Input } from '@/shared/ui';
import { authApi, type LoginInput } from '@/shared/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import { emailSchema } from '@/shared/validation/primitives';
import { paths } from '@/app/router/paths';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'validation.required' }),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, user: data.user });
      const from = params.get('from');
      void navigate(from ?? paths.admin.dashboard, { replace: true });
    },
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    login.mutate(values);
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-sm border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
          {formError}
        </p>
      )}

      <FormField label={t('login.email')} required error={errors.email?.message}>
        {(field) => (
          <Input
            {...field}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="admin@marsspace.uz"
          />
        )}
      </FormField>

      <FormField label={t('login.password')} required error={errors.password?.message}>
        {(field) => (
          <div className="relative">
            <Input
              {...field}
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-dust hover:text-ice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
        {t('login.submit')}
      </Button>
    </form>
  );
}
