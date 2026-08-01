const express = require('express')
const router = express.Router()
const heygen = require('../services/heygenService')
const { callOpenAIChat } = require('../services/openaiService')

/**
 * Video Studio — turns a listing into a Swetha avatar video via HeyGen.
 *   POST /script   → write a spoken video script from listing details (OpenAI)
 *   POST /generate → submit the script to HeyGen, get a video_id
 *   GET  /status   → poll HeyGen until the video URL is ready
 */

const SCRIPT_SYSTEM = `You write short spoken video scripts for real-estate listing videos presented by an agent from Pabba Realty in the Toronto GTA.
The script will be read aloud by an avatar, so:
- Write ONLY the words to be spoken — no stage directions, camera notes, or labels.
- Keep it 90-130 words (about 30-45 seconds).
- Warm, natural, first person. Open with a hook, cover the key features, end with a clear call to contact the agent.
- Use only the details provided; never invent facts.`

router.post('/script', async (req, res) => {
  const d = req.body || {}
  if (!d.details?.trim() && !d.address?.trim()) {
    return res.status(400).json({ error: 'Provide listing details or an address to write a script.' })
  }
  const prompt = `Write a spoken listing-video script from these details:
${[d.address && `Address/Area: ${d.address}`, d.price && `Price: ${d.price}`, d.details && `Details: ${d.details}`, `Agent: ${d.agentName || 'Swetha Pulluri-Pabba'}, Pabba Realty`].filter(Boolean).join('\n')}`

  try {
    const script = await callOpenAIChat(
      [{ role: 'system', content: SCRIPT_SYSTEM }, { role: 'user', content: prompt }],
      { maxTokens: 400, temperature: 0.7 }
    )
    res.json({ success: true, script })
  } catch (err) {
    console.error('[video:script]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.post('/generate', async (req, res) => {
  const { script, title } = req.body || {}
  if (!script?.trim()) {
    return res.status(400).json({ error: 'A script is required to generate the video.' })
  }
  if (script.length > 1500) {
    return res.status(400).json({ error: 'Script is too long — keep it under ~1500 characters (about 60 seconds).' })
  }
  try {
    const videoId = await heygen.generateFromTemplate(script.trim(), title)
    res.json({ success: true, videoId })
  } catch (err) {
    console.error('[video:generate]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.get('/status', async (req, res) => {
  const videoId = req.query.video_id
  if (!videoId) return res.status(400).json({ error: 'video_id is required.' })
  try {
    res.json({ success: true, ...(await heygen.getStatus(videoId)) })
  } catch (err) {
    console.error('[video:status]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
