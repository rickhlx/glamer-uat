import { defineConfig, devices } from '@playwright/test';
import { env } from './support/env.js';
import { VERCEL_BYPASS_STATE } from './support/global-setup.js';

// Web/cross contexts start from the bypass-cookie storageState when the secret
// is configured (minted in globalSetup); undefined otherwise.
const webStorageState = env.vercelBypassSecret ? VERCEL_BYPASS_STATE : undefined;

/**
 * Three projects map to the three test surfaces:
 *   api   — REST contract journeys (A-*), no browser
 *   web   — client booking journeys (C-*), real browser, phone-first viewport
 *   cross — cross-surface journeys (X-*), web + API together
 *
 * Severity gating is by title tag (@critical / @important); see test:critical.
 *
 * staging.glamer.so is behind Vercel deployment protection. We get past it with
 * a bypass *cookie* (minted once in globalSetup → storageState), NOT a
 * context-wide header — a header would be sent to third-party origins (Sentry,
 * Google Maps) too, failing their CORS preflight and crashing the client. Only
 * web/cross load the storageState; the api project stays browserless.
 */
export default defineConfig({
  testDir: 'tests',
  globalSetup: './support/global-setup.ts',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: 'tests/api',
      use: { baseURL: env.apiBaseUrl },
    },
    {
      name: 'web',
      testDir: 'tests/web',
      use: {
        ...devices['Pixel 7'],
        baseURL: env.webBaseUrl,
        storageState: webStorageState,
      },
    },
    {
      name: 'cross',
      testDir: 'tests/cross',
      use: {
        ...devices['Pixel 7'],
        baseURL: env.webBaseUrl,
        storageState: webStorageState,
      },
    },
  ],
});
