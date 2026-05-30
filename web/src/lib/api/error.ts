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
