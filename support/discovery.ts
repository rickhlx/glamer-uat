import type { GlamerClient } from './api-client.js';

/**
 * Runtime discovery of real UAT data, so tests don't hardcode seed ids
 * (principle 6: tests own/derive their data; survive data changes).
 */

/** First service id from the authenticated stylist's own service list. */
export async function firstServiceId(stylist: GlamerClient): Promise<string> {
  const { data, response } = await stylist.GET('/me/stylist/services');
  if (!response.ok) {
    throw new Error(
      `GET /me/stylist/services failed (HTTP ${response.status}) — is the test stylist onboarded?`,
    );
  }
  const id = data?.data?.[0]?.id;
  if (!id) {
    throw new Error('Test stylist has no services; set up services in UAT first.');
  }
  return id;
}

/** Start time (ISO) of the first available slot for a stylist over the next `days`. */
export async function firstAvailableSlotStart(
  api: GlamerClient,
  username: string,
  days = 14,
): Promise<string> {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10);

  const { data, response } = await api.GET('/stylists/{username}/availability', {
    params: { path: { username }, query: { start_date: startDate, end_date: endDate } },
  });
  if (!response.ok) {
    throw new Error(`GET availability failed for ${username} (HTTP ${response.status})`);
  }
  for (const day of data?.availability ?? []) {
    const start = day.slots[0]?.start;
    if (start) return start;
  }
  throw new Error(`No available slots for ${username} in the next ${days} days.`);
}
