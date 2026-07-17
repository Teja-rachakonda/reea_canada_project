const express = require('express')
const router = express.Router()
const supabase = require('../services/supabaseService')

/**
 * Lead Pipeline CRM — scaffold only.
 * The module itself is still a Coming Soon placeholder; these endpoints exist
 * so the route file matches the agreed structure and can be filled in next.
 */

router.get('/', async (_req, res) => {
  const { data, error } = await supabase.selectAll('leads', { limit: 100 })
  if (error) return res.status(503).json({ error, leads: [] })
  res.json({ leads: data })
})

router.post('/', async (req, res) => {
  const { name, phone } = req.body || {}
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' })
  }

  const { data, error } = await supabase.insert('leads', {
    name,
    phone,
    email: req.body.email || null,
    source: req.body.source || 'manual',
    keyword: req.body.keyword || null,
    language: req.body.language || 'English',
    status: req.body.status || 'new',
    score: req.body.score ?? null,
  })

  if (error) return res.status(503).json({ error })
  res.status(201).json({ success: true, lead: data })
})

module.exports = router
