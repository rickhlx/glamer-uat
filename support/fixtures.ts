import { test as base, expect } from '@playwright/test';
import './schema.js'; // registers the toMatchSpec matcher
import { env } from './env.js';
import { makeApiClient, type GlamerClient } from './api-client.js';
import { clientApi as makeClientApi, stylistApi as makeStylistApi } from './auth.js';
import {
  firstServiceId,
  firstAvailableSlotStart,
  firstStylistLocationId,
} from './discovery.js';

/**
 * Shared fixtures. Tests own their data and lean on these for setup
 * (principle 6). Add per-test teardown here as flows that create entities
 * (appointments, etc.) are implemented.
 */
interface GlamerFixtures {
  /** Anonymous typed API client (public endpoints). */
  api: GlamerClient;
  /** Typed API client authenticated as the test client (booking flows). */
  clientApi: GlamerClient;
  /** Typed API client authenticated as the test stylist (drives the iOS side of cross-surface flows via API). */
  stylistApi: GlamerClient;
  /** A real bookable service id, discovered from the test stylist's services. */
  serviceId: string;
  /** ISO start time of a real available slot for the test stylist. */
  slotStart: string;
  /** The stylist's bookable business location id (for at_stylist bookings). */
  stylistLocationId: string;
}

export const test = base.extend<GlamerFixtures>({
  api: async ({}, use) => {
    await use(makeApiClient());
  },
  clientApi: async ({}, use) => {
    await use(await makeClientApi());
  },
  stylistApi: async ({}, use) => {
    await use(await makeStylistApi());
  },
  serviceId: async ({ stylistApi }, use) => {
    await use(await firstServiceId(stylistApi));
  },
  slotStart: async ({ api }, use) => {
    await use(await firstAvailableSlotStart(api, env.stylist.username));
  },
  stylistLocationId: async ({ stylistApi }, use) => {
    await use(await firstStylistLocationId(stylistApi));
  },
});

export { expect, env };
