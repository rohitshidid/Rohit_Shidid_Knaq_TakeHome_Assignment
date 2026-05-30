export interface ErrorBody {
  error: { code: string; message: string };
}

/** Build the consistent error envelope every endpoint returns on failure. */
export function errorBody(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}

/** Throw from any handler to produce a specific HTTP status + envelope. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
