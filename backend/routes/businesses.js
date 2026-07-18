const express = require('express')
const router = express.Router()
const places = require('../services/placesService')

/**
 * Find Businesses — "get business connections".
 * Searches real businesses by type + location and returns name, phone,
 * address, website (and best-effort email). Data comes from Google Places,
 * never the LLM, so the contacts are real and callable.
 */
router.post('/search', async (req, res) => {
  const { type, location, cuisine, wantEmail } = req.body || {}

  if (!type?.trim() || !location?.trim()) {
    return res.status(400).json({ error: 'Both "type" and "location" are required.' })
  }

  // e.g. "Indian restaurants in Mississauga, Ontario"
  const query = [cuisine?.trim(), type.trim(), 'in', location.trim(), 'Ontario, Canada']
    .filter(Boolean)
    .join(' ')

  try {
    let results = await places.findBusinesses({ query })

    let emailsAttempted = false
    if (wantEmail && results.length) {
      results = await places.enrichEmails(results)
      emailsAttempted = true
    }

    res.json({
      success: true,
      query,
      count: results.length,
      emailsAttempted,
      results,
    })
  } catch (err) {
    console.error('[businesses]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
