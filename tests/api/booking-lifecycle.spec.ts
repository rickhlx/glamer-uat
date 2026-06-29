import { test, expect, env } from '../../support/fixtures.js';
import { availableSlotStarts, bookIntoFreeSlot, cancelAppointment } from '../../support/booking.js';

// A-3 — Booking lifecycle: the state machine must enforce valid transitions.
test.describe('A-3 appointment lifecycle', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-3 booking with an invalid location is rejected with 400 @important', async ({
    clientApi,
    serviceId,
  }) => {
    // F5 fixed 2026-06-28 — a missing/invalid location now returns 400, not 500.
    const [startTime] = await availableSlotStarts(clientApi, env.stylist.username);
    if (!startTime) throw new Error(`No slot for ${env.stylist.username} to probe F5.`);
    const { response } = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: serviceId }],
        startTime,
        locationType: 'at_stylist',
        locationId: '00000000-0000-0000-0000-000000000000',
      },
    });
    expect(response.status).toBe(400);
  });

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
