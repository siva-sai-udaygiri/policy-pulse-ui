/**
 * Spring Boot friendly error model.
 * - Spring Boot 3 can return RFC7807 ProblemDetail fields: type/title/status/detail/instance
 * - Many APIs add extras like timestamp, path, traceId, and validation errors.
 */
export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;

  // Common extras (optional)
  timestamp?: string;
  path?: string;
  traceId?: string;
  correlationId?: string;

  // Validation errors (common pattern)
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}
