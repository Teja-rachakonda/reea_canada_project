import axios from 'axios'
import { API_URL } from './openai'

/**
 * Ask HouzGPT a question. Sends the running conversation so the assistant has
 * context. The OpenAI call runs on the backend (backend/routes/houzgpt.js).
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 */
export async function askHouzGPT(messages) {
  try {
    const { data } = await axios.post(`${API_URL}/api/houzgpt/chat`, { messages }, { timeout: 60000 })
    if (!data?.reply) throw new Error('Backend returned no reply.')
    return data.reply
  } catch (err) {
    throw new Error(readError(err))
  }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'HouzGPT took too long to respond. Try again.'
  if (err.code === 'ERR_NETWORK') {
    return `Cannot reach the backend at ${API_URL}. Start it with: cd backend && npm run dev`
  }
  return err.message || 'Unknown error contacting HouzGPT.'
}
