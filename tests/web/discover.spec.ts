import { test, expect, env } from '../../support/fixtures.js';

// C-2 — Discover & view a stylist (web client). The public profile at
// /{username} shows services and a booking affordance.
//
// NOTE: the standalone stylist *listing* page (/search/stylists) was removed in
// the frontend restructure that moved the post-login landing to /appointments —
// the route now hard-404s (x-matched-path: /404). Clients reach stylists by
// profile link rather than a dedicated listing page, so the listing assertion was
// dropped. Re-add a listing test if/when a discovery index returns.
test.describe('C-2 discover & view a stylist', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

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
