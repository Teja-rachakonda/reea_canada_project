import axios from 'axios'
import { API_URL, backendUnreachableMsg } from './openai'

/** Generate an MLS listing description. Backend: backend/routes/agents.js */
export async function generateListing(form) {
  return post('/api/agents/listing', form, 'description')
}

/** Generate a personalized buyer note. Backend: backend/routes/agents.js */
export async function generateBuyerNote(form) {
  return post('/api/agents/buyer', form, 'message')
}

async function post(path, form, requiredField) {
  try {
    const { data } = await axios.post(`${API_URL}${path}`, form, { timeout: 60000 })
    if (!data?.[requiredField]) throw new Error('Backend returned no content.')
    return data
  } catch (err) {
    throw new Error(readError(err))
  }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Generating took too long. Try again.'
  if (err.code === 'ERR_NETWORK') return backendUnreachableMsg()
  return err.message || 'Unknown error.'
}
