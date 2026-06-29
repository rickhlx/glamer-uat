import { test, expect, env } from '../../support/fixtures.js';

// C-1 — Sign in (web client). Real glamer-frontend selectors: the sign-in form
// posts name="email"/name="password" to a Firebase-backed server action that
// sets the httpOnly `glamer-session` cookie and redirects to /appointments.
test.describe('C-1 client sign in', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('C-1 valid credentials sign the client in @critical', async ({ page }) => {
    await page.goto('/signin');
    await page.locator('input[name="email"]').fill(env.client.email);
    await page.locator('input[name="password"]').fill(env.client.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Redirects off /signin to the authenticated appointments page.
    await page.waitForURL((url) => !url.pathname.startsWith('/signin'), {
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/appointments/);
    // The frontend set the session cookie itself (token comes back in the body).
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'glamer-session')).toBe(true);
  });

  test('C-1 invalid credentials show an error and do not sign in @important', async ({
    page,
  }) => {
    // Known-failing: a wrong password white-screens the sign-in page with
    // "Application error" instead of showing a clear inline error. Firebase now
    // returns auth/invalid-credential (not the handled auth/wrong-password), so
    // signin.action hits its generic formErrors branch, and signin-form renders
    // that form-level <ErrorMessage> (Headless UI <Description>) outside a
    // <Field> parent → Headless UI throws → React error boundary crashes the
    // page. See docs/findings.md#f11 (glamer-frontend). Remove guard when fixed.
    test.fail();
    await page.goto('/signin');
    await page.locator('input[name="email"]').fill(env.client.email);
    // 8+ chars to clear client-side zod min(8) and reach the server check.
    await page.locator('input[name="password"]').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Desired behavior: a graceful inline error, no app crash, stays on /signin.
    await expect(
      page.getByText(/application error/i),
      'the sign-in page must not crash on a bad password',
    ).toHaveCount(0);
    await expect(page.locator('[data-slot="error"]').first()).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });
});
