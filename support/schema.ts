import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import OpenAPIResponseValidatorImport from 'openapi-response-validator';
import { expect } from '@playwright/test';

// openapi-response-validator is CJS; under ESM the constructor lands on `.default`.
const OpenAPIResponseValidator = ((
  OpenAPIResponseValidatorImport as unknown as { default?: unknown }
).default ?? OpenAPIResponseValidatorImport) as typeof OpenAPIResponseValidatorImport;

type Validator = InstanceType<typeof OpenAPIResponseValidatorImport>;

/**
 * Validates API responses against the vendored OpenAPI spec — this is journey
 * A-5 (schema & error-shape conformance) applied to every API call we make.
 *
 * Tests reference the *templated* path from the spec (e.g. '/stylists/{stylistId}'),
 * not the concrete URL, so the matcher can find the operation.
 */

const here = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(here, '..', 'spec', 'glamer.openapi.yaml');

type AnyObject = Record<string, unknown>;
const spec = parse(readFileSync(specPath, 'utf8')) as AnyObject;

// Cache one validator per operation (path + method).
const validators = new Map<string, Validator>();

function getValidator(path: string, method: string): Validator {
  const key = `${method.toUpperCase()} ${path}`;
  const cached = validators.get(key);
  if (cached) return cached;

  const paths = spec.paths as AnyObject | undefined;
  const pathItem = paths?.[path] as AnyObject | undefined;
  const operation = pathItem?.[method.toLowerCase()] as AnyObject | undefined;
  if (!operation) {
    throw new Error(
      `No operation '${method} ${path}' in the OpenAPI spec. ` +
        `Use the templated path exactly as defined in spec/glamer.openapi.yaml.`,
    );
  }

  const validator = new OpenAPIResponseValidator({
    responses: operation.responses as never,
    components: spec.components as never,
  });
  validators.set(key, validator);
  return validator;
}

export interface SpecLocation {
  path: string;
  method: string;
  status: number;
}

/**
 * Custom matcher: expect(body).toMatchSpec({ path, method, status }).
 * Passes when `body` conforms to the response schema declared for that
 * operation + status code in the OpenAPI document.
 */
expect.extend({
  toMatchSpec(received: unknown, location: SpecLocation) {
    const validator = getValidator(location.path, location.method);
    const result = validator.validateResponse(String(location.status), received);

    if (!result) {
      return {
        pass: true,
        message: () =>
          `Expected response NOT to match spec for ${location.method} ${location.path} (${location.status}), but it did.`,
      };
    }

    return {
      pass: false,
      message: () =>
        `Response does not match spec for ${location.method} ${location.path} (${location.status}):\n` +
        JSON.stringify(result.errors ?? result, null, 2),
    };
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toMatchSpec(location: SpecLocation): R;
    }
  }
}
