// One small fetch wrapper used by every API module.
// Failed requests throw an ApiError carrying the server's friendly message and field details.

export class ApiError extends Error {
  constructor(message, details = []) {
    super(message)
    this.details = details // [{ path, message }] for validation errors
  }
}

export async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error?.message ?? 'Something went wrong. Please try again.', body?.error?.details ?? [])
  }
  return res.json()
}
