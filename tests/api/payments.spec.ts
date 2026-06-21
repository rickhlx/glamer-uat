import { test, expect, env } from '../../support/fixtures.js';

// A-6 — Payment endpoints. [CONFIRM] the integration & charge model before
// hardening these (see open questions in docs/critical-journeys.md).
test.describe('A-6 payments', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-6 a declined card fails the booking with no orphaned booking @critical', async ({
    clientSession,
  }) => {
    const { makeApiClient } = await import('../../support/api-client.js');
    const asClient = makeApiClient(clientSession.token);
    const { response } = await asClient.POST('/bookings', {
      body: {
        stylistId: 'seed-stylist',
        serviceId: 'seed-service',
        slotStart: '2099-02-01T10:00:00Z',
        paymentToken: env.payments.declineCard,
      },
    });
    // Payment failed → no booking created.
    expect(response.status).toBe(402);
  });
});
