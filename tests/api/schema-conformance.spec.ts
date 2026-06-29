import { test, expect, env } from '../../support/fixtures.js';
import { bookIntoFreeSlot, cancelAppointment } from '../../support/booking.js';

// A-5 — Schema & error-shape conformance. Most A-5 coverage is implicit:
// every toMatchSpec(...) across the suite *is* an A-5 assertion. These tests
// add explicit sweeps over read endpoints.
test.describe('A-5 schema conformance', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-5 stylist search conforms to spec @critical', async ({ api }) => {
    const { data, response } = await api.GET('/stylists');
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({ path: '/stylists', method: 'get', status: 200 });
  });

  test('A-5 booking response conforms to spec @critical', async ({
    clientApi,
    api,
    serviceId,
    stylistLocationId,
  }) => {
    const booking = await bookIntoFreeSlot(clientApi, api, {
      username: env.stylist.username,
      serviceId,
      locationId: stylistLocationId,
    });
    try {
      expect(booking.appointment).toMatchSpec({
        path: '/appointments',
        method: 'post',
        status: 201,
      });
    } finally {
      await cancelAppointment(clientApi, booking.id);
    }
  });

  test('A-5 /me/appointments returns an empty array for a user with no appointments @important', async ({
    stylistApi,
  }) => {
    // F15 (glamer-backend#438) — fixed 2026-06-28: the empty result now returns
    // 200 with `data: []` (was `null`). Status was already correct for our accounts.
    const { data, response } = await stylistApi.GET('/me/appointments');
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.data), 'data must be an array, not null').toBe(true);
  });

  test('A-5 a missing stylist returns the spec error shape @important', async ({ api }) => {
    const { error, response } = await api.GET('/stylists/{username}', {
      params: { path: { username: 'does-not-exist-xyz' } },
    });
    expect(response.status).toBe(404);
    expect(error).toMatchSpec({ path: '/stylists/{username}', method: 'get', status: 404 });
  });

  test('A-5 the public profile exposes a conforming workLocations[] @critical', async ({
    api,
  }) => {
    // The spec's new guest-booking enrichment: workLocations[] with a locationId
    // to pass to POST /carts. Assert it directly (the full-profile conformance is
    // tracked separately under F13).
    const { data, response } = await api.GET('/stylists/{username}', {
      params: { path: { username: env.stylist.username } },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.workLocations)).toBe(true);
    for (const wl of data?.workLocations ?? []) {
      expect(typeof wl.id).toBe('string');
      if (wl.locationId !== undefined) expect(typeof wl.locationId).toBe('string');
    }
  });

  test('A-5 the full public profile conforms to spec @important', async ({ api }) => {
    // F13 (contact.Social null→[]) is fixed. The response still fails the 200
    // `oneOf: [StylistPublicResponse, StylistAuthenticatedResponse]` with "must match
    // exactly one schema in oneOf" — the two variants overlap (no discriminator), so
    // a public response matches both/neither. Spec-side fix (discriminator, or a
    // single response schema). See docs/findings.md#f16. workLocations[] conforms (above).
    test.fail();
    const { data, response } = await api.GET('/stylists/{username}', {
      params: { path: { username: env.stylist.username } },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({ path: '/stylists/{username}', method: 'get', status: 200 });
  });

  test('A-5 guest cart create & read conform to spec @important', async ({ api }) => {
    const created = await api.POST('/carts', {
      body: { stylistUsername: env.stylist.username, locationType: 'at_stylist' },
    });
    expect(created.response.status).toBe(201);
    expect(created.data).toMatchSpec({ path: '/carts', method: 'post', status: 201 });

    const sessionId = created.data?.sessionId ?? undefined;
    const { data, response } = await api.GET('/carts/{id}', {
      params: {
        path: { id: created.data!.id },
        query: sessionId ? { session_id: sessionId } : {},
      },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({ path: '/carts/{id}', method: 'get', status: 200 });
  });
});
