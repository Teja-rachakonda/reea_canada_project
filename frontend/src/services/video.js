import axios from 'axios'
import { API_URL, pingHealth, backendUnreachableMsg } from './openai'

/** Write a spoken video script from listing details (OpenAI, on the backend). */
export async function writeVideoScript(details) {
  try {
    const { data } = await axios.post(`${API_URL}/api/video/script`, details, { timeout: 60000 })
    if (!data?.script) throw new Error('Backend returned no script.')
    return data.script
  } catch (err) {
    throw new Error(readError(err))
  }
}

/** Submit a script to HeyGen. Returns a videoId to poll. */
export async function createVideo(script, title) {
  try {
    const { data } = await axios.post(`${API_URL}/api/video/generate`, { script, title }, { timeout: 60000 })
    if (!data?.videoId) throw new Error('Backend returned no video id.')
    return data.videoId
  } catch (err) {
    throw new Error(readError(err))
  }
}

/** Poll a video's render status. Returns { status, videoUrl, thumbnailUrl, error }. */
export async function getVideoStatus(videoId) {
  try {
    const { data } = await axios.get(`${API_URL}/api/video/status`, { params: { video_id: videoId }, timeout: 20000 })
    return data
  } catch (err) {
    throw new Error(readError(err))
  }
}

/** Is HeyGen configured on the backend? */
export async function checkHeyGen() {
  const data = await pingHealth()
  return data
    ? { online: true, heygenConfigured: !!data.heygenConfigured, openaiConfigured: !!data.openaiConfigured }
    : { online: false, heygenConfigured: false, openaiConfigured: false }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'The request took too long. Try again.'
  if (err.code === 'ERR_NETWORK') return backendUnreachableMsg()
  return err.message || 'Unknown error.'
}
