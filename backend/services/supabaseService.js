const { createClient } = require('@supabase/supabase-js')

let client = null

function getClient() {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}

function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
}

/**
 * Insert a row. Returns { data, error } and never throws — a database
 * hiccup must not lose work the user already waited for.
 */
async function insert(table, row) {
  const db = getClient()
  if (!db) return { data: null, error: 'Supabase not configured' }
  try {
    const { data, error } = await db.from(table).insert(row).select().single()
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message }
  }
}

async function selectAll(table, { limit = 50, orderBy = 'created_at' } = {}) {
  const db = getClient()
  if (!db) return { data: [], error: 'Supabase not configured' }
  try {
    const { data, error } = await db
      .from(table)
      .select('*')
      .order(orderBy, { ascending: false })
      .limit(limit)
    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

module.exports = { getClient, isConfigured, insert, selectAll }
