import { test, expect, env } from '../../support/fixtures.js';
import {
  createGuestCart,
  requestPhoneVerification,
  confirmPhoneVerification,
  guestCheckout,
} from '../../support/guest.js';

/**
 * A-7 — Guest booking & phone verification (client-facing).
 *
 * The web app now offers account-less booking: verify a phone over SMS, build a
 * cart, and check out as a guest. The SMS one-time code can't be read from an
 * automated run, so the happy path is gated behind GUEST_TEST_OTP; the
 * high-value unhappy path (checkout without a valid token → 403) needs no code
 * and runs every time. See docs/critical-journeys.md#a-7.
 */

// 555-0100..0199 are reserved fictional US numbers — safe to hit without
// delivering a real SMS. Overridable for a UAT test number that accepts a code.
const GUEST_PHONE = env.guest.phone || '+14155550123';

// A reserved phone we never request a code for, so confirm always 400s
// (invalid/expired). Must NOT be the configured GUEST_TEST_PHONE — that phone
// accepts the fixed test OTP, so a "wrong code" there would actually verify.
const UNVERIFIED_PHONE = '+14155550199';

test.describe('A-7 guest booking & phone verification', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-7 a phone verification request is accepted @critical', async ({ api }) => {
    const status = await requestPhoneVerification(api, GUEST_PHONE);
    expect([202, 400, 429]).toContain(status);
  });

  test('A-7 a malformed phone is rejected with the spec error shape @important', async ({
    api,
  }) => {
    const { error, response } = await api.POST('/verify/phone/request', {
      body: { phone: 'not-a-phone' },
    });
    expect([400, 429]).toContain(response.status);
    if (response.status === 400) {
      expect(error).toMatchSpec({
        path: '/verify/phone/request',
        method: 'post',
        status: 400,
      });
    }
  });

  test('A-7 confirming an invalid code returns the spec error shape @critical', async ({
    api,
  }) => {
    // Use a phone with no pending verification (not the test phone, which would
    // accept the fixed OTP) so confirm always returns 400 invalid/expired.
    const { error, response } = await api.POST('/verify/phone/confirm', {
      body: { phone: UNVERIFIED_PHONE, code: '000000' },
    });
    expect([400, 429]).toContain(response.status);
    if (response.status === 400) {
      expect(error).toMatchSpec({
        path: '/verify/phone/confirm',
        method: 'post',
        status: 400,
      });
    }
  });

  test('A-7 guest checkout without a verified phone is rejected (403) @critical', async ({
    api,
    serviceId,
  }) => {
    // Unhappy path (principle 9): a non-empty guest cart, but a bogus token must
    // not convert to an appointment. Needs no real SMS code, so it always runs.
    const cart = await createGuestCart(api, {
      username: env.stylist.username,
      serviceId,
    });
    const { error, response } = await guestCheckout(api, cart.cartId, {
      name: 'Guest Tester',
      phone: GUEST_PHONE,
      verificationToken: 'definitely-not-a-valid-token',
    });
    expect(response.status).toBe(403);
    expect(error).toMatchSpec({
      path: '/carts/{id}/checkout',
      method: 'post',
      status: 403,
    });
  });

  test('A-7 a verified guest can book end-to-end @critical', async ({
    api,
    stylistApi,
    serviceId,
  }) => {
    test.skip(
      !env.guest.otp,
      'Set GUEST_TEST_OTP (+ GUEST_TEST_PHONE) to run the full guest happy path.',
    );
    // Creates a real appointment; the stylist declines it afterwards to free the
    // slot (F10 resolved). Only runs when the UAT test OTP is configured.
    const phone = env.guest.phone || GUEST_PHONE;
    const cart = await createGuestCart(api, {
      username: env.stylist.username,
      serviceId,
    });
    await requestPhoneVerification(api, phone, cart.cartId);
    const token = await confirmPhoneVerification(api, phone, env.guest.otp);
    const { data, response } = await guestCheckout(api, cart.cartId, {
      name: 'Guest Tester',
      phone,
      verificationToken: token,
    });
    try {
      expect(response.status).toBe(200);
      expect(data).toMatchSpec({
        path: '/carts/{id}/checkout',
        method: 'post',
        status: 200,
      });
      expect(data?.appointmentId).toBeTruthy();
    } finally {
      // Cleanup: stylist declines the guest appointment so the slot is released.
      if (data?.appointmentId) {
        await stylistApi
          .POST('/appointments/{id}/decline', {
            params: { path: { id: data.appointmentId } },
            body: { reason: 'UAT cleanup' },
          })
          .catch(() => {});
      }
    }
  });
});
