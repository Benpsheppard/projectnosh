// Validates the request (the body by default, or the URL params) against a shared zod schema
// before the controller runs. On success it is replaced with the cleaned data
// (trimmed, defaults filled in, strings turned into numbers).
const { HttpError } = require('../errors')

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Please check what you entered and try again', details))
    }
    req[source] = result.data
    next()
  }
}

module.exports = { validate }
