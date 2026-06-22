import { test, expect, env } from '../../support/fixtures.js';
import { signInWeb, bookFirstAvailableViaWeb } from '../../support/web.js';

// X-1 — Book → notify → accept → confirm. The crown-jewel journey: a client
// books on web; the stylist accepts (we drive the iOS side via the API, since
// iOS is manual); the client sees the booking confirmed.
test.describe('X-1 book → confirm', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');
  // Web booking step is blocked on the booking-modal helper hardening (glamer-uat#1).
  test.skip(true, 'Web booking step blocked on booking-modal helper — see glamer-uat#1.');

  test('X-1 web booking is confirmed by the stylist and shows confirmed @critical', async ({
    page,
    stylistApi,
  }) => {
    // 1) Client books on web through the real multi-step booking modal.
    await signInWeb(page);
    await bookFirstAvailableViaWeb(page, env.stylist.username);

    // 2) Stylist confirms (iOS side, driven via API). Find the pending request.
    const pending = await stylistApi.GET('/me/stylist/appointments', {
      params: { query: { status: ['requested'], sort_by: 'start_time' } },
    });
    const appointmentId = pending.data?.data?.[0]?.id;
    expect(appointmentId, 'a pending request should exist after booking').toBeTruthy();

    const confirmed = await stylistApi.POST('/appointments/{id}/confirm', {
      params: { path: { id: appointmentId! } },
    });
    expect(confirmed.data?.status).toBe('confirmed');

    // 3) Client sees it confirmed on web — state is consistent across surfaces.
    await page.goto('/appointments');
    await expect(page.getByText(/confirmed/i)).toBeVisible();
  });
});
