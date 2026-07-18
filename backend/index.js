const express = require('express')
const cors = require('cors')
// override: backend/.env is the authoritative source. Without this, a stale
// OPENAI_API_KEY already in the machine's environment silently wins over the
// project's own config and the failure surfaces as an opaque 401.
require('dotenv').config({ override: true })

const openai = require('./services/openaiService')
const supabase = require('./services/supabaseService')
const places = require('./services/placesService')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/reaamusic', require('./routes/reaamusic'))
app.use('/api/leads', require('./routes/leads'))
app.use('/api/businesses', require('./routes/businesses'))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    project: 'REAA Ultimate v4.0',
    model: openai.MODEL,
    openaiConfigured: openai.isConfigured(),
    supabaseConfigured: supabase.isConfigured(),
    placesConfigured: places.isConfigured(),
  })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n  🍁 REAA backend running on http://localhost:${PORT}`)
  console.log(`     OpenAI   ${openai.isConfigured() ? '✅ configured' : '⚠️  no OPENAI_API_KEY in backend/.env'}`)
  console.log(`     Supabase ${supabase.isConfigured() ? '✅ configured' : '⚠️  not configured (songs saved to browser only)'}`)
  console.log(`     Places   ${places.isConfigured() ? '✅ configured' : '⚠️  no GOOGLE_PLACES_KEY (Find Businesses disabled)'}\n`)
})
