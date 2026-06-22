import { test, expect, env } from '../../support/fixtures.js';

// C-2 — Discover & view a stylist (web client). Search lists stylists; the
// public profile at /{username} shows services and a booking affordance.
test.describe('C-2 discover & view a stylist', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-2 the stylist search page lists professionals @critical', async ({
    page,
  }) => {
    await page.goto('/search/stylists');
    await expect(
      page.getByRole('heading', { name: /find stylists/i }),
    ).toBeVisible();
    await expect(page.getByText(/professionals found/i)).toBeVisible();
  });

  test('C-2 the test stylist profile shows a booking affordance @critical', async ({
    page,
  }) => {
    await page.goto(`/${env.stylist.username}`);
    // Public profile renders a "Book an Appointment" button (desktop widget +
    // mobile footer); at least one is present and visible.
    await expect(
      page.getByRole('button', { name: /book an appointment/i }).first(),
    ).toBeVisible();
  });
});
