const express = require('express')
const router = express.Router()
const { callOpenAIJson } = require('../services/openaiService')
const supabase = require('../services/supabaseService')

const SYSTEM_PROMPT = `You are REAAMusic, an AI songwriter for real estate listings.
You write emotionally compelling, memorable songs that make sellers proud and buyers curious.

Every song must:
- Mention the specific property address or area
- Include at least 2 specific property features
- Have a catchy, repeatable chorus/hook
- Mention the agent name or brokerage subtly
- Feel warm, positive, and community-focused

Return ONLY valid JSON. No markdown, no commentary.`

const JSON_SHAPE = `{
  "title": "Song title",
  "verse1": "...",
  "chorus": "...",
  "verse2": "...",
  "bridge": "...",
  "outro": "...",
  "hook": "The single most catchy line",
  "mood": "Two or three words"
}`

/**
 * Language selects the writing style; genre is the musical flavour applied
 * within it. So "Telugu genre + English language" is an English song with
 * Telugu cultural warmth, rather than one field silently overriding the other.
 */
function buildPrompt({ address, genre, language, highlights, agentName, brokerage }) {
  const base = `Property: ${address}
Highlights: ${highlights?.trim() || 'Not provided — infer tasteful, generic features'}
Agent: ${agentName || 'the agent'} from ${brokerage || 'the brokerage'}
Musical genre: ${genre}`

  if (language === 'Hinglish') {
    return `${base}

Write a Hinglish ${genre} song about this property.
Mix Hindi and English naturally. Use warm desi phrases: yaar, bhai, dil se, apna ghar.
Make it sound like a Bollywood-inspired real estate song.
The community is South Asian Indians in Toronto GTA, Canada.
Write Hindi words in Roman script (transliterated), not Devanagari.

Return JSON in exactly this shape:
${JSON_SHAPE}`
  }

  if (language === 'Telugu') {
    return `${base}

Write a Telugu-flavoured ${genre} song about this property.
Use Telugu cultural warmth and community connection.
Reference Telugu families finding their home in Canada's GTA.
Mix Telugu phrases with English naturally.
Write Telugu words in Roman script (transliterated), not Telugu script — the
lyrics are sung, so they must be readable aloud by a non-Telugu reader.

Return JSON in exactly this shape:
${JSON_SHAPE}`
  }

  return `${base}

Write an emotional English ${genre} song about this property.
Make it warm, memorable, and perfect for Instagram Reels and TikTok.

Return JSON in exactly this shape:
${JSON_SHAPE}`
}

router.post('/generate', async (req, res) => {
  const { address, genre, language, highlights, agentName, brokerage, phone } = req.body || {}

  const missing = []
  if (!address?.trim()) missing.push('address')
  if (!genre) missing.push('genre')
  if (!language) missing.push('language')
  if (missing.length) {
    return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` })
  }

  try {
    const song = await callOpenAIJson(
      SYSTEM_PROMPT,
      buildPrompt({ address, genre, language, highlights, agentName, brokerage })
    )

    // Persist if Supabase is wired up. A DB failure is logged, not fatal —
    // the caller still gets the lyrics they waited for.
    let persisted = false
    if (supabase.isConfigured()) {
      const { error } = await supabase.insert('songs', {
        address,
        genre,
        language,
        title: song.title,
        lyrics_json: song,
      })
      if (error) console.warn('[reaamusic] Supabase insert failed:', error)
      else persisted = true
    }

    res.json({ success: true, song, persisted })
  } catch (err) {
    console.error('[reaamusic]', err.message, err.raw ? `\nRaw: ${err.raw.slice(0, 300)}` : '')
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.get('/history', async (_req, res) => {
  const { data, error } = await supabase.selectAll('songs', { limit: 20 })
  if (error) return res.status(500).json({ error })
  res.json({ songs: data })
})

module.exports = router
