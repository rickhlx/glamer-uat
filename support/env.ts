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
  client: {
    email: required('TEST_CLIENT_EMAIL'),
    password: required('TEST_CLIENT_PASSWORD'),
  },
  stylist: {
    email: required('TEST_STYLIST_EMAIL'),
    password: required('TEST_STYLIST_PASSWORD'),
  },
  seed: {
    url: optional('SEED_URL'),
    token: optional('SEED_TOKEN'),
  },
  payments: {
    declineCard: optional('TEST_CARD_DECLINE'),
  },
  isCI: !!process.env.CI,
  /**
   * True while still pointed at the placeholder *.example domains from
   * .env.example. Journey tests skip themselves in this state so the scaffold
   * is green before real UAT URLs + spec land. Flips off automatically once
   * real hostnames are configured.
   */
  get isPlaceholder(): boolean {
    return required('API_BASE_URL').endsWith('.example');
  },
} as const;

export type Env = typeof env;
