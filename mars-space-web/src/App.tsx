import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { I18nProvider } from '@/app/providers/I18nProvider';
import { router } from '@/app/router';

/** App composition root: providers + the data router (spec §3/§5). */
export function App() {
  return (
    <HelmetProvider>
      <I18nProvider>
        <QueryProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                classNames: { toast: 'border border-hairline bg-basalt text-ice' },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </I18nProvider>
    </HelmetProvider>
  );
}
