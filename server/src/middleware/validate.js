// Validates req.body against a shared zod schema before the controller runs.
// On success, req.body is replaced with the cleaned data (trimmed, defaults filled in).
const { HttpError } = require('../errors')

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Please check what you entered and try again', details))
    }
    req.body = result.data
    next()
  }
}

module.exports = { validate }
