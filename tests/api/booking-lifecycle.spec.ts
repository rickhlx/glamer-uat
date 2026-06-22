import { test, expect, env } from '../../support/fixtures.js';
import { bookIntoFreeSlot, cancelAppointment } from '../../support/booking.js';

// A-3 — Booking lifecycle: the state machine must enforce valid transitions.
test.describe('A-3 appointment lifecycle', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-3 book → stylist confirm moves an appointment to confirmed @critical', async ({
    clientApi,
    stylistApi,
    api,
    serviceId,
    stylistLocationId,
  }) => {
    const booking = await bookIntoFreeSlot(clientApi, api, {
      username: env.stylist.username,
      serviceId,
      locationId: stylistLocationId,
    });
    expect(booking.status).toBe('requested');

    // Stylist confirms.
    const confirmed = await stylistApi.POST('/appointments/{id}/confirm', {
      params: { path: { id: booking.id } },
    });
    expect(confirmed.response.status).toBe(200);
    expect(confirmed.data?.status).toBe('confirmed');

    await cancelAppointment(clientApi, booking.id);
  });

  test('A-3 an invalid transition is rejected @critical', async ({
    clientApi,
    stylistApi,
    api,
    serviceId,
    stylistLocationId,
  }) => {
    // Book a real appointment (status: requested)...
    const booking = await bookIntoFreeSlot(clientApi, api, {
      username: env.stylist.username,
      serviceId,
      locationId: stylistLocationId,
    });

    // ...then attempt to complete it before it's confirmed — illegal transition.
    const { response } = await stylistApi.POST('/appointments/{id}/complete', {
      params: { path: { id: booking.id } },
    });
    expect([400, 409]).toContain(response.status);

    await cancelAppointment(clientApi, booking.id);
  });
});
