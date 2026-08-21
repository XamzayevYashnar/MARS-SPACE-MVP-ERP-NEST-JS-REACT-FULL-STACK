import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { adminHandlers } from './admin.handlers';

export const worker = setupWorker(...handlers, ...adminHandlers);

/** Start MSW when VITE_MOCK_API=true. Called from main.tsx before render. */
export async function startMockWorker() {
  await worker.start({
    onUnhandledRequest: 'bypass', // let fonts/assets through
    quiet: false,
  });
}
