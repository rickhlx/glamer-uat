import { test, expect, env } from '../../support/fixtures.js';

// A-3 — Booking lifecycle: the state machine must enforce valid transitions.
// Concrete stylist username / service ids come from seed data.
test.describe('A-3 appointment lifecycle', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-3 book → stylist confirm moves an appointment to confirmed @critical', async ({
    clientApi,
    stylistApi,
    serviceId,
    slotStart,
  }) => {
    // Client books a real service into a real available slot.
    const created = await clientApi.POST('/appointments', {
      body: {
        username: env.stylist.username,
        services: [{ id: serviceId }],
        startTime: slotStart,
      },
    });
    expect(created.response.status).toBe(201);
    expect(created.data).toMatchSpec({ path: '/appointments', method: 'post', status: 201 });
    const id = created.data!.id;
    expect(created.data!.status).toBe('requested');

    // Stylist confirms.
    const confirmed = await stylistApi.POST('/appointments/{id}/confirm', {
      params: { path: { id } },
    });
    expect(confirmed.response.status).toBe(200);
    expect(confirmed.data?.status).toBe('confirmed');
  });

  test('A-3 an invalid transition is rejected @critical', async ({ stylistApi }) => {
    // Completing an appointment that was never confirmed.
    const { response } = await stylistApi.POST('/appointments/{id}/complete', {
      params: { path: { id: '11111111-1111-1111-1111-111111111111' } },
    });
    expect([400, 409]).toContain(response.status);
  });
});
