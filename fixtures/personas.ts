import { env } from '../support/env.js';

/**
 * Realistic test personas (principle 10: test like real usage). Includes names
 * with apostrophes / non-ASCII so flows that mishandle real input fail loudly.
 * Stylist username comes from env since public routes are keyed by it.
 */
export const personas = {
  client: {
    name: "Siobhán O'Brien",
    email: env.client.email,
  },
  stylist: {
    name: 'José Núñez',
    email: env.stylist.email,
    get username(): string {
      return env.stylist.username;
    },
  },
} as const;

export type Personas = typeof personas;
