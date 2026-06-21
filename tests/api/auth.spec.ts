import { test, expect, env } from '../../support/fixtures.js';

// A-1 — Auth & sessions. Glamer auth is Firebase → POST /session → cookie.
// The foundation every other journey depends on.
test.describe('A-1 auth & sessions', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-1 an authenticated client has a valid session @critical', async ({ clientApi }) => {
    // clientApi has exchanged a Firebase token for a glamer-session cookie.
    const { response } = await clientApi.HEAD('/session');
    expect(response.status).toBe(204);
  });

  test('A-1 an unauthenticated request has no valid session @critical', async ({ api }) => {
    // Known-failing: server returns 400, spec says 401. See docs/findings.md#f1 (glamer-backend#364).
    test.fail();
    const { response } = await api.HEAD('/session');
    expect(response.status).toBe(401);
  });

  test('A-1 a protected endpoint rejects unauthenticated requests @critical', async ({
    api,
  }) => {
    // Known-failing: server returns 400, spec says 401. See docs/findings.md#f1 (glamer-backend#364).
    test.fail();
    const { response } = await api.GET('/me/');
    expect(response.status).toBe(401);
  });
});
