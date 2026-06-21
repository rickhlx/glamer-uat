import { test, expect, env } from '../../support/fixtures.js';

// A-1 — Auth & sessions. The foundation every other journey depends on.
test.describe('A-1 auth & sessions', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-1 valid credentials issue a token @critical', async ({ api }) => {
    const { data, response } = await api.POST('/auth/login', {
      body: { email: env.client.email, password: env.client.password },
    });
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({ path: '/auth/login', method: 'post', status: 200 });
    expect(data?.token).toBeTruthy();
  });

  test('A-1 invalid credentials are rejected with the spec error shape @critical', async ({
    api,
  }) => {
    const { error, response } = await api.POST('/auth/login', {
      body: { email: env.client.email, password: 'definitely-wrong' },
    });
    expect(response.status).toBe(401);
    expect(error).toMatchSpec({ path: '/auth/login', method: 'post', status: 401 });
  });

  test('A-1 protected endpoint rejects unauthenticated requests @critical', async ({ api }) => {
    const { response } = await api.GET('/me');
    expect(response.status).toBe(401);
  });
});
