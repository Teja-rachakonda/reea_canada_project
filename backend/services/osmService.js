/**
 * Business discovery via OpenStreetMap — the free, no-key, no-card alternative
 * to Google Places. Two public services are chained:
 *   1. Nominatim  — turn a city name into a map bounding box
 *   2. Overpass   — list businesses of a given type inside that box
 *
 * Coverage is thinner than Google (community-maintained data misses some small
 * businesses), but it returns real names, phones, addresses and websites at
 * zero cost. Same output shape as placesService so the route can swap freely.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
// Multiple public Overpass mirrors — if one is busy (504/429), we try the next.
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
// Nominatim's usage policy requires an identifying User-Agent.
const UA = 'REAA-Platform/1.0 (real-estate lead tool; contact agent@pabbarealty.com)'

// OSM has no key — this provider is always available.
function isConfigured() {
  return true
}

// Free-text business type → OpenStreetMap tags. `food: true` means a cuisine
// filter can be applied. Unknown types fall back to a name search.
const TYPE_TAGS = {
  'restaurant': [{ k: 'amenity', v: 'restaurant', food: true }],
  'restaurants': [{ k: 'amenity', v: 'restaurant', food: true }],
  'cafe': [{ k: 'amenity', v: 'cafe', food: true }],
  'coffee': [{ k: 'amenity', v: 'cafe', food: true }],
  'fast food': [{ k: 'amenity', v: 'fast_food', food: true }],
  'pizza': [{ k: 'amenity', v: 'fast_food', food: true }, { k: 'amenity', v: 'restaurant', food: true }],
  'pizza store': [{ k: 'amenity', v: 'fast_food', food: true }, { k: 'amenity', v: 'restaurant', food: true }],
  'bakery': [{ k: 'shop', v: 'bakery' }],
  'bar': [{ k: 'amenity', v: 'bar' }, { k: 'amenity', v: 'pub' }],
  'hair salon': [{ k: 'shop', v: 'hairdresser' }],
  'salon': [{ k: 'shop', v: 'hairdresser' }, { k: 'shop', v: 'beauty' }],
  'beauty': [{ k: 'shop', v: 'beauty' }],
  'spa': [{ k: 'leisure', v: 'spa' }, { k: 'shop', v: 'beauty' }],
  'grocery': [{ k: 'shop', v: 'supermarket' }, { k: 'shop', v: 'convenience' }, { k: 'shop', v: 'grocery' }],
  'grocery store': [{ k: 'shop', v: 'supermarket' }, { k: 'shop', v: 'convenience' }, { k: 'shop', v: 'grocery' }],
  'supermarket': [{ k: 'shop', v: 'supermarket' }],
  'real estate office': [{ k: 'office', v: 'estate_agent' }],
  'real estate': [{ k: 'office', v: 'estate_agent' }],
  'dental clinic': [{ k: 'amenity', v: 'dentist' }],
  'dentist': [{ k: 'amenity', v: 'dentist' }],
  'doctor': [{ k: 'amenity', v: 'doctors' }],
  'clinic': [{ k: 'amenity', v: 'clinic' }, { k: 'amenity', v: 'doctors' }],
  'pharmacy': [{ k: 'amenity', v: 'pharmacy' }],
  'gym': [{ k: 'leisure', v: 'fitness_centre' }],
  'fitness': [{ k: 'leisure', v: 'fitness_centre' }],
  'bank': [{ k: 'amenity', v: 'bank' }],
  'hotel': [{ k: 'tourism', v: 'hotel' }],
  'car repair': [{ k: 'shop', v: 'car_repair' }],
  'lawyer': [{ k: 'office', v: 'lawyer' }],
  'school': [{ k: 'amenity', v: 'school' }],
  'clothing': [{ k: 'shop', v: 'clothes' }],
}

function tagsForType(type) {
  const t = type.toLowerCase().trim()
  if (TYPE_TAGS[t]) return TYPE_TAGS[t]
  for (const key of Object.keys(TYPE_TAGS)) {
    if (t.includes(key) || key.includes(t)) return TYPE_TAGS[key]
  }
  return null
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\"]/g, '\\$&')
}

async function geocode(location) {
  // Global search — any city worldwide (India, Canada, etc.). No country lock.
  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(location)}`
  let r
  try {
    r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } })
  } catch (e) {
    const err = new Error(`Could not reach the map service: ${e.message}`)
    err.status = 502
    throw err
  }
  if (!r.ok) {
    const err = new Error(`Map lookup failed (HTTP ${r.status}).`)
    err.status = 502
    throw err
  }
  const arr = await r.json().catch(() => [])
  if (!arr.length) return null
  const bb = arr[0].boundingbox.map(Number) // [south, north, west, east]
  return {
    south: bb[0], north: bb[1], west: bb[2], east: bb[3],
    latSpan: Math.abs(bb[1] - bb[0]),
    lonSpan: Math.abs(bb[3] - bb[2]),
  }
}

// Cuisine boxes are free text ("indian hyderabad restaurants") — split into
// individual words and drop generic/too-short ones, so we match "indian" as an
// OR term rather than the whole phrase literally.
const CUISINE_NOISE = new Set(['restaurant', 'restaurants', 'food', 'store', 'shop', 'the', 'and'])
function cuisineRegex(cuisine) {
  if (!cuisine) return ''
  const tokens = cuisine
    .toLowerCase()
    .split(/[\s,;|]+/)
    .filter((w) => w.length >= 3 && !CUISINE_NOISE.has(w))
    .map(escapeRe)
  return tokens.join('|')
}

function buildQuery(box, tags, cuisine, type) {
  const bbox = `${box.south},${box.west},${box.north},${box.east}`
  const cRe = cuisineRegex(cuisine)
  const parts = []
  if (tags) {
    for (const t of tags) {
      const base = `["${t.k}"="${t.v}"]`
      if (cRe && t.food) {
        // Match the cuisine words against the cuisine tag OR the business name.
        parts.push(`nwr${base}["cuisine"~"${cRe}",i](${bbox});`)
        parts.push(`nwr${base}["name"~"${cRe}",i](${bbox});`)
      } else {
        parts.push(`nwr${base}(${bbox});`)
      }
    }
  } else {
    // Unknown type: match businesses whose name contains the search term.
    parts.push(`nwr["name"~"${escapeRe(type)}",i](${bbox});`)
  }
  return `[out:json][timeout:18];(${parts.join('')});out center tags 60;`
}

function normalize(el) {
  const t = el.tags || {}
  const addr = [t['addr:housenumber'], t['addr:street'], t['addr:city'], t['addr:postcode']]
    .filter(Boolean)
    .join(' ')
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  return {
    name: t.name || '',
    phone: t.phone || t['contact:phone'] || t['phone:mobile'] || '',
    email: t.email || t['contact:email'] || '',
    address: addr,
    website: t.website || t['contact:website'] || '',
    rating: null,
    reviews: null,
    category: t.cuisine || t.amenity || t.shop || t.office || t.leisure || t.tourism || '',
    mapsUrl: lat && lon ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}` : '',
  }
}

async function postWithTimeout(url, query, ms = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      body: 'data=' + encodeURIComponent(query),
      signal: ctrl.signal,
    })
  } finally {
    clearTimeout(t)
  }
}

function parseElements(body) {
  const seen = new Set()
  const rows = []
  for (const el of body.elements || []) {
    const row = normalize(el)
    if (!row.name) continue
    const key = (row.name + '|' + row.address).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
  // Businesses with a phone are the most useful leads — surface them first.
  rows.sort((a, b) => (b.phone ? 1 : 0) - (a.phone ? 1 : 0) || (b.website ? 1 : 0) - (a.website ? 1 : 0))
  return rows
}

// Try each Overpass mirror in turn; a busy server (504/429/timeout) falls through
// to the next instead of failing the whole search.
async function runOverpass(query) {
  let lastStatus = 0
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const r = await postWithTimeout(url, query)
      if (r.ok) {
        const body = await r.json().catch(() => ({}))
        return parseElements(body)
      }
      lastStatus = r.status
    } catch {
      // network error or timeout on this mirror — move on to the next
    }
  }
  const err = new Error(
    `OpenStreetMap servers are busy right now${lastStatus ? ` (HTTP ${lastStatus})` : ''}. Please wait a few seconds and search again.`
  )
  err.status = 502
  throw err
}

async function findBusinesses({ type, location, cuisine, maxResults = 30 }) {
  const box = await geocode(location)
  if (!box) {
    const err = new Error(`Couldn't find "${location}" on the map. Try a city name like "Mississauga", "Toronto", or "Hyderabad".`)
    err.status = 404
    throw err
  }

  // A country or state is too large to list businesses across. Ask for a city.
  if (box.latSpan > 2 || box.lonSpan > 2) {
    const err = new Error(`"${location}" is too large an area to scan. Please search a specific city — e.g. "Hyderabad", "Mumbai", "Toronto", or "Mississauga".`)
    err.status = 422
    throw err
  }

  const tags = tagsForType(type)
  let rows = await runOverpass(buildQuery(box, tags, cuisine, type))

  // If a specific cuisine filtered everything out, retry on the type alone so
  // the user still sees results (e.g. "Indian" restaurants that aren't tagged).
  if (!rows.length && cuisine && tags) {
    rows = await runOverpass(buildQuery(box, tags, '', type))
  }

  return rows.slice(0, maxResults)
}

module.exports = { isConfigured, findBusinesses }
