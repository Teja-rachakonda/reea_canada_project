import { useState, useEffect } from 'react'
import { generateSocialPost } from '../services/social'
import { checkBackend } from '../services/openai'
import { getSettings } from '../services/storage'
import { Banner, CopyBtn, ChipRow, LoadingCard } from '../components/ui'

const POST_TYPES = [
  'New Listing', 'Just Sold', 'Open House', 'Market Update',
  'Buyer Tip', 'Seller Tip', 'Festival Greeting', 'Community Spotlight',
]
const LANGUAGES = ['English', 'Telugu', 'Hinglish']

export default function SocialPost() {
  const settings = getSettings()
  const [form, setForm] = useState({ postType: 'New Listing', area: '', details: '', language: 'English' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })

  useEffect(() => { checkBackend().then(setBackend) }, [])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e?.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      setResult(await generateSocialPost({
        ...form,
        agentName: settings.agentName,
        brokerage: settings.brandName,
        phone: settings.agentPhone,
      }))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const keyMissing = backend.online && !backend.openaiConfigured
  const posterText = result?.poster
    ? `${result.poster.headline}\n${result.poster.subtext}\n${result.poster.cta}`
    : ''

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <div className="card" style={{ marginBottom: 16 }}><div className="card-body">
        <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>📱 Social Post Studio</h2>
        <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
          Generate a daily post for Facebook &amp; Instagram — caption, hashtags, and poster text to drop
          onto a graphic. Pick a type, add a detail or two, and post.
        </p>
      </div></div>

      {!backend.online && <Banner tone="red">⏳ Connecting to the server… free hosting can take ~30–60s to wake up. If it persists, reload the page.</Banner>}
      {keyMissing && <Banner tone="gold">🔑 OpenAI key not set — add <code>OPENAI_API_KEY</code> to <code>backend/.env</code>.</Banner>}

      <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div>
            <div className="field-label">Post type</div>
            <ChipRow items={POST_TYPES} value={form.postType} onPick={(v) => setForm((f) => ({ ...f, postType: v }))} />
          </div>
          <div>
            <div className="field-label">Area / City (optional)</div>
            <input className="input" value={form.area} onChange={set('area')} placeholder="e.g. Mississauga, Brampton" />
          </div>
          <div>
            <div className="field-label">Details / context (optional)</div>
            <textarea className="input" value={form.details} onChange={set('details')} rows={2} style={{ resize: 'vertical' }}
              placeholder="e.g. New 3-bed detached at 55 Lakeshore Rd, $899k, open house Sat 2–4 PM" />
          </div>
          <div>
            <div className="field-label">Language</div>
            <ChipRow items={LANGUAGES} value={form.language} onPick={(v) => setForm((f) => ({ ...f, language: v }))} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ justifySelf: 'start', padding: '10px 22px' }}>
            {loading ? '🔄 Generating…' : '📱 Generate Post'}
          </button>
        </div>
      </form>

      {error && <Banner tone="red">{error}</Banner>}
      {loading && <LoadingCard>Writing your post…</LoadingCard>}

      {result && !loading && (
        <div style={{ display: 'grid', gap: 14 }}>
          {result.poster && (
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(213,43,30,0.14), rgba(212,175,55,0.10))' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className="card-title">🖼️ Poster text</div>
                <CopyBtn text={posterText} />
              </div>
              <div className="card-body" style={{ textAlign: 'center', padding: '26px 20px' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>{result.poster.headline}</div>
                <div style={{ fontSize: 14, color: 'var(--w9)', margin: '10px 0' }}>{result.poster.subtext}</div>
                <div style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '7px 16px', borderRadius: 20, fontSize: 12.5, fontWeight: 700 }}>{result.poster.cta}</div>
              </div>
            </div>
          )}

          <PostCard icon="📘" title="Facebook" text={result.facebook} />
          <PostCard
            icon="📸" title="Instagram"
            text={result.instagram}
            footer={result.hashtags?.length ? result.hashtags.join(' ') : null}
            copyText={result.instagram + (result.hashtags?.length ? '\n\n' + result.hashtags.join(' ') : '')}
          />
        </div>
      )}
    </div>
  )
}

function PostCard({ icon, title, text, footer, copyText }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="card-title">{icon} {title}</div>
        <CopyBtn text={copyText ?? text} />
      </div>
      <div className="card-body">
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6, color: 'var(--w9)' }}>{text}</div>
        {footer && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--blue)' }}>{footer}</div>}
      </div>
    </div>
  )
}
