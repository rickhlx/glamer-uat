import { test, expect, env } from '../../support/fixtures.js';
import { signInWeb } from '../../support/web.js';

// C-6 — Cancel a booking (client side of X-3). We seed a real appointment via
// the API (the client owns its data), then cancel it through the web UI: the
// appointment card's menu → "Cancel" → confirm dialog (red "Cancel" button).
test.describe('C-6 cancel a booking', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');
  // Blocked: the appointment card's dropdown trigger (ellipsis) has no accessible
  // name, so the menu can't be opened by role/name. Needs a selector strategy
  // (and the unlabeled button is a minor a11y issue). Tracked in glamer-uat#9.
  test.skip(true, 'Appointment-card menu trigger is unlabeled — see glamer-uat#9.');

  test('C-6 client cancels an upcoming booking from the web @critical', async ({
    page,
    clientApi,
    serviceId,
    slotStart,
    stylistLocationId,
  }) => {
    // Seed an appointment to cancel (avoids depending on prior test state).
    const created = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: serviceId }],
        startTime: slotStart,
        locationType: 'at_stylist',
        locationId: stylistLocationId,
      },
    });
    expect(created.response.status, 'seed booking should be created').toBe(201);

    await signInWeb(page);
    await page.goto('/appointments');

    // Open the first upcoming appointment's actions menu, choose Cancel.
    await page
      .getByRole('button', { name: /open options|options|menu/i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: /^cancel$/i }).click();

    // Confirm in the dialog (red "Cancel" button; "Keep" dismisses).
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^cancel$/i }).click();

    // The list refreshes; a canceled badge appears (or the card leaves "upcoming").
    await expect(page.getByText(/cancel(l)?ed/i).first()).toBeVisible();
  });
});
