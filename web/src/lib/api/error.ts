/** HTTP status from an RTK Query error, if it has one. */
export function httpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

/** True when the request was rejected for a bad/missing bearer token. */
export function isAuthError(err: unknown): boolean {
  return httpStatus(err) === 401;
}

/** Pull the API's `{ error: { message } }` text out of an RTK Query error. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const inner = (data as { error?: { message?: string } }).error;
      if (inner?.message) return inner.message;
    }
  }
  return fallback;
}
