import { test, expect, env } from '../../support/fixtures.js';

// C-6 — Cancel a booking (client side of X-3).
test.describe('C-6 cancel a booking', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-6 client cancels an upcoming booking @critical', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/bookings');
    await page.getByRole('button', { name: /cancel/i }).first().click();
    // [CONFIRM] confirmation dialog copy / refund-policy notice.
    await page.getByRole('button', { name: /confirm/i }).click();

    await expect(page.getByText(/cancelled/i)).toBeVisible();
  });
});
