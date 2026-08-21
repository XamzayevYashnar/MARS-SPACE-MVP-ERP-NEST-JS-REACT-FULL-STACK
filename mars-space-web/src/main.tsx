import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { env } from './shared/config/env'; // validate env at startup (throws on invalid config)
import './app/styles/globals.css';
import { App } from './App';

async function enableMocking() {
  if (!env.VITE_MOCK_API) return;
  const { startMockWorker } = await import('./mocks/browser');
  await startMockWorker();
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

void enableMocking().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
