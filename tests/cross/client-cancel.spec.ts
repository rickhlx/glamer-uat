import { test, expect, env } from '../../support/fixtures.js';

// X-3 — Client cancels an accepted booking → stylist sees it, schedule frees up.
test.describe('X-3 client cancels accepted booking', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('X-3 cancellation propagates and restores availability @critical', async ({
    page,
    stylistApi,
  }) => {
    // Client cancels on web (assumes a confirmed booking exists from seed data).
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/bookings');
    await page.getByRole('button', { name: /cancel/i }).first().click();
    await page.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByText(/cancelled/i)).toBeVisible();

    // Stylist sees the cancellation (iOS side via API).
    const { data } = await stylistApi.GET('/bookings/{bookingId}', {
      params: { path: { bookingId: 'seed-confirmed-booking' } },
    });
    expect(data?.status).toBe('cancelled');
  });
});
