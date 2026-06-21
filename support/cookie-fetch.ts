/**
 * Cookie handling for Glamer's cookie-based auth (`glamer-session`).
 *
 * Two wrinkles this covers:
 *  - Node's global fetch does not persist cookies across calls, so we keep a jar.
 *  - POST /session returns the session value in the JSON *body* (not a Set-Cookie
 *    header), so auth code sets it on the jar explicitly via `set()`.
 *
 * One jar per client instance keeps client and stylist sessions isolated.
 */
export class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  /** Capture cookies from any Set-Cookie response headers. */
  ingest(setCookies: readonly string[]): void {
    for (const raw of setCookies) {
      const pair = raw.split(';', 1)[0] ?? '';
      const eq = pair.indexOf('=');
      if (eq > 0) {
        this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  }

  header(): string | null {
    if (this.cookies.size === 0) return null;
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

export function createCookieFetch(jar: CookieJar): typeof fetch {
  return async (input, init) => {
    const request = new Request(input as RequestInfo, init);
    const cookieHeader = jar.header();
    if (cookieHeader) {
      request.headers.set('cookie', cookieHeader);
    }
    const response = await fetch(request);
    jar.ingest(response.headers.getSetCookie?.() ?? []);
    return response;
  };
}
