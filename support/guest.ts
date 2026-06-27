import type { GlamerClient } from './api-client.js';

/**
 * Helpers for the account-less *guest* booking flow (journey A-7):
 *
 *   POST /carts                      → create a guest cart (public)
 *   POST /carts/{id}/items           → add a service (guest access via session_id)
 *   POST /verify/phone/request       → SMS one-time code (public, rate-limited)
 *   POST /verify/phone/confirm       → exchange code for a verificationToken
 *   POST /carts/{id}/checkout        → convert cart to an appointment as a guest
 *
 * These mirror the style of `support/booking.ts` (the authenticated-client
 * booking path). The cart/verify endpoints are all public, so they run on the
 * anonymous `api` fixture — no session cookie needed.
 */

export interface GuestCartInputs {
  username: string;
  serviceId: string;
  /** Work location for at_stylist carts; omit when the stylist has a single one. */
  locationId?: string;
}

export interface GuestCart {
  cartId: string;
  /** Guest session id; pass as `session_id` to read/mutate the cart unauthenticated. */
  sessionId: string;
}

/** Create a guest cart for a stylist and add one service to it. */
export async function createGuestCart(
  api: GlamerClient,
  inputs: GuestCartInputs,
): Promise<GuestCart> {
  const created = await api.POST('/carts', {
    body: {
      stylistUsername: inputs.username,
      locationType: 'at_stylist',
      ...(inputs.locationId ? { locationId: inputs.locationId } : {}),
    },
  });
  if (created.response.status !== 201 || !created.data) {
    throw new Error(`POST /carts failed (HTTP ${created.response.status}).`);
  }
  const cartId = created.data.id;
  const sessionId = created.data.sessionId;
  if (!sessionId) {
    throw new Error('Guest cart has no sessionId; cannot drive guest access.');
  }

  const item = await api.POST('/carts/{id}/items', {
    params: { path: { id: cartId }, query: { session_id: sessionId } },
    body: { serviceId: inputs.serviceId },
  });
  if (item.response.status !== 201) {
    throw new Error(`POST /carts/{id}/items failed (HTTP ${item.response.status}).`);
  }

  return { cartId, sessionId };
}

/** Request an SMS one-time code for a guest phone (202 Accepted, no body). */
export async function requestPhoneVerification(
  api: GlamerClient,
  phone: string,
  cartId?: string,
): Promise<number> {
  const { response } = await api.POST('/verify/phone/request', {
    body: { phone, ...(cartId ? { cartId } : {}) },
  });
  return response.status;
}

/** Confirm an SMS code and return the short-lived verification token. */
export async function confirmPhoneVerification(
  api: GlamerClient,
  phone: string,
  code: string,
): Promise<string> {
  const { data, response } = await api.POST('/verify/phone/confirm', {
    body: { phone, code },
  });
  if (response.status !== 200 || !data?.verificationToken) {
    throw new Error(`POST /verify/phone/confirm failed (HTTP ${response.status}).`);
  }
  return data.verificationToken;
}

export interface GuestDetails {
  name: string;
  phone: string;
  verificationToken: string;
}

/**
 * Check out a guest cart into an appointment. Returns the raw openapi-fetch
 * result so callers can assert on status (e.g. 403 when the phone isn't
 * verified) as well as the body.
 */
export async function guestCheckout(
  api: GlamerClient,
  cartId: string,
  guest: GuestDetails,
) {
  return api.POST('/carts/{id}/checkout', {
    params: { path: { id: cartId } },
    body: { guest },
  });
}
