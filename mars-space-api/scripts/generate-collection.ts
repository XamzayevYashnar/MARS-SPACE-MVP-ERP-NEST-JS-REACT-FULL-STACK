/**
 * Generates `docs/api-collection.json` from the running Swagger document.
 *
 * Deriving the collection from the OpenAPI document rather than hand-writing it
 * means the two cannot drift: a route that is not in Swagger is not in the
 * collection either.
 *
 * Usage: `pnpm docs:collection`
 */
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AppModule } from '../src/app.module';

loadEnv();

interface PostmanEvent {
  listen: 'test';
  script: { type: 'text/javascript'; exec: string[] };
}

interface PostmanRequestItem {
  name: string;
  event?: PostmanEvent[];
  request: {
    method: string;
    header: Array<{ key: string; value: string }>;
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string; description?: string; disabled?: boolean }>;
    };
    body?: { mode: 'raw'; raw: string; options: { raw: { language: 'json' } } };
    description?: string;
    auth?: { type: 'noauth' };
  };
}

interface PostmanFolder {
  name: string;
  item: PostmanRequestItem[];
}

type OpenApiDocument = ReturnType<typeof SwaggerModule.createDocument>;

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1', { exclude: ['health'] });
  await app.init();

  const document = buildDocument(app);
  const collection = toPostmanCollection(document);

  const outputPath = resolve(process.cwd(), 'docs/api-collection.json');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

  await app.close();

  const folders = collection.item.length;
  const requests = collection.item.reduce((total, folder) => total + folder.item.length, 0);
  console.log(`✔ Wrote ${requests} requests across ${folders} folders to docs/api-collection.json`);
}

function buildDocument(app: INestApplication): OpenApiDocument {
  const config = new DocumentBuilder()
    .setTitle('Mars Space LMS API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}

function toPostmanCollection(document: OpenApiDocument) {
  const folders = new Map<string, PostmanRequestItem[]>();

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!isHttpMethod(method) || typeof operation !== 'object' || operation === null) {
        continue;
      }

      const op = operation as OperationObject;
      const folderName = op.tags?.[0] ?? 'Other';
      const items = folders.get(folderName) ?? [];

      items.push(buildRequest(path, method, op, document));
      folders.set(folderName, items);
    }
  }

  return {
    info: {
      name: 'Mars Space LMS API',
      description:
        'Generated from the OpenAPI document. Set {{baseUrl}} and log in with the Auth > login request; it stores {{accessToken}} and {{refreshToken}} automatically.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:4000', type: 'string' },
      { key: 'apiPrefix', value: 'api/v1', type: 'string' },
      { key: 'accessToken', value: '', type: 'string' },
      { key: 'refreshToken', value: '', type: 'string' },
      { key: 'adminEmail', value: 'admin@marsspace.uz', type: 'string' },
      { key: 'adminPassword', value: 'ChangeMe123!', type: 'string' },
    ],
    item: [...folders.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, item]): PostmanFolder => ({ name, item })),
  };
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: unknown[];
  parameters?: Array<{
    name: string;
    in: string;
    description?: string;
    required?: boolean;
    schema?: { type?: string; enum?: string[]; example?: unknown; default?: unknown };
  }>;
  requestBody?: {
    content?: Record<string, { schema?: { $ref?: string } }>;
  };
}

function isHttpMethod(value: string): boolean {
  return ['get', 'post', 'put', 'patch', 'delete'].includes(value);
}

