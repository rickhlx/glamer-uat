import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { env } from './env.js';

/**
 * Real-UI web helpers. Selectors mirror the live glamer-frontend (Next.js App
 * Router); see the component sources under glamer-frontend/. Prefer name/role
 * locators so these survive styling churn.
 */

/**
 * Sign in through the web UI (Firebase email/password). The frontend signs in
 * to Firebase in the browser, exchanges the ID token at POST /session, and
 * sets the httpOnly `glamer-session` cookie itself (lib/actions/signin.action.ts).
 * On success it redirects to /appointments (or a safe `redirect` referer).
 */
export async function signInWeb(page: Page): Promise<void> {
  await page.goto('/signin');
  await page.locator('input[name="email"]').fill(env.client.email);
  await page.locator('input[name="password"]').fill(env.client.password);
  // Scope to the form's submit; the Google button also matches /sign in/i.
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  // The server action redirects off /signin once the session cookie is set.
  await page.waitForURL((url) => !url.pathname.startsWith('/signin'), {
    timeout: 15_000,
  });
  await expect(page).not.toHaveURL(/\/signin\b/);
}

/**
 * Drive the multi-step booking modal on a stylist profile to a sent request.
 * The modal opens via `?booking=true` on /{username}. Steps are data-driven
 * (Location only if the stylist offersTravel), so we detect each step by its
 * visible content rather than hardcoding step numbers, then click "Next" until
 * the summary, where we submit. Returns once the confirmation screen shows.
 *
 * NOTE: this creates a real appointment request against live staging — use
 * sparingly. Cancelling/declining now releases the slot again (finding F10
 * resolved), so it no longer permanently exhausts the stylist's availability.
 */
export async function bookFirstAvailableViaWeb(
  page: Page,
  username: string,
): Promise<void> {
  // Force step 1; the page derives currentStep from ?step= (defaults to 1).
  await page.goto(`/${username}?booking=true&step=1`);
  await expect(
    page.getByRole('heading', { name: /book your appointment/i }),
  ).toBeVisible();
  // The step content is server-rendered but interactive bits (card onClick, Next)
  // are client components; give hydration a beat so the first click isn't lost.
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2_000);

  // Scope all interactions to the modal overlay — the profile page stays in the
  // DOM behind it (it has its own service headings/buttons that would otherwise
  // match and get clicked instead).
  const modal = page.locator('.fixed.inset-0.z-50');
  const next = modal.getByRole('button', { name: /^Next$/ });

  // Each step gates the "Next" button on server-side cart state, so after a
  // selection we wait for Next to enable before advancing. We detect the step by
  // its heading rather than hardcoding numbers (the Location step only exists
  // when the stylist offersTravel). Bounded so a stuck step fails loudly.
  for (let i = 0; i < 5; i++) {
    // Summary step (final): the phone field is the tell.
    const phone = modal.locator('input[name="phoneNumber"]');
    if (await phone.isVisible().catch(() => false)) {
      if (!(await phone.inputValue())) await phone.fill('5551234567');
      await modal.getByRole('button', { name: /request appointment/i }).click();
      break;
    }

    // Services step: ensure a service is selected (idempotent — a service may
    // already be in the cart from a prior run; don't toggle it back off). Click
    // the service *card* (its level-4 name heading), not the Headless UI
    // checkbox — the checkbox detaches on the re-render and the click hangs.
    if (await modal.getByRole('heading', { name: /^Select Services$/i }).isVisible().catch(() => false)) {
      // Toggle-safe retry: re-check enabled before each click so a click lost to
      // hydration is retried, but an already-selected service isn't toggled off.
      for (let attempt = 0; attempt < 4 && !(await next.isEnabled()); attempt++) {
        await modal.getByRole('heading', { level: 4 }).first().click();
        await page.waitForTimeout(3_000);
      }
      await expect(next).toBeEnabled({ timeout: 10_000 });
      await next.click();
      continue;
    }

    // Date & Time step: pick the first selectable day, then the first slot
    // (idempotent — skip if a valid datetime is already chosen).
    if (await modal.getByRole('heading', { name: /Select Date/i }).isVisible().catch(() => false)) {
      if (await next.isEnabled()) {
        await next.click();
        continue;
      }
      const day = modal
        .locator('.grid-cols-7 button:not([disabled])')
        .filter({ hasText: /^\d+$/ })
        .first();
      await expect(day, 'the stylist should have at least one bookable day').toBeVisible({ timeout: 10_000 });
      await day.click();
      const slot = modal
        .getByRole('button', { name: /\d{1,2}:\d{2}\s*(AM|PM)/i })
        .first();
      await expect(slot, 'the chosen day should expose at least one slot').toBeVisible({ timeout: 10_000 });
      await slot.click();
      await expect(next).toBeEnabled({ timeout: 10_000 });
      await next.click();
      continue;
    }

    // Location step (only when offersTravel): pick the first option, advance.
    await modal.getByRole('radio').first().click().catch(() => {});
    await expect(next).toBeEnabled({ timeout: 10_000 });
    await next.click();
  }

  await expect(
    page.getByRole('heading', { name: /appointment request sent/i }),
  ).toBeVisible({ timeout: 15_000 });
}
