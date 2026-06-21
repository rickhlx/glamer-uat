import { test, expect, env } from '../../support/fixtures.js';

// C-1 — Sign up / sign in (web client). Selectors are placeholders; replace with
// real ones (prefer getByRole / data-testid) once the web app is available.
test.describe('C-1 client sign in', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-1 valid credentials sign the client in @critical', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill(env.client.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(account|bookings|home)/);
  });

  test('C-1 invalid credentials show an error and do not sign in @important', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(env.client.email);
    await page.getByLabel(/password/i).fill('definitely-wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
