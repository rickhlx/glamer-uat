import { test, expect, env } from '../../support/fixtures.js';
import { bookIntoFreeSlot, cancelAppointment } from '../../support/booking.js';

// A-6 — Payments. The real model uses an explicit mark-paid action (paymentStatus
// transitions toward captured). Self-contained: book → confirm → mark-paid.
// [CONFIRM] full charge/refund flow & cart checkout.
test.describe('A-6 payments', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-6 marking an appointment paid updates payment status @critical', async ({
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
    await stylistApi.POST('/appointments/{id}/confirm', { params: { path: { id: booking.id } } });

    // Stylist marks it paid.
    const { data, response } = await stylistApi.POST('/appointments/{id}/mark-paid', {
      params: { path: { id: booking.id } },
    });
    expect(response.status).toBe(200);
    expect(['authorized', 'captured']).toContain(data?.paymentStatus);

    await cancelAppointment(clientApi, booking.id);
  });
});
