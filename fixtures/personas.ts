/**
 * Realistic test personas (principle 10: test like real usage). Includes names
 * with apostrophes / non-ASCII so flows that mishandle real input fail loudly.
 */
export const personas = {
  client: {
    name: "Siobhán O'Brien",
    email: 'uat.client@glamer.example',
  },
  stylist: {
    name: 'José Núñez',
    email: 'uat.stylist@glamer.example',
    service: { name: 'Cut & Colour', priceCents: 8500, durationMinutes: 90 },
  },
} as const;

export type Personas = typeof personas;
