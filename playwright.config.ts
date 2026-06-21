import { defineConfig, devices } from '@playwright/test';
import { env } from './support/env.js';

/**
 * Three projects map to the three test surfaces:
 *   api   — REST contract journeys (A-*), no browser
 *   web   — client booking journeys (C-*), real browser, phone-first viewport
 *   cross — cross-surface journeys (X-*), web + API together
 *
 * Severity gating is by title tag (@critical / @important); see test:critical.
 */
export default defineConfig({
  testDir: 'tests',
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
      use: { ...devices['Pixel 7'], baseURL: env.webBaseUrl },
    },
    {
      name: 'cross',
      testDir: 'tests/cross',
      use: { ...devices['Pixel 7'], baseURL: env.webBaseUrl },
    },
  ],
});
