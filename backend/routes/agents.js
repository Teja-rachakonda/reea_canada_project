const express = require('express')
const router = express.Router()
const { callOpenAIJson } = require('../services/openaiService')

/**
 * Listing Agent AI + Buyer Agent AI.
 * Two OpenAI-powered writing tools for the daily work of a realtor:
 *   POST /listing → a polished MLS listing description
 *   POST /buyer   → a personalized "why this home fits you" note for a buyer
 * Both use only the details provided — no invented facts, no fair-housing risk.
 */

const LISTING_SYSTEM = `You are an expert real-estate listing copywriter for Pabba Realty in the Toronto GTA.
Write compelling, accurate MLS-style listing descriptions.

Rules:
- Use ONLY the details provided. Never invent square footage, features, schools, or numbers.
- Follow fair-housing rules: describe the PROPERTY, never the ideal buyer's race, religion,
  family status, or nationality. No "perfect for a [group]" language.
- Sound professional and inviting, not spammy. No ALL CAPS shouting.
- Return ONLY valid JSON, no markdown fences.`

const BUYER_SYSTEM = `You are a helpful buyer's-agent assistant for Pabba Realty in the Toronto GTA.
Write a warm, honest, personalized note to a buyer explaining how a specific property fits the needs they described.

Rules:
- Use ONLY the details provided. Never invent property features or facts.
- Be genuinely honest: if there is an obvious trade-off vs their stated needs, name it kindly.
- Encourage them to book a viewing with the agent; do not pressure.
- Return ONLY valid JSON, no markdown fences.`

const LISTING_SHAPE = `{
  "title": "A catchy listing headline",
  "description": "The full listing description, 1-3 short paragraphs",
  "bullets": ["Key feature", "Key feature", "..."],
  "social_caption": "A short caption version for Instagram/Facebook with 3-5 hashtags"
}`

const BUYER_SHAPE = `{
  "message": "A warm personalized note (2-3 short paragraphs) the agent can send the buyer",
  "fit_points": ["How the property meets a stated need", "..."],
  "considerations": ["An honest thing for the buyer to check or weigh", "..."]
}`

function langLine(language) {
  if (language === 'Telugu')
    return 'Write in Telugu cultural style using Roman/English script (transliterated, readable by anyone), mixed with English. Audience: Telugu families in the GTA.'
  if (language === 'Hinglish')
    return 'Write in Hinglish (Hindi + English), Hindi words in Roman script. Warm desi tone for the GTA South Asian community.'
  return 'Write in clear, professional English.'
}

function listingPrompt(d) {
  const facts = [
    d.address && `Address/Area: ${d.address}`,
    d.price && `Price: ${d.price}`,
    d.propertyType && `Type: ${d.propertyType}`,
    d.beds && `Bedrooms: ${d.beds}`,
    d.baths && `Bathrooms: ${d.baths}`,
    d.sqft && `Approx sqft: ${d.sqft}`,
    d.features && `Features: ${d.features}`,
    d.tone && `Tone: ${d.tone}`,
    d.length && `Length: ${d.length}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `Write a listing description from these details:

${facts}

${langLine(d.language)}

Return JSON in exactly this shape:
${LISTING_SHAPE}`
}

function buyerPrompt(d) {
  const facts = [
    d.buyerName && `Buyer name: ${d.buyerName}`,
    d.buyerNeeds && `Buyer's stated needs: ${d.buyerNeeds}`,
    d.budget && `Buyer's budget: ${d.budget}`,
    d.property && `Property being considered: ${d.property}`,
    d.propertyFeatures && `Property details/features: ${d.propertyFeatures}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `Write a personalized note to this buyer about the property:

${facts}

${langLine(d.language)}

Return JSON in exactly this shape:
${BUYER_SHAPE}`
}

router.post('/listing', async (req, res) => {
  const d = req.body || {}
  if (!d.address?.trim() && !d.features?.trim()) {
    return res.status(400).json({ error: 'Provide at least an address/area or some features.' })
  }
  try {
    const result = await callOpenAIJson(LISTING_SYSTEM, listingPrompt(d), { temperature: 0.75, maxTokens: 1100 })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[agents:listing]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.post('/buyer', async (req, res) => {
  const d = req.body || {}
  if (!d.buyerNeeds?.trim() || !d.property?.trim()) {
    return res.status(400).json({ error: "Provide the buyer's needs and the property being considered." })
  }
  try {
    const result = await callOpenAIJson(BUYER_SYSTEM, buyerPrompt(d), { temperature: 0.75, maxTokens: 1000 })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[agents:buyer]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
