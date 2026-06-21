import { test as base, expect } from '@playwright/test';
import './schema.js'; // registers the toMatchSpec matcher
import { env } from './env.js';
import { makeApiClient, type GlamerClient } from './api-client.js';
import { loginAsClient, loginAsStylist, type Session } from './auth.js';

/**
 * Shared fixtures. Tests own their data and lean on these for setup
 * (principle 6). Add per-test teardown here as flows that create entities
 * (bookings, etc.) are implemented.
 */
interface GlamerFixtures {
  /** Anonymous typed API client. */
  api: GlamerClient;
  /** Authenticated session for the test client (web/booking flows). */
  clientSession: Session;
  /** Authenticated session for the test stylist (drives the iOS side of cross-surface flows via API). */
  stylistSession: Session;
  /** Typed API client authenticated as the stylist. */
  stylistApi: GlamerClient;
}

export const test = base.extend<GlamerFixtures>({
  api: async ({}, use) => {
    await use(makeApiClient());
  },
  clientSession: async ({}, use) => {
    await use(await loginAsClient());
  },
  stylistSession: async ({}, use) => {
    await use(await loginAsStylist());
  },
  stylistApi: async ({ stylistSession }, use) => {
    await use(makeApiClient(stylistSession.token));
  },
});

export { expect, env };
