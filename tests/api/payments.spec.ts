import { test, expect, env } from '../../support/fixtures.js';

// A-6 — Payments. The real model uses an explicit mark-paid action (paymentStatus
// transitions unpaid → captured). [CONFIRM] full charge/refund flow & cart checkout.
test.describe('A-6 payments', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-6 marking an appointment paid updates payment status @critical', async ({
    stylistApi,
  }) => {
    // Assumes a confirmed, unpaid appointment from seed data.
    const { data, response } = await stylistApi.POST('/appointments/{id}/mark-paid', {
      params: { path: { id: '22222222-2222-2222-2222-222222222222' } },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({
      path: '/appointments/{id}/mark-paid',
      method: 'post',
      status: 200,
    });
    expect(['authorized', 'captured']).toContain(data?.paymentStatus);
  });
});
