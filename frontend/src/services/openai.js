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

/** Is the backend up? Used to show a useful message instead of a raw axios error. */
export async function checkBackend() {
  try {
    const { data } = await axios.get(`${API_URL}/health`, { timeout: 4000 })
    return { online: true, openaiConfigured: !!data?.openaiConfigured }
  } catch {
    return { online: false, openaiConfigured: false }
  }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Request timed out. OpenAI took too long to respond.'
  if (err.code === 'ERR_NETWORK') {
    return `Cannot reach the backend at ${API_URL}. Start it with: cd backend && npm run dev`
  }
  return err.message || 'Unknown error generating song.'
}

export { API_URL }
