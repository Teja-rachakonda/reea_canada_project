import axios from 'axios'
import { API_URL, pingHealth, backendUnreachableMsg } from './openai'

/**
 * Find real businesses by type + location.
 * The Google Places call runs on the backend (backend/routes/businesses.js);
 * the key never touches the browser. Email is best-effort, so `wantEmail`
 * makes the request slower and may still come back blank.
 */
export async function searchBusinesses({ type, location, cuisine, wantEmail }) {
  try {
    const { data } = await axios.post(
      `${API_URL}/api/businesses/search`,
      { type, location, cuisine, wantEmail },
      { timeout: wantEmail ? 90000 : 60000 }
    )
    return data
  } catch (err) {
    throw new Error(readError(err))
  }
}

/** Is the backend up? (Find Businesses uses free OSM, so no key needed.) */
export async function checkPlaces() {
  const data = await pingHealth()
  return data
    ? { online: true, placesConfigured: !!data.placesConfigured }
    : { online: false, placesConfigured: false }
}

function readError(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === 'ECONNABORTED') return 'Search timed out. Try without email lookup, or narrow the search.'
  if (err.code === 'ERR_NETWORK') return backendUnreachableMsg()
  return err.message || 'Unknown error searching businesses.'
}
