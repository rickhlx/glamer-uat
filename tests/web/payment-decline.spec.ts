import { test, expect, env } from '../../support/fixtures.js';

// C-4 — Payment decline handling (principle 9: unhappy paths).
test.describe('C-4 payment decline', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-4 a declined card shows an error and creates no booking @critical', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/stylists');
    await page.getByRole('link', { name: /book/i }).first().click();
    await page.getByRole('button', { name: /select/i }).first().click();
    await page.getByRole('button', { name: /available/i }).first().click();

    // [CONFIRM] payment UI for the cart/checkout flow and how to enter an
    // always-declines test card (likely a Stripe/PSP test card in the iframe).
    await page.getByRole('button', { name: /confirm|pay|book|checkout/i }).click();

    await expect(page.getByText(/declined|payment failed/i)).toBeVisible();
    await expect(page.getByText(/requested|confirmed/i)).toHaveCount(0);
  });
});
