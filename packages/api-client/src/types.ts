/**
 * Transport-agnostic types for the Memora HTTP client.
 *
 * Nothing here imports `zod` or React: a response schema only needs `parse`,
 * so any Zod schema from `@memora/shared` satisfies {@link StructuralValidator}
 * without adding a runtime dependency on it.
 */

/** HTTP methods used by the Memora API. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Structural validator accepted for successful responses.
 *
 * A schema only has to turn untrusted input into `T` and throw when the input
 * does not match the contract. Zod schemas implement this shape.
 */
export interface StructuralValidator<T> {
  parse(input: unknown): T;
}

/** Scalar value accepted inside a query parameter. */
export type QueryPrimitive = string | number | boolean;

/**
 * Value accepted for a single query parameter.
 *
 * `null` and `undefined` are skipped, and arrays are serialized as repeated
 * keys (`?tag=a&tag=b`).
 */
export type QueryValue = QueryPrimitive | null | undefined | readonly QueryPrimitive[];

/** Query parameters for a request. Key order is preserved. */
export type QueryParams = Readonly<Record<string, QueryValue>>;

/**
 * Minimal `fetch` surface compatible with the global in browsers and Node.
 *
 * Tests inject a stub with this shape; production code uses `globalThis.fetch`.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Options shared by every request. */
export interface RequestOptions<T> {
  /** Validator for the successful body. For `204`/empty bodies use `emptyResponseSchema`. */
  readonly schema: StructuralValidator<T>;
  /** HTTP method. Defaults to `GET`. */
  readonly method?: HttpMethod;
  /** Query parameters, serialized deterministically. */
  readonly query?: QueryParams;
  /** Body serialized as JSON. Omit or pass `undefined` for no body. */
  readonly body?: unknown;
  /** Extra request headers, e.g. a CSRF token. Merged with the defaults. */
  readonly headers?: HeadersInit;
  /** Abort signal, propagated to `fetch` unchanged. */
  readonly signal?: AbortSignal;
}

/** Options for the method shortcuts, where the method is fixed by the helper. */
export type RequestConfig<T> = Omit<RequestOptions<T>, 'method' | 'body'>;

/** Options accepted by {@link createApiClient}. */
export interface ApiClientOptions {
  /**
   * Base URL or path for the API. Defaults to {@link DEFAULT_API_BASE_PATH}.
   * Accepts `/api`, `/api/` or an absolute URL such as `http://127.0.0.1:3001`
   * so the same client works in the browser and during SSR.
   */
  readonly basePath?: string;
  /** `fetch` implementation. Defaults to the global one. */
  readonly fetch?: FetchLike;
}

/**
 * Typed Memora API client.
 *
 * Requests are sent with `credentials: 'include'` so the session cookie
 * travels with them. Authentication, CSRF and caching live above this layer.
 */
export interface ApiClient {
  /** Normalized base path or URL, without a trailing slash. */
  readonly basePath: string;

  /**
   * Sends a request and validates the successful body with `options.schema`.
   *
   * Resolves with `undefined` for `204`, `205`, `Content-Length: 0` and empty
   * bodies, without attempting to parse JSON.
   *
   * @throws {ApiError} when the response is not 2xx and its body matches the
   * canonical error contract.
   * @throws {ApiTransportError} on network failures, invalid JSON, rejected
   * response schemas or non-canonical error bodies.
   */
  request<T>(path: string, options: RequestOptions<T>): Promise<T>;

  /** `GET` shortcut. */
  get<T>(path: string, config: RequestConfig<T>): Promise<T>;

  /** `POST` shortcut with a JSON body. */
  post<T>(path: string, body: unknown, config: RequestConfig<T>): Promise<T>;

  /** `PUT` shortcut with a JSON body. */
  put<T>(path: string, body: unknown, config: RequestConfig<T>): Promise<T>;

  /** `PATCH` shortcut with a JSON body. */
  patch<T>(path: string, body: unknown, config: RequestConfig<T>): Promise<T>;

  /** `DELETE` shortcut. */
  delete<T>(path: string, config: RequestConfig<T>): Promise<T>;
}
