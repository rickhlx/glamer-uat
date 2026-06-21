/**
 * A `fetch` wrapper that maintains a per-instance cookie jar. Glamer auth is
 * cookie-based (`glamer-session`), and Node's global fetch does not persist
 * cookies across calls — so each authenticated client gets its own jar that
 * captures Set-Cookie and replays it as a Cookie header on later requests.
 *
 * One jar per client instance keeps the client and stylist sessions isolated.
 */
export function createCookieFetch(): typeof fetch {
  const jar = new Map<string, string>();

  const cookieFetch: typeof fetch = async (input, init) => {
    const request = new Request(input as RequestInfo, init);
    if (jar.size > 0) {
      const header = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      request.headers.set('cookie', header);
    }

    const response = await fetch(request);

    // Node 18+ exposes getSetCookie() for multiple Set-Cookie headers.
    const setCookies = response.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const pair = raw.split(';', 1)[0] ?? '';
      const eq = pair.indexOf('=');
      if (eq > 0) {
        jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }

    return response;
  };

  return cookieFetch;
}
