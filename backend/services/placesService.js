/**
 * Business discovery via Google Places API (New).
 *
 * Why Places and NOT the LLM: gpt-4o will happily invent plausible-looking
 * phone numbers and emails that don't exist. For a feature whose whole point
 * is real, callable leads, hallucinated contacts are worse than useless — so
 * discovery goes through Google's live business index, never the model.
 *
 * What Places returns: name, address, phone, website, rating. It does NOT
 * return email — no maps provider does. Email is best-effort enrichment:
 * we fetch the business's own website and look for a published address.
 */

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
].join(',')

function getKey() {
  // Accept either name — GOOGLE_PLACES_KEY is clearer, GOOGLE_MAPS_KEY matches
  // the .env template that shipped first.
  return process.env.GOOGLE_PLACES_KEY || process.env.GOOGLE_MAPS_KEY || ''
}

function isConfigured() {
  return !!getKey()
}

/**
 * Search businesses by free-text type + location.
 * @returns {Promise<Array>} normalized business rows
 */
async function findBusinesses({ query, regionCode = 'CA', maxResults = 20 }) {
  const key = getKey()
  if (!key) {
    const err = new Error(
      'Google Places key missing. Add GOOGLE_PLACES_KEY to backend/.env (enable "Places API (New)" on the key).'
    )
    err.status = 503
    throw err
  }

  let resp
  try {
    resp = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        regionCode,
        maxResultCount: Math.min(maxResults, 20),
      }),
    })
  } catch (e) {
    const err = new Error(`Could not reach Google Places: ${e.message}`)
    err.status = 502
    throw err
  }

  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const msg = body?.error?.message || `Places API error (HTTP ${resp.status})`
    const err = new Error(msg)
    // 400 usually means the key exists but "Places API (New)" isn't enabled.
    err.status = resp.status === 400 || resp.status === 403 ? 502 : resp.status
    throw err
  }

  return (body.places || []).map((p) => ({
    name: p.displayName?.text || '—',
    phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
    email: '', // filled by enrichment if requested
    address: p.formattedAddress || '',
    website: p.websiteUri || '',
    rating: typeof p.rating === 'number' ? p.rating : null,
    reviews: p.userRatingCount ?? null,
    category: p.primaryTypeDisplayName?.text || '',
    mapsUrl: p.googleMapsUri || '',
  }))
}

const JUNK_EMAIL = /(\.png|\.jpg|\.gif|\.webp|@sentry|@example\.|@wixpress|@sentry\.io|\.wixpress|placeholder|your@|email@)/i
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

function pickBestEmail(text) {
  const found = [...(text.match(EMAIL_RE) || [])]
    .map((e) => e.trim().toLowerCase())
    .filter((e) => !JUNK_EMAIL.test(e))
  if (!found.length) return ''
  // Prefer role addresses a business publishes for contact.
  const preferred = found.find((e) => /^(info|contact|hello|sales|admin|reservations|booking)@/.test(e))
  return preferred || found[0]
}

async function fetchText(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (REAA business finder)' },
    })
    if (!r.ok) return ''
    return await r.text()
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

/**
 * Best-effort email lookup from a business website. Checks the homepage and a
 * likely /contact page. Free (no API), but unreliable by nature — many sites
 * hide email behind forms. Returns '' when nothing trustworthy is found.
 */
async function findEmailForWebsite(website) {
  if (!website) return ''
  let base
  try {
    base = new URL(website)
  } catch {
    return ''
  }
  const home = await fetchText(base.origin)
  let email = pickBestEmail(home)
  if (email) return email

  for (const path of ['/contact', '/contact-us', '/about']) {
    const html = await fetchText(base.origin + path, 5000)
    email = pickBestEmail(html)
    if (email) return email
  }
  return ''
}

/** Enrich a batch of rows with emails, capped so a search can't run forever. */
async function enrichEmails(rows, cap = 12) {
  const targets = rows.filter((r) => r.website).slice(0, cap)
  await Promise.all(
    targets.map(async (r) => {
      r.email = await findEmailForWebsite(r.website)
    })
  )
  return rows
}

module.exports = { isConfigured, findBusinesses, enrichEmails }
