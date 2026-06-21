import { test, expect, env } from '../../support/fixtures.js';

// A-4 — Availability endpoints; no double-booking.
test.describe('A-4 availability', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-4 public availability reads conform to spec @critical', async ({ api }) => {
    const { data, response } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: '2099-01-01', end_date: '2099-01-07' },
      },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({
      path: '/stylists/{username}/availability',
      method: 'get',
      status: 200,
    });
  });

  // [CONFIRM] concurrency guarantee. Booking the same slot twice must not both succeed.
  test('A-4 a slot cannot be booked twice @critical', async ({
    clientApi,
    serviceId,
    slotStart,
    stylistLocationId,
  }) => {
    const body = {
      username: env.stylist.username,
      services: [{ id: serviceId }],
      startTime: slotStart,
      locationType: 'at_stylist' as const,
      locationId: stylistLocationId,
    };
    const [first, second] = await Promise.all([
      clientApi.POST('/appointments', { body }),
      clientApi.POST('/appointments', { body }),
    ]);
    const statuses = [first.response.status, second.response.status].sort();
    // Exactly one wins (201); the other is rejected (conflict / bad request).
    expect(statuses[0]).toBe(201);
    expect([400, 409]).toContain(statuses[1]);
  });
});
