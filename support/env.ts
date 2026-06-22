import 'dotenv/config';

/**
 * Typed access to UAT configuration. Fail loud and early when a required
 * variable is missing — a UAT run against the wrong/empty target is worse
 * than not running at all (principle 5: reproducibility).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  apiBaseUrl: required('API_BASE_URL'),
  webBaseUrl: required('WEB_BASE_URL'),

  /**
   * Glamer auth is Firebase-based: sign in to Firebase with email/password to
   * get an ID token, exchange it at POST /session for a `glamer-session` cookie.
   * FIREBASE_API_KEY is the Firebase Web API key for the UAT project.
   */
  firebaseApiKey: optional('FIREBASE_API_KEY'),

  /**
   * The web target (staging.glamer.so) sits behind Vercel deployment
   * protection. Generate a "Protection Bypass for Automation" secret in the
   * Vercel project (Settings → Deployment Protection) and set it here; the web
   * and cross projects then send the `x-vercel-protection-bypass` header so
   * Playwright reaches the real app instead of Vercel's login wall.
   */
  vercelBypassSecret: optional('VERCEL_AUTOMATION_BYPASS_SECRET'),
  client: {
    email: required('TEST_CLIENT_EMAIL'),
    password: required('TEST_CLIENT_PASSWORD'),
  },
  stylist: {
    email: required('TEST_STYLIST_EMAIL'),
    password: required('TEST_STYLIST_PASSWORD'),
    // Public stylist routes are keyed by username (e.g. /stylists/{username}).
    // Lazy getter: only booking/availability journeys need it, so smoke/auth can
    // run without it — but those that do need it fail loudly instead of 404ing.
    get username(): string {
      const u = process.env.TEST_STYLIST_USERNAME;
      if (!u) {
        throw new Error(
          'TEST_STYLIST_USERNAME is required for booking/availability journeys (e.g. ricardo_stylist).',
        );
      }
      return u;
    },
  },
  seed: {
    url: optional('SEED_URL'),
    token: optional('SEED_TOKEN'),
  },
  isCI: !!process.env.CI,
  /**
   * True while still pointed at the placeholder *.example domains from
   * .env.example. Journey tests skip themselves in this state so the scaffold
   * is green before real UAT URLs land. Flips off automatically once real
   * hostnames are configured.
   */
  get isPlaceholder(): boolean {
    return required('API_BASE_URL').endsWith('.example');
  },
} as const;

export type Env = typeof env;
