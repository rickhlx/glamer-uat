import { test, expect, env } from '../../support/fixtures.js';

// A-5 — Schema & error-shape conformance. Most A-5 coverage is implicit:
// every toMatchSpec(...) across the suite *is* an A-5 assertion. These tests
// add explicit sweeps over read endpoints.
test.describe('A-5 schema conformance', () => {
  test.skip(env.isPlaceholder, 'No live UAT target configured yet.');

  test('A-5 stylist search conforms to spec @critical', async ({ api }) => {
    const { data, response } = await api.GET('/stylists');
    expect(response.status).toBe(200);
    expect(data).toMatchSpec({ path: '/stylists', method: 'get', status: 200 });
  });

  test('A-5 a missing stylist returns the spec error shape @important', async ({ api }) => {
    const { error, response } = await api.GET('/stylists/{username}', {
      params: { path: { username: 'does-not-exist-xyz' } },
    });
    expect(response.status).toBe(404);
    expect(error).toMatchSpec({ path: '/stylists/{username}', method: 'get', status: 404 });
  });
});
