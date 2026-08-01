const express = require('express')
const router = express.Router()
const { callOpenAIChat } = require('../services/openaiService')

/**
 * HouzGPT — a real-estate Q&A assistant for the Pabba Realty team and clients,
 * focused on the Toronto GTA market (TRREB), Canadian buying/selling process,
 * mortgages, taxes (LTT), and newcomer/immigrant questions.
 */
const SYSTEM_PROMPT = `You are HouzGPT, a knowledgeable real-estate assistant for Pabba Realty, a TRREB-licensed brokerage serving the Toronto GTA (Mississauga, Brampton, Scarborough, North York, Etobicoke).

Your job: answer buyer, seller, and investor questions clearly and practically.
You are strong on: the GTA/Ontario market, the Canadian buying and selling process,
mortgages and pre-approval, land transfer tax (Ontario + Toronto), closing costs,
first-time buyer programs, pre-construction, and questions common to South Asian
newcomer communities (Telugu, Tamil, Hindi/Punjabi families settling in the GTA).

Rules:
- Be concise and specific. Use short paragraphs or bullet points.
- Give real, current-as-of-your-knowledge guidance, but for exact figures (tax
  rates, rebate amounts, current interest rates, specific listing prices) tell the
  user to confirm with the agent or the official source — do not invent precise
  numbers you are unsure of.
- When money, legal, or tax specifics matter, recommend confirming with Srinivas
  Pabba (Pabba Realty) or a licensed mortgage/legal professional.
- Never fabricate MLS listings, addresses, or prices.
- If asked something outside real estate, gently steer back.
- Keep answers under ~200 words unless the user asks for detail.`

router.post('/chat', async (req, res) => {
  const { messages } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' })
  }

  // Keep only role/content, restrict roles, and cap history so the prompt
  // can't grow unbounded across a long conversation.
  const history = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))

  if (!history.length) {
    return res.status(400).json({ error: 'No valid user/assistant messages provided.' })
  }

  try {
    const reply = await callOpenAIChat([{ role: 'system', content: SYSTEM_PROMPT }, ...history])
    res.json({ success: true, reply })
  } catch (err) {
    console.error('[houzgpt]', err.message)
    res.status(err.status || 500).json({ error: err.message })
  }
})

module.exports = router
