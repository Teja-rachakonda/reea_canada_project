const KEYS = {
  API_KEYS: 'reaa_api_keys',
  MODULES_ENABLED: 'reaa_modules_enabled',
  LEADS: 'reaa_leads',
  SONGS: 'reaa_songs',
  SETTINGS: 'reaa_settings',
}

const DEFAULT_APIS = {
  openai: { key: '', model: 'gpt-4o', label: 'OpenAI', category: 'ai' },
  heygen: { key: '', swetha_avatar_id: '', label: 'HeyGen', category: 'video' },
  elevenlabs: { key: '', srinivas_voice_id: '', label: 'ElevenLabs', category: 'voice' },
  vapi: { key: '', phone_number: '', label: 'Vapi.ai', category: 'voice' },
  firecrawl: { key: '', label: 'Firecrawl', category: 'data' },
  apify: { key: '', label: 'Apify', category: 'data' },
  flaaxa: { key: '', label: 'Flaaxa WAPI', category: 'messaging' },
  googlemaps: { key: '', label: 'Google Maps', category: 'maps' },
  gemini: { key: '', model: 'gemini-1.5-pro', label: 'Gemini Pro', category: 'ai' },
  perplexity: { key: '', model: 'sonar-pro', label: 'Perplexity Pro', category: 'ai' },
}

const DEFAULT_SETTINGS = {
  agencyName: 'REAA Ultimate',
  brandName: 'Pabba Realty',
  agentName: 'Srinivas Pabba',
  agentPhone: '+1 647-740-8124',
  agentEmail: 'agent@pabbarealty.com',
  domain: 'agency.pabbarealty.com',
  whatsappNumber: '16477408124',
}

/* ─── API keys ─── */
export function getApiKeys() {
  const stored = localStorage.getItem(KEYS.API_KEYS)
  if (!stored) return DEFAULT_APIS
  // Merge so newly-added APIs appear even on an older saved blob.
  return { ...DEFAULT_APIS, ...JSON.parse(stored) }
}

export function saveApiKeys(keys) {
  localStorage.setItem(KEYS.API_KEYS, JSON.stringify(keys))
}

export function getApiKey(name) {
  const keys = getApiKeys()
  return keys[name]?.key || ''
}

/* ─── Settings ─── */
export function getSettings() {
  const stored = localStorage.getItem(KEYS.SETTINGS)
  if (!stored) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

/* ─── Module enable/disable ─── */
export function getEnabledModules() {
  const stored = localStorage.getItem(KEYS.MODULES_ENABLED)
  return stored ? JSON.parse(stored) : {}
}

export function saveEnabledModules(map) {
  localStorage.setItem(KEYS.MODULES_ENABLED, JSON.stringify(map))
}

export function isModuleEnabled(id) {
  const map = getEnabledModules()
  // Absent means enabled — a module is only hidden once explicitly turned off.
  return map[id] !== false
}

/* ─── Leads ─── */
export function getLeads() {
  return JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]')
}

export function addLead(lead) {
  const leads = getLeads()
  leads.unshift({
    ...lead,
    id: Date.now(),
    createdAt: new Date().toLocaleString(),
  })
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads))
  return leads[0]
}

/* ─── Songs ─── */
export function getSongs() {
  return JSON.parse(localStorage.getItem(KEYS.SONGS) || '[]')
}

export function saveSong(song) {
  const songs = getSongs()
  songs.unshift({
    ...song,
    id: Date.now(),
    createdAt: new Date().toLocaleString(),
  })
  localStorage.setItem(KEYS.SONGS, JSON.stringify(songs))
  return songs[0]
}

export { DEFAULT_APIS, DEFAULT_SETTINGS, KEYS }
