import { test, expect, env } from '../../support/fixtures.js';

// A-4 — Availability endpoints; no double-booking.
test.describe('A-4 availability', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-4 availability reads conform to spec @critical', async ({ api }) => {
    const { data, response } = await api.GET('/stylists/{stylistId}/availability', {
      params: { path: { stylistId: 'seed-stylist' } },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({
      path: '/stylists/{stylistId}/availability',
      method: 'get',
      status: 200,
    });
  });

  // [CONFIRM] concurrency guarantee. Booking the same slot twice must not both succeed.
  test('A-4 a slot cannot be booked twice @critical', async ({ clientSession }) => {
    const { makeApiClient } = await import('../../support/api-client.js');
    const asClient = makeApiClient(clientSession.token);
    const body = {
      stylistId: 'seed-stylist',
      serviceId: 'seed-service',
      slotStart: '2099-01-01T11:00:00Z',
    };
    const [first, second] = await Promise.all([
      asClient.POST('/bookings', { body }),
      asClient.POST('/bookings', { body }),
    ]);
    const statuses = [first.response.status, second.response.status].sort();
    // Exactly one wins (201); the other is rejected as a conflict (409).
    expect(statuses).toEqual([201, 409]);
  });
});
