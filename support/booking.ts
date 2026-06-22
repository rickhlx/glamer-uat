import type { GlamerClient } from './api-client.js';

export interface BookingInputs {
  username: string;
  serviceId: string;
  locationId: string;
}

/** All available slot start-times for a stylist over the next `days`. */
async function availableSlotStarts(
  api: GlamerClient,
  username: string,
  days = 28,
): Promise<string[]> {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10);
  const { data } = await api.GET('/stylists/{username}/availability', {
    params: { path: { username }, query: { start_date: start, end_date: end } },
  });
  return (data?.availability ?? []).flatMap((d) => d.slots.map((s) => s.start));
}

/**
 * Book into the first slot that isn't already taken. Robust to parallel tests
 * racing for the same slot (a taken slot currently 500s — see findings F8 —
 * so we skip non-201s and try the next). Returns the created appointment id.
 */
export async function bookIntoFreeSlot(
  client: GlamerClient,
  api: GlamerClient,
  inputs: BookingInputs,
): Promise<{ id: string; status: string; startTime: string; appointment: unknown }> {
  const slots = await availableSlotStarts(api, inputs.username);
  for (const startTime of slots) {
    const res = await client.POST('/appointments', {
      body: {
        username: inputs.username,
        services: [{ id: inputs.serviceId }],
        startTime,
        locationType: 'at_stylist',
        locationId: inputs.locationId,
      },
    });
    if (res.response.status === 201 && res.data) {
      return { id: res.data.id, status: res.data.status, startTime, appointment: res.data };
    }
  }
  throw new Error(`No bookable slot for ${inputs.username} (all taken?).`);
}

/** Best-effort cleanup so tests don't leave appointments behind (principle 6). */
export async function cancelAppointment(client: GlamerClient, id: string): Promise<void> {
  try {
    await client.DELETE('/appointments/{id}', { params: { path: { id } } });
  } catch {
    // best-effort — ignore
  }
}
