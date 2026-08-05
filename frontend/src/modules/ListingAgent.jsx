import { useState, useEffect } from 'react'
import { generateListing } from '../services/agents'
import { checkBackend } from '../services/openai'
import { Banner, CopyBtn, ChipRow, LoadingCard } from '../components/ui'

const PROPERTY_TYPES = ['Detached', 'Semi-Detached', 'Townhouse', 'Condo', 'Bungalow', 'Land']
const TONES = ['Professional', 'Warm', 'Luxury', 'Investor']
const LENGTHS = ['Short', 'Standard', 'Detailed']
const LANGUAGES = ['English', 'Telugu', 'Hinglish']

export default function ListingAgent() {
  const [form, setForm] = useState({
    address: '', price: '', propertyType: 'Detached', beds: '', baths: '', sqft: '',
    features: '', tone: 'Professional', length: 'Standard', language: 'English',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })

  useEffect(() => { checkBackend().then(setBackend) }, [])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e?.preventDefault()
    if (!form.address.trim() && !form.features.trim()) {
      setError('Enter at least an address/area or some features.')
      return
    }
    setLoading(true); setError(''); setResult(null)
    try { setResult(await generateListing(form)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const keyMissing = backend.online && !backend.openaiConfigured
  const fullText = result ? `${result.title}\n\n${result.description}\n\n${(result.bullets || []).map((b) => '• ' + b).join('\n')}` : ''

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <div className="card" style={{ marginBottom: 16 }}><div className="card-body">
        <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>🏡 Listing Agent AI</h2>
        <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
          Turn property details into a polished MLS listing description, feature bullets, and a social caption.
          Uses only what you enter, and follows fair-housing wording.
        </p>
      </div></div>

      {!backend.online && <Banner tone="red">⏳ Connecting to the server… free hosting can take ~30–60s to wake up. If it persists, reload the page.</Banner>}
      {keyMissing && <Banner tone="gold">🔑 OpenAI key not set — add <code>OPENAI_API_KEY</code> to <code>backend/.env</code>.</Banner>}

      <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            <Field label="Address / Area"><input className="input" value={form.address} onChange={set('address')} placeholder="55 Lakeshore Rd, Mississauga" /></Field>
            <Field label="Price"><input className="input" value={form.price} onChange={set('price')} placeholder="$899,000" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 12 }}>
            <Field label="Type">
              <select className="input" value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Beds"><input className="input" value={form.beds} onChange={set('beds')} placeholder="3" /></Field>
            <Field label="Baths"><input className="input" value={form.baths} onChange={set('baths')} placeholder="2" /></Field>
            <Field label="Sq ft"><input className="input" value={form.sqft} onChange={set('sqft')} placeholder="1800" /></Field>
          </div>
          <Field label="Features / highlights">
            <textarea className="input" value={form.features} onChange={set('features')} rows={2} style={{ resize: 'vertical' }}
              placeholder="Renovated kitchen, hardwood floors, finished basement, near GO station, top school zone…" />
          </Field>
          <Field label="Tone"><ChipRow items={TONES} value={form.tone} onPick={(v) => setForm((f) => ({ ...f, tone: v }))} /></Field>
          <Field label="Length"><ChipRow items={LENGTHS} value={form.length} onPick={(v) => setForm((f) => ({ ...f, length: v }))} /></Field>
          <Field label="Language"><ChipRow items={LANGUAGES} value={form.language} onPick={(v) => setForm((f) => ({ ...f, language: v }))} /></Field>

          <button className="btn-primary" type="submit" disabled={loading} style={{ justifySelf: 'start', padding: '10px 22px' }}>
            {loading ? '🔄 Writing…' : '🏡 Generate Listing'}
          </button>
        </div>
      </form>

      {error && <Banner tone="red">{error}</Banner>}
      {loading && <LoadingCard>Writing your listing…</LoadingCard>}

      {result && !loading && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="card-title">📝 Listing description</div>
              <CopyBtn text={fullText} label="⧉ Copy all" />
            </div>
            <div className="card-body">
              <div style={{ fontSize: 18, fontFamily: "'Bebas Neue', sans-serif", color: 'var(--gold)', letterSpacing: 0.4, marginBottom: 10 }}>{result.title}</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.7, color: 'var(--w9)' }}>{result.description}</div>
              {result.bullets?.length > 0 && (
                <ul style={{ margin: '14px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--w7)', lineHeight: 1.7 }}>
                  {result.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          </div>

          {result.social_caption && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className="card-title">📱 Social caption</div>
                <CopyBtn text={result.social_caption} />
              </div>
              <div className="card-body"><div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'var(--w7)' }}>{result.social_caption}</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div><div className="field-label">{label}</div>{children}</div>
}
