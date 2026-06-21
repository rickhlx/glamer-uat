import { test, expect, env } from '../../support/fixtures.js';

// A-2 — Authorization boundaries (principle 9: permission boundaries).
test.describe('A-2 authorization boundaries', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-2 a client cannot use stylist-only endpoints @critical', async ({ clientApi }) => {
    // /me/stylist/* requires a stylist principal.
    const { response } = await clientApi.GET('/me/stylist/profile');
    expect([401, 403]).toContain(response.status);
  });

  test('A-2 a user cannot read an appointment they are not part of @critical', async ({
    clientApi,
  }) => {
    const { response } = await clientApi.GET('/appointments/{id}', {
      params: { path: { id: '00000000-0000-0000-0000-000000000000' } },
    });
    expect([403, 404]).toContain(response.status);
  });
});
