import { env } from './env.js';
import { makeApiClient } from './api-client.js';

export interface Session {
  token: string;
  userId: string;
}

/**
 * Acquire a bearer token via the API. Used directly for API/cross-surface tests
 * and to seed browser sessions for web tests.
 *
 * [CONFIRM] real login shape once the OpenAPI spec lands — adjust the path/body
 * here and it propagates everywhere.
 */
export async function loginViaApi(email: string, password: string): Promise<Session> {
  const client = makeApiClient();
  const { data, error, response } = await client.POST('/auth/login', {
    body: { email, password },
  });
  if (error || !data) {
    throw new Error(`Login failed for ${email} (HTTP ${response.status})`);
  }
  return { token: data.token, userId: data.user.id };
}

export const loginAsClient = () => loginViaApi(env.client.email, env.client.password);
export const loginAsStylist = () => loginViaApi(env.stylist.email, env.stylist.password);
