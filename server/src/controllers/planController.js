// HTTP handlers for the plan: read the request, call the service, send the response.
// `req.params` ({ day, slot }) and `req.body` have already been validated by the routes.

function createPlanController(planService) {
  return {
    list(req, res) {
      res.json(planService.list())
    },

    set(req, res) {
      res.json(planService.set(req.params, req.body))
    },

    remove(req, res) {
      planService.remove(req.params)
      res.status(204).end()
    },
  }
}

module.exports = { createPlanController }
