// Not-found and error handlers so every API error has the same JSON shape:
// { error: { code, message, details? } }
const { HttpError } = require('../errors')

function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
}

// Express recognises error handlers by their four arguments, so keep `next`.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } })
  }
  // express.json() raises a 4xx for broken JSON bodies.
  if (err.status && err.status < 500) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'That request could not be read' } })
  }
  console.error(err)
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong' } })
}

module.exports = { notFound, errorHandler }
