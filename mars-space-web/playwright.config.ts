import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Runs against the app in MOCK_API mode so the flows are
 * self-contained (no backend needed). First run: `pnpm exec playwright install`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_MOCK_API: 'true' },
    timeout: 120_000,
  },
});
