import { test, expect, env } from '../../support/fixtures.js';

// A-6 — Payments. The real model uses an explicit mark-paid action (paymentStatus
// transitions toward captured). Self-contained: book → confirm → mark-paid.
// [CONFIRM] full charge/refund flow & cart checkout.
test.describe('A-6 payments', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-6 marking an appointment paid updates payment status @critical', async ({
    clientApi,
    stylistApi,
    serviceId,
    slotStart,
  }) => {
    // Book and confirm a real appointment first.
    const created = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: serviceId }],
        startTime: slotStart,
      },
    });
    const id = created.data!.id;
    await stylistApi.POST('/appointments/{id}/confirm', { params: { path: { id } } });

    // Stylist marks it paid.
    const { data, response } = await stylistApi.POST('/appointments/{id}/mark-paid', {
      params: { path: { id } },
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
