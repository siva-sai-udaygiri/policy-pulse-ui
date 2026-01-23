import { ApiError, type ProblemDetails } from "./problemDetails";


type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function safeParseJson(response: Response): Promise<unknown | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function toProblemDetails(payload: unknown): ProblemDetails | undefined {
  if (!isObject(payload)) return undefined;

  // Keep it permissive; we only map known fields.
  const pd: ProblemDetails = {
    type: typeof payload.type === "string" ? payload.type : undefined,
    title: typeof payload.title === "string" ? payload.title : undefined,
    status: typeof payload.status === "number" ? payload.status : undefined,
    detail: typeof payload.detail === "string" ? payload.detail : undefined,
    instance: typeof payload.instance === "string" ? payload.instance : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
    path: typeof payload.path === "string" ? payload.path : undefined,
    traceId: typeof payload.traceId === "string" ? payload.traceId : undefined,
    correlationId:
      typeof payload.correlationId === "string" ? payload.correlationId : undefined,
    errors: isObject(payload.errors) ? (payload.errors as Record<string, string[]>) : undefined,
  };

  // If it has none of the meaningful fields, treat it as not a ProblemDetails.
  const hasAny =
    pd.type || pd.title || pd.status || pd.detail || pd.instance || pd.path || pd.traceId;

  return hasAny ? pd : undefined;
}

/**
 * Basic typed request:
 * - Returns T for success (2xx)
 * - Throws ApiError for non-2xx (with parsed ProblemDetails if present)
 */
export async function http<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const payload = await safeParseJson(response);

    if (!response.ok) {
      const problem = toProblemDetails(payload);
      const message =
        problem?.detail ||
        problem?.title ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, problem);
    }

    // If no JSON body, return undefined as T (caller can use void)
    return (payload as T) ?? (undefined as T);
  } catch (err) {
    // Timeout/abort is common and should be normalized
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408);
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
