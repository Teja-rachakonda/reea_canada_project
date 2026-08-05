import { useState, useEffect } from 'react'
import { generateBuyerNote } from '../services/agents'
import { checkBackend } from '../services/openai'
import { Banner, CopyBtn, ChipRow, LoadingCard } from '../components/ui'

const LANGUAGES = ['English', 'Telugu', 'Hinglish']

export default function BuyerAgent() {
  const [form, setForm] = useState({
    buyerName: '', buyerNeeds: '', budget: '', property: '', propertyFeatures: '', language: 'English',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })

  useEffect(() => { checkBackend().then(setBackend) }, [])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e?.preventDefault()
    if (!form.buyerNeeds.trim() || !form.property.trim()) {
      setError("Enter the buyer's needs and the property they're considering.")
      return
    }
    setLoading(true); setError(''); setResult(null)
    try { setResult(await generateBuyerNote(form)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const keyMissing = backend.online && !backend.openaiConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <div className="card" style={{ marginBottom: 16 }}><div className="card-body">
        <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>🏷️ Buyer Agent AI</h2>
        <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
          Write a personalized note explaining why a property fits a buyer's needs — with honest trade-offs.
          Great for following up after a showing or sharing a new match.
        </p>
      </div></div>

      {!backend.online && <Banner tone="red">⏳ Connecting to the server… free hosting can take ~30–60s to wake up. If it persists, reload the page.</Banner>}
      {keyMissing && <Banner tone="gold">🔑 OpenAI key not set — add <code>OPENAI_API_KEY</code> to <code>backend/.env</code>.</Banner>}

      <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            <Field label="Buyer name (optional)"><input className="input" value={form.buyerName} onChange={set('buyerName')} placeholder="e.g. Ravi & Priya" /></Field>
            <Field label="Budget (optional)"><input className="input" value={form.budget} onChange={set('budget')} placeholder="$750k–$850k" /></Field>
          </div>
          <Field label="Buyer's needs">
            <textarea className="input" value={form.buyerNeeds} onChange={set('buyerNeeds')} rows={2} style={{ resize: 'vertical' }}
              placeholder="3 beds, close to good schools, short commute to downtown, finished basement for parents…" />
          </Field>
          <Field label="Property being considered">
            <input className="input" value={form.property} onChange={set('property')} placeholder="e.g. 12 Rosewood Dr, Brampton — $829,000" />
          </Field>
          <Field label="Property details / features">
            <textarea className="input" value={form.propertyFeatures} onChange={set('propertyFeatures')} rows={2} style={{ resize: 'vertical' }}
              placeholder="4 bed, 3 bath, finished basement, 10 min to GO, top-rated school zone, no backyard…" />
          </Field>
          <Field label="Language"><ChipRow items={LANGUAGES} value={form.language} onPick={(v) => setForm((f) => ({ ...f, language: v }))} /></Field>

          <button className="btn-primary" type="submit" disabled={loading} style={{ justifySelf: 'start', padding: '10px 22px' }}>
            {loading ? '🔄 Writing…' : '🏷️ Generate Buyer Note'}
          </button>
        </div>
      </form>

      {error && <Banner tone="red">{error}</Banner>}
      {loading && <LoadingCard>Writing the buyer note…</LoadingCard>}

      {result && !loading && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="card-title">✉️ Personalized note</div>
              <CopyBtn text={result.message} />
            </div>
            <div className="card-body"><div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.7, color: 'var(--w9)' }}>{result.message}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 14 }}>
            {result.fit_points?.length > 0 && (
              <div className="card"><div className="card-body">
                <div className="field-label" style={{ color: 'var(--green)' }}>✓ Why it fits</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--w7)', lineHeight: 1.7 }}>
                  {result.fit_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div></div>
            )}
            {result.considerations?.length > 0 && (
              <div className="card"><div className="card-body">
                <div className="field-label" style={{ color: 'var(--orange)' }}>⚠ Worth checking</div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--w7)', lineHeight: 1.7 }}>
                  {result.considerations.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return <div><div className="field-label">{label}</div>{children}</div>
}
