const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o'

/**
 * Call OpenAI and return parsed JSON.
 *
 * json_object mode is used because the caller always wants structured output.
 * Without it gpt-4o sometimes wraps its reply in ```json fences, which makes
 * JSON.parse throw on an otherwise-good response.
 */
async function callOpenAIJson(systemPrompt, userPrompt, { maxTokens = 2000, temperature = 0.85 } = {}) {
  if (!isConfigured()) {
    const err = new Error('OPENAI_API_KEY is missing or invalid in backend/.env (it should start with "sk-")')
    err.status = 500
    throw err
  }
  const apiKey = process.env.OPENAI_API_KEY

  let response
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
    })
  } catch (cause) {
    const err = new Error(`Could not reach OpenAI: ${cause.message}`)
    err.status = 502
    throw err
  }

  const data = await response.json()

  if (!response.ok) {
    const err = new Error(data?.error?.message || `OpenAI returned ${response.status}`)
    err.status = 502
    throw err
  }

  const raw = data?.choices?.[0]?.message?.content
  if (!raw) {
    const err = new Error('OpenAI returned an empty response.')
    err.status = 502
    throw err
  }

  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('OpenAI did not return valid JSON.')
    err.status = 500
    err.raw = raw
    throw err
  }
}

/**
 * A key must look like a real OpenAI key, not just be non-empty. Placeholder
 * values ("your-key-here") are common in copied .env files and would otherwise
 * report as configured, then fail at request time with a bare 401.
 */
function isConfigured() {
  const key = process.env.OPENAI_API_KEY || ''
  return key.startsWith('sk-') && key.length > 20
}

module.exports = { callOpenAIJson, isConfigured, MODEL }
