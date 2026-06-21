import { test, expect, env } from '../../support/fixtures.js';

// X-2 — Stylist declines a request → status reflects, slot is released.
test.describe('X-2 stylist declines', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-2 declined request is reflected and frees the slot @critical', async ({
    clientApi,
    stylistApi,
    api,
    serviceId,
    slotStart,
    stylistLocationId,
  }) => {
    // Client requests a booking.
    const created = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: serviceId }],
        startTime: slotStart,
        locationType: 'at_stylist',
        locationId: stylistLocationId,
      },
    });
    const id = created.data!.id;

    // Stylist declines.
    const declined = await stylistApi.POST('/appointments/{id}/decline', {
      params: { path: { id } },
      body: { reason: 'UAT decline' },
    });
    expect(declined.data?.status).toBe('canceled_by_stylist');

    // Slot is offered again. [CONFIRM] charge/hold released — depends on payment model.
    const slotDate = slotStart.slice(0, 10); // YYYY-MM-DD
    const { data } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: slotDate, end_date: slotDate },
      },
    });
    const day = data?.availability.find((d) => d.date === slotDate);
    expect(day?.slots.length ?? 0).toBeGreaterThan(0);
  });
});