function buildRequest(
  path: string,
  method: string,
  operation: OperationObject,
  document: OpenApiDocument,
): PostmanRequestItem {
  // Postman path variables use the same `:id` syntax Nest does, so the raw
  // path can travel through unchanged apart from the prefix variable.
  const segments = path.split('/').filter((segment) => segment.length > 0);
  const rawPath = ['{{baseUrl}}', '{{apiPrefix}}', ...segments.slice(2)].join('/');

  const query = (operation.parameters ?? [])
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => ({
      key: parameter.name,
      value: String(parameter.schema?.example ?? parameter.schema?.default ?? ''),
      description: [
        parameter.description,
        parameter.schema?.enum ? `one of: ${parameter.schema.enum.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' — '),
      // Optional filters ship disabled so the request works as-is.
      disabled: parameter.required !== true,
    }));

  const isPublic = !operation.security || operation.security.length === 0;

  const item: PostmanRequestItem = {
    name: operation.summary ?? `${method.toUpperCase()} ${path}`,
    request: {
      method: method.toUpperCase(),
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: {
        raw:
          query.length > 0
            ? `${rawPath}?${query.map((q) => `${q.key}=${q.value}`).join('&')}`
            : rawPath,
        host: ['{{baseUrl}}'],
        path: ['{{apiPrefix}}', ...segments.slice(2)],
        ...(query.length > 0 ? { query } : {}),
      },
      ...(operation.description ? { description: operation.description } : {}),
      ...(isPublic ? { auth: { type: 'noauth' as const } } : {}),
    },
  };

  const bodySchema = operation.requestBody?.content?.['application/json']?.schema?.$ref;
  if (bodySchema) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(exampleFor(bodySchema, document), null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  // Login and refresh feed the collection variables the other requests use, so
  // the whole collection is usable after one click rather than a copy-paste.
  const capturesTokens = path.endsWith('/auth/login') || path.endsWith('/auth/refresh');
  if (capturesTokens) {
    item.event = [
      { listen: 'test', script: { type: 'text/javascript', exec: TOKEN_CAPTURE_SCRIPT } },
    ];
  }

  return item;
}

const TOKEN_CAPTURE_SCRIPT = [
  'const body = pm.response.json();',
  '',
  'if (body.success && body.data && body.data.accessToken) {',
  "  pm.collectionVariables.set('accessToken', body.data.accessToken);",
  "  pm.collectionVariables.set('refreshToken', body.data.refreshToken);",
  "  pm.test('tokens captured', () => pm.expect(body.data.accessToken).to.be.a('string'));",
  '}',
];

interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject & { $ref?: string }>;
  required?: string[];
  example?: unknown;
  default?: unknown;
  enum?: string[];
  items?: SchemaObject & { $ref?: string };
  $ref?: string;
  format?: string;
  // A nullable object reference is emitted as `allOf: [{ $ref }]` rather than a
  // bare `$ref`, so the example builder has to unwrap the composition keywords.
  allOf?: Array<SchemaObject & { $ref?: string }>;
  oneOf?: Array<SchemaObject & { $ref?: string }>;
  anyOf?: Array<SchemaObject & { $ref?: string }>;
}

/** Builds a minimal example body from a component schema. */
function exampleFor(ref: string, document: OpenApiDocument, depth = 0): unknown {
  const name = ref.replace('#/components/schemas/', '');
  const schemas = (document.components?.schemas ?? {}) as Record<string, SchemaObject>;
  const schema = schemas[name];

  if (!schema || depth > 3) {
    return {};
  }

  return exampleForSchema(schema, document, depth);
}

function exampleForSchema(schema: SchemaObject, document: OpenApiDocument, depth: number): unknown {
  if (schema.$ref) {
    return exampleFor(schema.$ref, document, depth + 1);
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  // `allOf`/`oneOf`/`anyOf` wrap a reference; the first branch is representative
  // enough for an example body, and without this a nested DTO renders as null.
  const composed = schema.allOf ?? schema.oneOf ?? schema.anyOf;
  if (composed?.length) {
    return exampleForSchema(composed[0], document, depth + 1);
  }

  if (schema.enum?.length) {
    return schema.enum[0];
  }

  switch (schema.type) {
    case 'array':
      return schema.items ? [exampleForSchema(schema.items, document, depth + 1)] : [];
    case 'object': {
      const result: Record<string, unknown> = {};
      for (const [key, property] of Object.entries(schema.properties ?? {})) {
        result[key] = exampleForSchema(property, document, depth + 1);
      }
      return result;
    }
    case 'number':
    case 'integer':
      return schema.default ?? 0;
    case 'boolean':
      return schema.default ?? false;
    case 'string':
      return schema.default ?? (schema.format === 'date-time' ? new Date().toISOString() : '');
    default: {
      if (schema.properties) {
        const result: Record<string, unknown> = {};
        for (const [key, property] of Object.entries(schema.properties)) {
          result[key] = exampleForSchema(property, document, depth + 1);
        }
        return result;
      }
      return null;
    }
  }
}

main().catch((error: unknown) => {
  console.error('✖ Failed to generate the collection:', error);
  process.exitCode = 1;
});
