import { env } from './env.js';
import { makeApiClient, setSessionCookie, type GlamerClient } from './api-client.js';

/**
 * Glamer authentication is Firebase-based:
 *   1. Sign in to Firebase with email/password → Firebase ID token.
 *   2. Exchange the ID token at POST /session (bearer) → `glamer-session` cookie.
 *   3. Subsequent calls ride the cookie (managed by the client's cookie jar).
 */

interface FirebaseSignInResponse {
  idToken: string;
  localId: string;
}

/** Step 1: get a Firebase ID token via the Firebase Auth REST API. */
export async function getFirebaseIdToken(email: string, password: string): Promise<string> {
  if (!env.firebaseApiKey) {
    throw new Error('FIREBASE_API_KEY is not set; cannot obtain a Firebase ID token.');
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    throw new Error(`Firebase sign-in failed for ${email} (HTTP ${res.status})`);
  }
  const data = (await res.json()) as FirebaseSignInResponse;
  return data.idToken;
}

/**
 * Step 2+3: establish a `glamer-session` cookie on the given client. Returns
 * the same client (now authenticated) for convenience.
 */
export async function authenticate(
  client: GlamerClient,
  email: string,
  password: string,
): Promise<GlamerClient> {
  const idToken = await getFirebaseIdToken(email, password);
  const { data, response } = await client.POST('/session', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok || !data) {
    throw new Error(`POST /session failed for ${email} (HTTP ${response.status})`);
  }
  // The session value comes back in the body, not a Set-Cookie header.
  setSessionCookie(client, data.session);
  return client;
}

/** Build a fresh client authenticated as the test client. */
export async function clientApi(): Promise<GlamerClient> {
  return authenticate(makeApiClient(), env.client.email, env.client.password);
}

/** Build a fresh client authenticated as the test stylist. */
export async function stylistApi(): Promise<GlamerClient> {
  return authenticate(makeApiClient(), env.stylist.email, env.stylist.password);
}
