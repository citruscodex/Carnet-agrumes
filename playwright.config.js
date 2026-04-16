// @ts-check
import { defineConfig, devices } from 'playwright/test';

/**
 * Playwright config — tests visuels CitrusCodex PWA
 * Cible : npm run dev (port 5173) avec IS_LOCAL=true (mock backend)
 * Run : npx playwright test
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // IS_LOCAL injecte la session dev automatiquement
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Lance `npm run dev` si pas déjà en cours
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
