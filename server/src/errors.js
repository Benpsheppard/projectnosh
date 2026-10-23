// HttpError: throw this from a service or middleware to send a specific status and message.
// The error handler turns it into the standard { error: { code, message, details } } response.

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

module.exports = { HttpError }
