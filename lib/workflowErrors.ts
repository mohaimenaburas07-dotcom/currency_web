// lib/workflowErrors.ts
// Typed errors for the workflow state machine.
// Use these so API routes can return proper HTTP status codes.

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "WorkflowError"
  }
}

export class SessionNotFoundError extends WorkflowError {
  constructor(id: string) {
    super(`Execution session '${id}' not found`, "SESSION_NOT_FOUND", 404)
  }
}

export class InvalidStateTransitionError extends WorkflowError {
  constructor(from: string, to: string) {
    super(
      `Invalid state transition: ${from} → ${to}`,
      "INVALID_STATE_TRANSITION",
      409
    )
  }
}

export class SessionAlreadyCompletedError extends WorkflowError {
  constructor() {
    super("This session is already completed or cancelled", "SESSION_ALREADY_FINAL", 409)
  }
}

export class ValidationError extends WorkflowError {
  constructor(message: string) {
    super(message, "VALIDATION_FAILED", 422)
  }
}

// Helper: convert any error to a JSON response body
export function toErrorResponse(err: unknown): { error: string; code?: string } {
  if (err instanceof WorkflowError) {
    return { error: err.message, code: err.code }
  }
  if (err instanceof Error) {
    return { error: err.message }
  }
  return { error: "An unexpected error occurred" }
}
