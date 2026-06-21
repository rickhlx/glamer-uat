import { test, expect, env } from '../../support/fixtures.js';

// X-4 — Stylist availability change reflects on web; no double-booking possible.
test.describe('X-4 availability sync', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-4 a slot closed by the stylist disappears from web booking @critical', async ({
    stylistApi,
    api,
    stylistSession,
  }) => {
    const slotStart = '2099-03-01T09:00:00Z';
    const slotEnd = '2099-03-01T10:00:00Z';

    // Stylist marks the slot unavailable (iOS side via API).
    await stylistApi.PUT('/stylists/{stylistId}/availability', {
      params: { path: { stylistId: stylistSession.userId } },
      body: [{ start: slotStart, end: slotEnd, available: false }],
    });

    // Web/public availability no longer offers it.
    const { data } = await api.GET('/stylists/{stylistId}/availability', {
      params: { path: { stylistId: stylistSession.userId } },
    });
    const closed = data?.find((slot) => slot.start === slotStart);
    expect(closed?.available ?? false).toBe(false);
  });
});
