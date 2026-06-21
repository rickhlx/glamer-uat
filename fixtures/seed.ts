import { env } from '../support/env.js';

/**
 * Reset / seed the UAT environment to a known state (principle 5 & 6).
 *
 * [CONFIRM] the real seeding mechanism. This assumes a protected internal seed
 * endpoint; swap for a script/CLI call if that's how UAT is reset. Kept as a
 * single chokepoint so the whole suite changes in one place.
 */
export async function resetUat(): Promise<void> {
  if (!env.seed.url) {
    throw new Error('SEED_URL is not configured; cannot reset UAT to a known state.');
  }
  const res = await fetch(env.seed.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.seed.token}` },
  });
  if (!res.ok) {
    throw new Error(`Seed/reset failed: HTTP ${res.status}`);
  }
}
