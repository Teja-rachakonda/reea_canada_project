const express = require('express')
const router = express.Router()
const places = require('../services/placesService')
const osm = require('../services/osmService')
const { enrichEmails } = require('../services/placesService')

/**
 * Find Businesses — "get business connections".
 * Searches real businesses by type + location and returns name, phone,
 * address, website (and best-effort email). Data comes from a maps provider,
 * never the LLM, so the contacts are real and callable.
 *
 * Provider selection (BUSINESS_PROVIDER in .env):
 *   'osm'    → OpenStreetMap (free, no key, no card)   ← default when no Google key
 *   'google' → Google Places (better coverage, needs a billing-enabled key)
 * With no setting, use Google if a key is configured, otherwise fall back to OSM.
 */
function pickProvider() {
  const choice = (process.env.BUSINESS_PROVIDER || '').toLowerCase()
  if (choice === 'osm') return { name: 'osm', svc: osm }
  if (choice === 'google') return { name: 'google', svc: places }
  return places.isConfigured() ? { name: 'google', svc: places } : { name: 'osm', svc: osm }
}

router.post('/search', async (req, res) => {
  const { type, location, cuisine, wantEmail } = req.body || {}

  if (!type?.trim() || !location?.trim()) {
    return res.status(400).json({ error: 'Both "type" and "location" are required.' })
  }

  const { name: provider, svc } = pickProvider()

  try {
    let results = await svc.findBusinesses({ type: type.trim(), location: location.trim(), cuisine: cuisine?.trim() })

    let emailsAttempted = false
    if (wantEmail && results.length) {
      results = await enrichEmails(results)
      emailsAttempted = true
    }

    res.json({
      success: true,
      provider,
      count: results.length,
      emailsAttempted,
      results,
    })
  } catch (err) {
    console.error(`[businesses:${provider}]`, err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
