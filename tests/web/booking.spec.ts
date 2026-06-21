import { test, expect, env } from '../../support/fixtures.js';

// C-3 — Book an appointment (the client side of the X-1 crown-jewel journey).
// Selectors are placeholders; replace once the web app is available.
test.describe('C-3 book an appointment', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-3 client books an available slot and sees confirmation @critical', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Discover a stylist (C-2) → pick a service → pick an available slot.
    await page.goto('/stylists');
    await page.getByRole('link', { name: /book/i }).first().click();
    await page.getByRole('button', { name: /select/i }).first().click(); // service
    await page.getByRole('button', { name: /available/i }).first().click(); // slot

    // Confirm + pay. [CONFIRM] payment UI (hosted fields vs. redirect).
    await page.getByRole('button', { name: /confirm|pay|book/i }).click();

    // Success state shows a requested/confirmed booking.
    await expect(page.getByText(/booking (requested|confirmed)/i)).toBeVisible();
  });
});
