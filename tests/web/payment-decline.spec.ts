import { test } from '../../support/fixtures.js';

// C-4 — Payment decline handling.
//
// NOT APPLICABLE to the current web client. The web booking flow is
// request-to-book: the client submits an appointment *request* ("Request
// Appointment") with no card entry — the summary shows tax as "Pay at location"
// and there is no checkout/PSP step in the UI (verified in glamer-frontend
// components/features/booking/booking-summary-form.tsx). With no online payment
// in the web journey, there is no decline path to exercise here.
//
// Where payment/decline behavior lives instead:
//   • API: cart checkout + paymentStatus transitions — covered under A-6.
//   • If/when the web client adds online payment (hosted fields / redirect),
//     re-introduce this as a real decline test.
test.describe('C-4 payment decline (web)', () => {
  test.skip(true, 'Web booking is request-to-book (pay at location); no web payment UI to decline. See A-6 for payment-side coverage.');

  test('C-4 declined card shows an error and creates no booking @critical', async () => {
    // Intentionally empty — kept as a named placeholder so the journey is
    // visible in the report as explicitly skipped, not silently missing.
  });
});
