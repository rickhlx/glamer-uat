import { test, expect, env } from '../../support/fixtures.js';

// A-3 — Booking lifecycle: the state machine must enforce valid transitions.
test.describe('A-3 booking lifecycle', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-3 create → accept moves a booking to accepted @critical', async ({
    clientSession,
    stylistApi,
  }) => {
    // Client requests a booking. (Concrete stylist/service/slot come from seed data.)
    const asClient = (await import('../../support/api-client.js')).makeApiClient(
      clientSession.token,
    );
    const created = await asClient.POST('/bookings', {
      body: { stylistId: 'seed-stylist', serviceId: 'seed-service', slotStart: '2099-01-01T10:00:00Z' },
    });
    expect(created.response.status).toBe(201);
    expect(created.data).toMatchSpec({ path: '/bookings', method: 'post', status: 201 });
    const bookingId = created.data!.id;

    // Stylist accepts.
    const accepted = await stylistApi.POST('/bookings/{bookingId}/transition', {
      params: { path: { bookingId } },
      body: { action: 'accept' },
    });
    expect(accepted.response.status).toBe(200);
    expect(accepted.data?.status).toBe('accepted');
  });

  test('A-3 invalid transition is rejected @critical', async ({ stylistApi }) => {
    // e.g. completing a booking that was never accepted.
    const { response } = await stylistApi.POST('/bookings/{bookingId}/transition', {
      params: { path: { bookingId: 'seed-requested-booking' } },
      body: { action: 'complete' },
    });
    expect(response.status).toBe(409);
  });
});
