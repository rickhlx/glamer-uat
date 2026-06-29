import { test, expect, env } from '../../support/fixtures.js';
import { bookIntoFreeSlot } from '../../support/booking.js';

// X-2 — Stylist declines a request.
test.describe('X-2 stylist declines', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-2 stylist decline cancels the appointment @critical', async ({
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

    const declined = await stylistApi.POST('/appointments/{id}/decline', {
      params: { path: { id: booking.id } },
      body: { reason: 'UAT decline' },
    });
    expect(declined.response.status).toBe(200);
    expect(declined.data?.status).toBe('canceled_by_stylist');
  });

  test('X-2 a declined slot is released @critical', async ({
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
    await stylistApi.POST('/appointments/{id}/decline', {
      params: { path: { id: booking.id } },
      body: { reason: 'UAT decline' },
    });

    const slotDate = booking.startTime.slice(0, 10);
    const { data } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: slotDate, end_date: slotDate },
      },
    });
    const day = data?.availability.find((d) => d.date === slotDate);
    expect(day?.slots.some((s) => s.start === booking.startTime)).toBe(true);
  });
});
