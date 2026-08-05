import { useState, useEffect } from 'react'
import { generateDeal } from '../services/deals'
import { checkBackend } from '../services/openai'
import { getSettings } from '../services/storage'

const DEAL_TYPES = ['New Listing', 'Price Drop', 'Open House', 'Just Sold', 'Just Leased', 'Investment / Pre-Con']
const PROPERTY_TYPES = ['Detached', 'Semi-Detached', 'Townhouse', 'Condo', 'Basement', 'Land']
const LANGUAGES = ['English', 'Telugu', 'Hinglish']

export default function DealsAlert() {
  const settings = getSettings()

  const [form, setForm] = useState({
    dealType: 'New Listing',
    address: '',
    price: '',
    beds: '',
    baths: '',
    propertyType: 'Detached',
    highlights: '',
    offer: '',
    openHouse: '',
    language: 'English',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })

  useEffect(() => {
    checkBackend().then(setBackend)
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e?.preventDefault()
    if (!form.address.trim() && !form.highlights.trim()) {
      setError('Enter at least an address/area or some highlights.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        ...form,
        agentName: settings.agentName,
        brokerage: settings.brandName,
        phone: settings.agentPhone,
      }
      setResult(await generateDeal(payload))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const keyMissing = backend.online && !backend.openaiConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>🔥 Deals Alert</h2>
          <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
            Turn a property deal into ready-to-send posts. Fill the details, generate, then copy or share
            straight to WhatsApp and Facebook. Uses only what you enter — no invented listings.
          </p>
        </div>
      </div>

      {!backend.online && (
        <Banner tone="red">⏳ Connecting to the server… free hosting can take ~30–60s to wake up. If it persists, reload the page.</Banner>
      )}
      {keyMissing && (
        <Banner tone="gold">🔑 OpenAI key not set — add <code>OPENAI_API_KEY</code> to <code>backend/.env</code>.</Banner>
      )}

      <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div>
            <div className="field-label">Deal type</div>
            <ChipRow items={DEAL_TYPES} value={form.dealType} onPick={(v) => setForm((f) => ({ ...f, dealType: v }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            <div>
              <div className="field-label">Address / Area</div>
              <input className="input" value={form.address} onChange={set('address')} placeholder="e.g. 55 Lakeshore Rd, Mississauga" />
            </div>
            <div>
              <div className="field-label">Price</div>
              <input className="input" value={form.price} onChange={set('price')} placeholder="e.g. $899,000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 12 }}>
            <div>
              <div className="field-label">Beds</div>
              <input className="input" value={form.beds} onChange={set('beds')} placeholder="3" />
            </div>
            <div>
              <div className="field-label">Baths</div>
              <input className="input" value={form.baths} onChange={set('baths')} placeholder="2" />
            </div>
            <div>
              <div className="field-label">Property type</div>
              <select className="input" value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="field-label">Highlights</div>
            <textarea className="input" value={form.highlights} onChange={set('highlights')} rows={2}
              placeholder="Renovated kitchen, finished basement, near GO station, top school zone…" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            <div>
              <div className="field-label">Special offer / incentive (optional)</div>
              <input className="input" value={form.offer} onChange={set('offer')} placeholder="e.g. $10,000 cashback, free legal" />
            </div>
            <div>
              <div className="field-label">Open house (optional)</div>
              <input className="input" value={form.openHouse} onChange={set('openHouse')} placeholder="e.g. Sat & Sun 2–4 PM" />
            </div>
          </div>

          <div>
            <div className="field-label">Language</div>
            <ChipRow items={LANGUAGES} value={form.language} onPick={(v) => setForm((f) => ({ ...f, language: v }))} />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ justifySelf: 'start', padding: '10px 22px' }}>
            {loading ? '🔄 Generating…' : '🔥 Generate Deal Alert'}
          </button>
        </div>
      </form>

      {error && <Banner tone="red">{error}</Banner>}

      {loading && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 34, color: 'var(--w5)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />Writing your posts…
        </div></div>
      )}

      {result && !loading && (
        <div style={{ display: 'grid', gap: 14 }}>
          {result.headline && (
            <div className="card"><div className="card-body">
              <div className="field-label">Headline</div>
              <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", color: 'var(--gold)', letterSpacing: 0.4 }}>{result.headline}</div>
            </div></div>
          )}

          <PostCard
            icon="💬" title="WhatsApp"
            text={result.whatsapp}
            actions={
              <>
                <a className="btn-primary" href={`https://wa.me/?text=${encodeURIComponent(result.whatsapp)}`} target="_blank" rel="noreferrer"
                  style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}>Share on WhatsApp</a>
                <CopyBtn text={result.whatsapp} />
              </>
            }
          />

          <PostCard
            icon="📘" title="Facebook"
            text={result.facebook}
            footer={result.hashtags?.length ? result.hashtags.join(' ') : null}
            actions={<CopyBtn text={result.facebook + (result.hashtags?.length ? '\n\n' + result.hashtags.join(' ') : '')} />}
          />
        </div>
      )}
    </div>
  )
}

function PostCard({ icon, title, text, footer, actions }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div className="card-title">{icon} {title}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
      </div>
      <div className="card-body">
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6, color: 'var(--w9)' }}>{text}</div>
        {footer && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--blue)' }}>{footer}</div>}
      </div>
    </div>
  )
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    })
  }
  return (
    <button className="btn-ghost" onClick={copy} style={{ padding: '7px 14px', fontSize: 12, color: done ? 'var(--green)' : undefined }}>
      {done ? '✓ Copied' : '⧉ Copy'}
    </button>
  )
}

function ChipRow({ items, value, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
      {items.map((it) => (
        <button key={it} type="button" onClick={() => onPick(it)} className="pill"
          style={{
            fontSize: 12, cursor: 'pointer',
            background: value === it ? 'var(--gold-alpha)' : 'transparent',
            color: value === it ? 'var(--gold)' : 'var(--w5)',
            borderColor: value === it ? 'var(--gold-border)' : 'var(--w1)',
          }}>
          {it}
        </button>
      ))}
    </div>
  )
}

function Banner({ tone, children }) {
  const map = {
    red: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.3)', fg: '#fca5a5' },
    gold: { bg: 'var(--gold-alpha)', bd: 'var(--gold-border)', fg: 'var(--gold-light)' },
  }
  const c = map[tone] || map.gold
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, borderRadius: 12, padding: '11px 14px', fontSize: 12.5, lineHeight: 1.6, marginBottom: 14 }}>
      {children}
    </div>
  )
}
