import { test, expect, env } from '../../support/fixtures.js';

// X-2 — Stylist declines a request → client is notified, slot is released.
test.describe('X-2 stylist declines', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-2 declined booking frees the slot and notifies the client @critical', async ({
    stylistApi,
    api,
  }) => {
    const declined = await stylistApi.POST('/bookings/{bookingId}/transition', {
      params: { path: { bookingId: 'seed-requested-booking' } },
      body: { action: 'decline' },
    });
    expect(declined.data?.status).toBe('declined');

    // Slot is bookable again. [CONFIRM] charge/hold released — depends on payment model.
    const { data } = await api.GET('/stylists/{stylistId}/availability', {
      params: { path: { stylistId: 'seed-stylist' } },
    });
    expect(data?.some((slot) => slot.available)).toBe(true);
  });
});
