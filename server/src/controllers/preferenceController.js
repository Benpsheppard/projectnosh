// HTTP handlers for preferences: read the request, call the service, send the response.

function createPreferenceController(preferenceService) {
  return {
    get(req, res) {
      res.json(preferenceService.get())
    },

    update(req, res) {
      res.json(preferenceService.update(req.body))
    },
  }
}

module.exports = { createPreferenceController }
