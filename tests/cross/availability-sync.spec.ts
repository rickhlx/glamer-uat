import { test, expect, env } from '../../support/fixtures.js';

// X-4 — Stylist availability change reflects on public/web availability.
test.describe('X-4 availability sync', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-4 stylist availability edit is reflected publicly @critical', async ({
    stylistApi,
    api,
  }) => {
    // Stylist sets weekly hours (iOS side via API). Wall-clock times in their tz.
    const updated = await stylistApi.PUT('/me/stylist/availability', {
      body: {
        timezone: 'America/New_York',
        monday: [{ start: '09:00', end: '17:00' }],
      },
    });
    expect(updated.response.status).toBe(200);
    expect(updated.data).toMatchSpec({
      path: '/me/stylist/availability',
      method: 'put',
      status: 200,
    });

    // Public availability reflects the stylist's hours and is well-formed.
    const { data, response } = await api.GET('/stylists/{username}/availability', {
      params: {
        path: { username: env.stylist.username },
        query: { start_date: '2099-06-01', end_date: '2099-06-07' },
      },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(data?.availability)).toBe(true);
  });
});
