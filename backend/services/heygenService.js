/**
 * HeyGen video generation via a pre-built template.
 *
 * The client set up a "Swetha Sitting Template 1" whose only variable is
 * `script_text` (Swetha's cloned voice is already baked into the template),
 * so generating a branded listing video only needs the spoken script.
 *
 * Generation is async: submit → get a video_id → poll status until the
 * rendered video URL is ready (usually 1-3 minutes).
 */
const API = 'https://api.heygen.com'
const DEFAULT_TEMPLATE = 'ca65db63001f4ff98a09b156c1259b77' // Swetha Sitting Template 1

function getKey() {
  return process.env.HEYGEN_API_KEY || ''
}

function isConfigured() {
  return !!getKey()
}

function getTemplateId() {
  return process.env.HEYGEN_TEMPLATE_ID || DEFAULT_TEMPLATE
}

// Templates rarely change, so cache their variable definitions in memory.
const _templateVarCache = {}

async function getTemplateVariables(templateId, key) {
  if (_templateVarCache[templateId]) return _templateVarCache[templateId]
  const r = await fetch(`${API}/v2/template/${templateId}`, { headers: { 'X-Api-Key': key } })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data?.error?.message || `HeyGen returned ${r.status} reading the template`)
    err.status = 502
    throw err
  }
  const vars = data?.data?.variables || {}
  _templateVarCache[templateId] = vars
  return vars
}

/**
 * Fill the template's variables with the script. A 'voice' variable takes the
 * spoken text as input_text (keeping the template's own voice_id); a 'text'
 * variable takes it as content.
 */
function buildVariables(templateVars, script) {
  const out = {}
  for (const [name, def] of Object.entries(templateVars || {})) {
    if (def.type === 'voice') {
      out[name] = { name, type: 'voice', properties: { voice_id: def.properties?.voice_id, input_text: script } }
    } else if (def.type === 'text') {
      out[name] = { name, type: 'text', properties: { content: script } }
    }
  }
  if (!Object.keys(out).length) {
    out.script_text = { name: 'script_text', type: 'voice', properties: { input_text: script } }
  }
  return out
}

async function generateFromTemplate(script, title) {
  const key = getKey()
  if (!key) {
    const err = new Error('HEYGEN_API_KEY is not set in backend/.env.')
    err.status = 503
    throw err
  }

  const templateVars = await getTemplateVariables(getTemplateId(), key)
  const body = {
    test: false,
    title: title || 'REAA Listing Video',
    variables: buildVariables(templateVars, script),
  }

  let r
  try {
    r = await fetch(`${API}/v2/template/${getTemplateId()}/generate`, {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const err = new Error(`Could not reach HeyGen: ${e.message}`)
    err.status = 502
    throw err
  }

  const data = await r.json().catch(() => ({}))
  if (!r.ok || data?.error) {
    const err = new Error(data?.error?.message || data?.message || `HeyGen returned ${r.status}`)
    err.status = 502
    throw err
  }

  const videoId = data?.data?.video_id
  if (!videoId) {
    const err = new Error('HeyGen accepted the request but returned no video_id.')
    err.status = 502
    throw err
  }
  return videoId
}

async function getStatus(videoId) {
  const key = getKey()
  let r
  try {
    r = await fetch(`${API}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, {
      headers: { 'X-Api-Key': key },
    })
  } catch (e) {
    const err = new Error(`Could not reach HeyGen: ${e.message}`)
    err.status = 502
    throw err
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data?.error?.message || data?.message || `HeyGen returned ${r.status}`)
    err.status = 502
    throw err
  }
  const d = data?.data || {}
  return {
    status: d.status, // pending | processing | completed | failed
    videoUrl: d.video_url || '',
    thumbnailUrl: d.thumbnail_url || '',
    error: d.error?.message || d.error || null,
  }
}

module.exports = { isConfigured, generateFromTemplate, getStatus, getTemplateId }
