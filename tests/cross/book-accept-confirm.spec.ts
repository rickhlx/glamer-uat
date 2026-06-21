import { test, expect, env } from '../../support/fixtures.js';

// X-1 — Book → notify → accept → confirm. The crown-jewel journey: a client
// books on web; the stylist accepts (we drive the iOS side via the API, since
// iOS is manual); the client sees the booking confirmed.
test.describe('X-1 book → accept → confirm', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-1 web booking is accepted by the stylist and shows confirmed @critical', async ({
    page,
    stylistApi,
  }) => {
    // 1) Client books on web.
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/stylists');
    await page.getByRole('link', { name: /book/i }).first().click();
    await page.getByRole('button', { name: /select/i }).first().click();
    await page.getByRole('button', { name: /available/i }).first().click();
    await page.getByRole('button', { name: /confirm|pay|book/i }).click();
    await expect(page.getByText(/booking requested/i)).toBeVisible();

    // 2) Stylist accepts (iOS side, driven via API).
    // [CONFIRM] how to discover the just-created booking id — likely a stylist
    // "pending requests" endpoint. Placeholder uses a seed id.
    const accepted = await stylistApi.POST('/bookings/{bookingId}/transition', {
      params: { path: { bookingId: 'most-recent-request' } },
      body: { action: 'accept' },
    });
    expect(accepted.data?.status).toBe('accepted');

    // 3) Client sees it confirmed on web. State is consistent across surfaces.
    await page.goto('/bookings');
    await expect(page.getByText(/confirmed/i)).toBeVisible();
  });
});
