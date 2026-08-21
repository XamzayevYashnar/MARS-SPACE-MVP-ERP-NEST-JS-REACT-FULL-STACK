import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/shared/config/i18n';

/** Fresh QueryClient per render; retries off so error states surface fast. */
function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...rest } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={makeClient()}>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }
  return render(ui, { wrapper: Wrapper, ...rest });
}

export * from '@testing-library/react';
