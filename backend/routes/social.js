const express = require('express')
const router = express.Router()
const { callOpenAIJson } = require('../services/openaiService')

/**
 * Social Post Studio — generates a ready-to-post daily social media update:
 * a Facebook post, an Instagram caption, hashtags, and poster text (headline +
 * subtext + call-to-action) the agent can drop onto a graphic.
 */
const SYSTEM_PROMPT = `You are the social-media manager for Pabba Realty, a real-estate brokerage in the Toronto GTA.
You create engaging, authentic daily posts for Facebook and Instagram.

Rules:
- Use ONLY the details provided. Never invent a listing, price, address, or statistic.
- Match the requested post type and keep it genuine — no fake urgency or clickbait.
- Instagram caption: friendly, a few tasteful emojis, a clear call to action.
- Facebook post: slightly longer and more informative.
- Poster text must be very short (fits on an image): a punchy headline, one line of
  subtext, and a short call-to-action.
- Return ONLY valid JSON, no markdown fences.`

const JSON_SHAPE = `{
  "facebook": "The Facebook post text",
  "instagram": "The Instagram caption",
  "hashtags": ["#GTARealEstate", "#..."],
  "poster": { "headline": "3-5 word headline", "subtext": "one short line", "cta": "e.g. Call today" }
}`

function langLine(language) {
  if (language === 'Telugu')
    return 'Write in Telugu cultural style using Roman/English script (transliterated, readable by anyone), mixed with English. Audience: Telugu families in the GTA.'
  if (language === 'Hinglish')
    return 'Write in Hinglish (Hindi + English), Hindi words in Roman script. Warm desi tone for the GTA South Asian community.'
  return 'Write in clear, friendly English.'
}

function buildPrompt(d) {
  const facts = [
    d.postType && `Post type: ${d.postType}`,
    d.area && `Area/City: ${d.area}`,
    d.details && `Details/context: ${d.details}`,
    `Brand: ${d.brokerage || 'Pabba Realty'} — Agent: ${d.agentName || 'Srinivas Pabba'}`,
    `Contact: ${d.phone || '+1 647-740-8124'}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `Create a social media post from these details:

${facts}

${langLine(d.language)}

Return JSON in exactly this shape:
${JSON_SHAPE}`
}

router.post('/generate', async (req, res) => {
  const d = req.body || {}
  if (!d.postType) {
    return res.status(400).json({ error: 'Choose a post type.' })
  }
  try {
    const result = await callOpenAIJson(SYSTEM_PROMPT, buildPrompt(d), { temperature: 0.85, maxTokens: 900 })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[social]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
