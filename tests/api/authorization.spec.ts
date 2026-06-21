import { test, expect, env } from '../../support/fixtures.js';
import { makeApiClient } from '../../support/api-client.js';

// A-2 — Authorization boundaries (principle 9: permission boundaries).
test.describe('A-2 authorization boundaries', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-2 a client cannot set a stylist’s availability @critical', async ({
    clientSession,
  }) => {
    const asClient = makeApiClient(clientSession.token);
    const { response } = await asClient.PUT('/stylists/{stylistId}/availability', {
      params: { path: { stylistId: 'some-other-stylist' } },
      body: [],
    });
    expect(response.status).toBe(403);
  });

  test('A-2 a user cannot read a booking they are not part of @critical', async ({
    clientSession,
  }) => {
    const asClient = makeApiClient(clientSession.token);
    const { response } = await asClient.GET('/bookings/{bookingId}', {
      params: { path: { bookingId: 'not-mine' } },
    });
    expect([403, 404]).toContain(response.status);
  });
});
