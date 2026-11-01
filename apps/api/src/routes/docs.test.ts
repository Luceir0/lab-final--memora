import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../test/harness.ts';

interface OpenApiMediaType {
  readonly schema?: {
    readonly type?: string;
    readonly properties?: Record<string, unknown>;
    readonly required?: string[];
  };
}

interface OpenApiOperation {
  readonly summary?: string;
  readonly responses?: Record<string, { readonly content?: Record<string, OpenApiMediaType> }>;
}

interface OpenApiDocument {
  readonly openapi: string;
  readonly info: { readonly title: string; readonly version: string };
  readonly paths: Record<string, Record<string, OpenApiOperation>>;
  readonly components?: {
    readonly schemas?: Record<
      string,
      { readonly properties?: Record<string, unknown>; readonly required?: string[] }
    >;
    readonly securitySchemes?: Record<string, Record<string, unknown>>;
  };
}

describe('OpenAPI', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('generates the document from route schemas (AC-04)', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const document = response.json<OpenApiDocument>();
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('Memora API');
    expect(document.info.version).toBe('0.0.0');

    const health = document.paths['/api/health'];
    expect(health).toBeDefined();

    const operation = health?.get;
    expect(operation?.summary).toBe('Estado de la API');

    const schema = operation?.responses?.['200']?.content?.['application/json']?.schema;
    expect(schema?.type).toBe('object');
    expect(Object.keys(schema?.properties ?? {})).toEqual(
      expect.arrayContaining(['status', 'version', 'timestamp']),
    );
    expect(schema?.required).toEqual(expect.arrayContaining(['status', 'version', 'timestamp']));
  });

  it('publishes the reusable error component and session scheme', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });
    const document = response.json<OpenApiDocument>();

    const errorComponent = document.components?.schemas?.ErrorResponse;
    expect(errorComponent).toBeDefined();
    expect(Object.keys(errorComponent?.properties ?? {})).toEqual(
      expect.arrayContaining(['code', 'message', 'details']),
    );
    expect(errorComponent?.required).toEqual(
      expect.arrayContaining(['code', 'message', 'details']),
    );

    expect(document.components?.securitySchemes?.cookieAuth).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'memora_session',
    });
  });

  it('does not publish the documentation routes themselves', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });
    const document = response.json<OpenApiDocument>();

    expect(document.paths['/api/openapi.json']).toBeUndefined();
    expect(document.paths['/api/docs']).toBeUndefined();
  });

  it('serves Swagger UI outside production', async () => {
    const response = await testApp.app.inject({ method: 'GET', url: '/api/docs' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toMatch(/swagger-ui/i);

    const initializer = await testApp.app.inject({
      method: 'GET',
      url: '/api/docs/static/swagger-initializer.js',
    });
    expect(initializer.statusCode).toBe(200);
    expect(initializer.body).toContain('/api/openapi.json');
  });

  it('serves Swagger UI static assets', async () => {
    const response = await testApp.app.inject({
      method: 'GET',
      url: '/api/docs/static/swagger-ui.css',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/css');
  });
});

describe('OpenAPI in production', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ env: { NODE_ENV: 'production' }, markServicesReal: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('keeps /api/openapi.json but hides /api/docs', async () => {
    const spec = await testApp.app.inject({ method: 'GET', url: '/api/openapi.json' });
    expect(spec.statusCode).toBe(200);

    const docs = await testApp.app.inject({ method: 'GET', url: '/api/docs' });
    expect(docs.statusCode).toBe(404);
    expect(docs.json<{ code: string; details: unknown }>()).toMatchObject({
      code: 'NOT_FOUND',
      details: null,
    });
  });
});
