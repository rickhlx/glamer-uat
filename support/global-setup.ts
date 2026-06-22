import { request } from '@playwright/test';
import { env } from './env.js';

/**
 * Path where we persist the Vercel deployment-protection bypass cookie as a
 * Playwright storageState. The web/cross projects load it (see
 * playwright.config.ts) so their browser contexts start already authorized.
 */
export const VERCEL_BYPASS_STATE = 'test-results/.vercel-bypass-state.json';

/**
 * Mint the Vercel bypass cookie once before the suite runs. A single same-origin
 * request carrying the bypass header + `x-vercel-set-bypass-cookie` makes Vercel
 * respond with a bypass cookie scoped to the origin; we save it to a
 * storageState. Browser contexts then pass protection by *cookie*, so we never
 * attach the bypass header to third-party requests (Sentry, Google Maps) — which
 * would fail their CORS preflight and crash the client.
 *
 * No-op when no secret is configured (e.g. protection disabled, or API-only runs).
 */
export default async function globalSetup(): Promise<void> {
  if (!env.vercelBypassSecret) return;

  const ctx = await request.newContext();
  const res = await ctx.get(env.webBaseUrl, {
    headers: {
      'x-vercel-protection-bypass': env.vercelBypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    },
  });
  if (!res.ok()) {
    throw new Error(
      `Vercel bypass request failed (${res.status()}). Check VERCEL_AUTOMATION_BYPASS_SECRET.`,
    );
  }
  await ctx.storageState({ path: VERCEL_BYPASS_STATE });
  await ctx.dispose();
}
