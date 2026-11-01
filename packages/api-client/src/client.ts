import { errorResponseSchema } from '@memora/shared';

import { DEFAULT_API_BASE_PATH } from './constants.js';
import { ApiError, ApiTransportError } from './errors.js';
import type {
  ApiClient,
  ApiClientOptions,
  FetchLike,
  HttpMethod,
  RequestOptions,
  StructuralValidator,
} from './types.js';
import { buildRequestUrl, normalizeBasePath } from './url.js';

/** Detects an aborted request so it is rethrown instead of wrapped. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

/** Builds the `fetch` init shared by every request. */
function buildRequestInit<T>(method: HttpMethod, options: RequestOptions<T>): RequestInit {
  const headers = new Headers(options.headers);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const init: RequestInit = { method, credentials: 'include', headers };
  if (options.body !== undefined) {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    init.body = JSON.stringify(options.body);
  }
  if (options.signal !== undefined) {
    init.signal = options.signal;
  }
  return init;
}

/**
 * Reads the body as text. `204`/`205` and `Content-Length: 0` skip the read
 * entirely, so no JSON parsing is attempted for empty responses.
 */
async function readResponseText(response: Response): Promise<string> {
  if (response.status === 204 || response.status === 205) {
    return '';
  }
  if (response.headers.get('content-length') === '0') {
    return '';
  }
  try {
    return await response.text();
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiTransportError('network', undefined, { status: response.status, cause: error });
  }
}

/** Turns a non-2xx response into a canonical {@link ApiError} or a transport error. */
function buildErrorResponse(status: number, text: string): ApiError | ApiTransportError {
  if (text.trim() === '') {
    return new ApiTransportError('unexpected-error-response', undefined, { status });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return new ApiTransportError('unexpected-error-response', undefined, { status, cause: error });
  }

  const parsed = errorResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return new ApiTransportError('unexpected-error-response', undefined, {
      status,
      cause: parsed.error,
    });
  }
  return new ApiError(status, parsed.data);
}

/** Parses and validates a successful body, wrapping every failure. */
function parseSuccessBody<T>(text: string, schema: StructuralValidator<T>): T {
  if (text.trim() === '') {
    try {
      return schema.parse(undefined);
    } catch (error) {
      throw new ApiTransportError('invalid-response', undefined, { cause: error });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new ApiTransportError('invalid-json', undefined, { cause: error });
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    throw new ApiTransportError('invalid-response', undefined, { cause: error });
  }
}

/**
 * Creates a typed client for the Memora REST API.
 *
 * The client only knows how to build URLs, send JSON and normalize responses.
 * Session handling, CSRF tokens and query caching live in the layers above.
 * The same instance works in the browser (`/api`) and during SSR, where
 * `apps/web` passes `${API_INTERNAL_URL}/api` as `basePath`.
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const basePath = normalizeBasePath(options.basePath ?? DEFAULT_API_BASE_PATH);
  const fetchImpl: FetchLike =
    options.fetch ??
    ((input, init) => {
      return globalThis.fetch(input, init);
    });

  async function send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetchImpl(url, init);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new ApiTransportError('network', undefined, { cause: error });
    }
  }

  async function request<T>(path: string, requestOptions: RequestOptions<T>): Promise<T> {
    const method = requestOptions.method ?? 'GET';
    const url = buildRequestUrl(basePath, path, requestOptions.query);
    const response = await send(url, buildRequestInit(method, requestOptions));
    const text = await readResponseText(response);

    if (!response.ok) {
      throw buildErrorResponse(response.status, text);
    }
    return parseSuccessBody(text, requestOptions.schema);
  }

  return {
    basePath,
    request,
    get: (path, config) => request(path, { ...config, method: 'GET' }),
    post: (path, body, config) => request(path, { ...config, method: 'POST', body }),
    put: (path, body, config) => request(path, { ...config, method: 'PUT', body }),
    patch: (path, body, config) => request(path, { ...config, method: 'PATCH', body }),
    delete: (path, config) => request(path, { ...config, method: 'DELETE' }),
  };
}
