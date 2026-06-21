import { test, expect, env } from '../../support/fixtures.js';

// Connectivity smoke check — the fast gate to run *first* after filling .env.
// Verifies env loads, Firebase sign-in works, the /session cookie is issued, and
// authenticated calls succeed for both roles. If these pass, the journeys can run.
// Run alone with: pnpm smoke
test.describe('smoke: connectivity & auth', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet (still on *.example).');

  test('@smoke client can authenticate and read /me @critical', async ({ clientApi }) => {
    const { data, response } = await clientApi.GET('/me/');
    expect(response.status, 'GET /me should succeed after Firebase + /session auth').toBe(200);
    expect(data).toMatchSpec({ path: '/me/', method: 'get', status: 200 });
  });

  test('@smoke stylist can authenticate (valid session) @critical', async ({ stylistApi }) => {
    const { response } = await stylistApi.HEAD('/session');
    expect(response.status, 'HEAD /session should be 204 with a valid cookie').toBe(204);
  });
});
