// Not-found and error handlers so every API error has the same JSON shape.

// Every error leaves the API in the same shape: { error: { code, message, details? } }

function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
}

// Express recognises error handlers by their four arguments, so keep `next`.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err)
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong' } })
}

module.exports = { notFound, errorHandler }
