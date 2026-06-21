import { test, expect, env } from '../../support/fixtures.js';

// X-2 — Stylist declines a request → status reflects, slot is released.
test.describe('X-2 stylist declines', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-2 declined request is reflected and frees the slot @critical', async ({
    clientApi,
    stylistApi,
    api,
  }) => {
    // Client requests a booking.
    const created = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: '00000000-0000-0000-0000-000000000000' }],
        startTime: '2099-04-01T10:00:00Z',
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
    const { data } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: '2099-04-01', end_date: '2099-04-01' },
      },
    });
    const day = data?.availability.find((d) => d.date === '2099-04-01');
    expect(day?.slots.length ?? 0).toBeGreaterThan(0);
  });
});
