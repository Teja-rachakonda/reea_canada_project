import axios from 'axios'
import { API_URL, backendUnreachableMsg } from './openai'

/** Generate a daily social post (Facebook + Instagram + hashtags + poster text). */
export async function generateSocialPost(form) {
  try {
    const { data } = await axios.post(`${API_URL}/api/social/generate`, form, { timeout: 60000 })
    if (!data?.facebook && !data?.instagram) throw new Error('Backend returned no post content.')
    return data
  } catch (err) {
    throw new Error(readError(err))
  }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Generating took too long. Try again.'
  if (err.code === 'ERR_NETWORK') return backendUnreachableMsg()
  return err.message || 'Unknown error generating the post.'
}
