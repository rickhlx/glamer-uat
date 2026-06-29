import { test, expect, env } from '../../support/fixtures.js';
import { bookIntoFreeSlot, cancelAppointment } from '../../support/booking.js';

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

  test('A-4 a slot cannot be booked twice @critical', async ({
    clientApi,
    api,
    serviceId,
    stylistLocationId,
  }) => {
    const inputs = { username: env.stylist.username, serviceId, locationId: stylistLocationId };
    const booking = await bookIntoFreeSlot(clientApi, api, inputs);

    // Booking the exact same slot again must be rejected.
    const second = await clientApi.POST('/appointments', {
      body: {
        username: inputs.username,
        services: [{ id: inputs.serviceId }],
        startTime: booking.startTime,
        locationType: 'at_stylist',
        locationId: inputs.locationId,
      },
    });
    // The second booking must be rejected with a clean 409 Conflict (F8 fixed
    // 2026-06-28 — was a 500 from the DB exclusion constraint).
    expect(second.response.status).toBe(409);

    await cancelAppointment(clientApi, booking.id);
  });
});
