import { test, expect, env } from '../../support/fixtures.js';
import { signInWeb, bookFirstAvailableViaWeb } from '../../support/web.js';

// C-3 — Book an appointment (the client side of the X-1 crown-jewel journey).
// The web flow is request-to-book: pick service → date/time → submit a request
// (no online payment; tax is "pay at location"). Success = "request sent".
test.describe('C-3 book an appointment', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');
  // Blocked: the booking-modal helper races the modal's server-action step
  // transitions and the shared server-side cart makes it flaky run-to-run.
  // Tracked in glamer-uat#1. Selectors are real; only the orchestration needs work.
  test.skip(true, 'Booking-modal helper needs transition-aware hardening — see glamer-uat#1.');

  test('C-3 client books an available slot and sees the request confirmation @critical', async ({
    page,
  }) => {
    await signInWeb(page);
    await bookFirstAvailableViaWeb(page, env.stylist.username);
    // bookFirstAvailableViaWeb already asserts the "Appointment Request Sent"
    // confirmation; assert the supporting copy too for a stronger signal.
    await expect(
      page.getByText(/your appointment request has been sent/i),
    ).toBeVisible();
  });
});
