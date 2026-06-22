import { test, expect, env } from '../../support/fixtures.js';

// X-4 — Stylist availability change reflects on public/web availability.
test.describe('X-4 availability sync', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-4 stylist availability edit is reflected publicly @critical', async ({
    stylistApi,
    api,
  }) => {
    // Stylist sets weekly hours (iOS side via API). Wall-clock times in their tz.
    // Set the full work week (not just one day) so this doesn't reduce the
    // availability other booking journeys depend on.
    const hours = [{ start: '09:00', end: '17:00' }];
    const updated = await stylistApi.PUT('/me/stylist/availability', {
      body: {
        timezone: 'America/New_York',
        monday: hours,
        tuesday: hours,
        wednesday: hours,
        thursday: hours,
        friday: hours,
      },
    });
    expect(updated.response.status).toBe(204); // 204 No Content per spec

    // Public availability reflects the stylist's hours: conforms and yields real slots.
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
    const { data, response } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: start, end_date: end },
      },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({
      path: '/stylists/{username}/availability',
      method: 'get',
      status: 200,
    });
    const totalSlots = (data?.availability ?? []).reduce((n, d) => n + d.slots.length, 0);
    expect(totalSlots).toBeGreaterThan(0);
  });
});
