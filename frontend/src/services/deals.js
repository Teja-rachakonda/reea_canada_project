import axios from 'axios'
import { API_URL } from './openai'

/**
 * Generate a property deal alert (WhatsApp + Facebook posts).
 * The OpenAI call runs on the backend (backend/routes/deals.js).
 */
export async function generateDeal(form) {
  try {
    const { data } = await axios.post(`${API_URL}/api/deals/generate`, form, { timeout: 60000 })
    if (!data?.whatsapp) throw new Error('Backend returned no post content.')
    return data
  } catch (err) {
    throw new Error(readError(err))
  }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Generating took too long. Try again.'
  if (err.code === 'ERR_NETWORK') {
    return `Cannot reach the backend at ${API_URL}. Start it with: cd backend && npm run dev`
  }
  return err.message || 'Unknown error generating the deal alert.'
}
