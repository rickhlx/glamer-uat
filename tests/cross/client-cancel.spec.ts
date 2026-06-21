import { test, expect, env } from '../../support/fixtures.js';

// X-3 — Client cancels a booking → stylist sees it, schedule frees up.
test.describe('X-3 client cancels booking', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-3 cancellation propagates to the stylist @critical', async ({
    clientApi,
    stylistApi,
    serviceId,
    slotStart,
    stylistLocationId,
  }) => {
    // Client books then cancels (DELETE /appointments/{id} is the client cancel).
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

    const cancelled = await clientApi.DELETE('/appointments/{id}', {
      params: { path: { id } },
    });
    expect(cancelled.response.status).toBe(200);

    // Stylist sees the cancellation (iOS side via API).
    const seen = await stylistApi.GET('/appointments/{id}', {
      params: { path: { id } },
    });
    expect(seen.data?.status).toBe('canceled_by_client');
  });
});
