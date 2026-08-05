import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Generate song lyrics for a listing.
 *
 * The OpenAI call itself runs on the backend (backend/routes/reaamusic.js),
 * which reads OPENAI_API_KEY from its own .env. The key is never sent to,
 * or stored in, the browser.
 */
export async function generateSong(formData) {
  try {
    const { data } = await axios.post(
      `${API_URL}/api/reaamusic/generate`,
      formData,
      { timeout: 90000 }
    )
    if (!data?.song) throw new Error('Backend returned no song data.')
    return data.song
  } catch (err) {
    throw new Error(readError(err))
  }
}

/**
 * Ping /health, retrying to survive a free-tier cold start (Render sleeps after
 * ~15 min idle and takes ~50s to wake). Returns the health payload, or null if
 * it never came up. Shared by all modules' status checks.
 */
export async function pingHealth(attempts = 12, gapMs = 5000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await axios.get(`${API_URL}/health`, { timeout: 8000 })
      return data
    } catch {
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, gapMs))
    }
  }
  return null
}

/** Is the backend up? Used to show a useful message instead of a raw axios error. */
export async function checkBackend() {
  const data = await pingHealth()
  return data
    ? { online: true, openaiConfigured: !!data.openaiConfigured }
    : { online: false, openaiConfigured: false }
}

/** True when running against a deployed backend (not localhost). */
export const IS_REMOTE = !/localhost|127\.0\.0\.1/.test(API_URL)

/** Environment-aware message for when the backend can't be reached. */
export function backendUnreachableMsg() {
  return IS_REMOTE
    ? 'The server may be waking up — free hosting sleeps when idle and takes ~30–60s to start. Please wait a moment and try again.'
    : `Cannot reach the backend at ${API_URL}. Start it with: cd backend && npm run dev`
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Request timed out. OpenAI took too long to respond.'
  if (err.code === 'ERR_NETWORK') return backendUnreachableMsg()
  return err.message || 'Unknown error generating song.'
}

export { API_URL }
