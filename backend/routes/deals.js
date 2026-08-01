const express = require('express')
const router = express.Router()
const { callOpenAIJson } = require('../services/openaiService')

/**
 * Deals Alert — turns a property deal into ready-to-send marketing posts.
 * Generates a WhatsApp broadcast message and a Facebook post the agent can
 * copy and share immediately. No fake data: it only uses the details given.
 */
const SYSTEM_PROMPT = `You are the marketing copywriter for Pabba Realty, a real-estate brokerage in the Toronto GTA.
You write short, punchy, emoji-friendly property "deal alert" posts that get people to message the agent on WhatsApp.

Rules:
- Use ONLY the property details provided. Never invent an address, price, feature, or MLS number.
- Make it feel exciting but honest — no fake urgency or false claims.
- Always end with a clear call to action to contact the agent (WhatsApp/phone).
- WhatsApp version: short lines, tasteful emojis, easy to read on a phone.
- Facebook version: a bit more descriptive, still scannable.
- Return ONLY valid JSON, no markdown fences.`

const JSON_SHAPE = `{
  "headline": "One short attention-grabbing line",
  "whatsapp": "The full WhatsApp message, with line breaks (\\n) and emojis",
  "facebook": "The full Facebook post",
  "hashtags": ["#GTARealEstate", "#..."]
}`

function buildPrompt(d) {
  const facts = [
    d.dealType && `Deal type: ${d.dealType}`,
    d.address && `Address/Area: ${d.address}`,
    d.price && `Price: ${d.price}`,
    d.beds && `Bedrooms: ${d.beds}`,
    d.baths && `Bathrooms: ${d.baths}`,
    d.propertyType && `Property type: ${d.propertyType}`,
    d.highlights && `Highlights: ${d.highlights}`,
    d.offer && `Special offer/incentive: ${d.offer}`,
    d.openHouse && `Open house: ${d.openHouse}`,
    `Agent: ${d.agentName || 'Srinivas Pabba'} (${d.brokerage || 'Pabba Realty'})`,
    `Contact: WhatsApp ${d.phone || '+1 647-740-8124'}`,
  ]
    .filter(Boolean)
    .join('\n')

  const langLine =
    d.language === 'Telugu'
      ? 'Write the posts in Telugu cultural style but using Roman/English script (transliterated, readable by anyone) mixed with English. The audience is Telugu families in the GTA.'
      : d.language === 'Hinglish'
        ? 'Write the posts in Hinglish (Hindi + English mixed), Hindi words in Roman script. Warm, desi tone for the GTA South Asian community.'
        : 'Write the posts in clear, friendly English.'

  return `Create a property DEAL ALERT from these details:

${facts}

${langLine}

Return JSON in exactly this shape:
${JSON_SHAPE}`
}

router.post('/generate', async (req, res) => {
  const d = req.body || {}

  // Enough to write a meaningful post — need at least a deal type and either an
  // address/area or some highlights.
  if (!d.dealType || (!d.address?.trim() && !d.highlights?.trim())) {
    return res.status(400).json({ error: 'Provide a deal type and at least an address/area or highlights.' })
  }

  try {
    const result = await callOpenAIJson(SYSTEM_PROMPT, buildPrompt(d), { temperature: 0.8, maxTokens: 900 })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[deals]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
