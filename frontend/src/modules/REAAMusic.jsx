import { useState, useEffect, useRef } from 'react'
import { GENRES, LANGUAGES, LYRIC_SECTIONS } from '../data/genres'
import { getSettings, getSongs, saveSong } from '../services/storage'
import { generateSong, checkBackend } from '../services/openai'

const STEPS = [
  { icon: '📍', label: 'Reading listing details...', ms: 400 },
  { icon: '✍️', label: 'Writing custom lyrics with AI...', ms: 1500 },
  { icon: '🎵', label: 'Composing song structure...', ms: 2000 },
  { icon: '🎬', label: 'Preparing video template...', ms: 1000 },
]

export default function REAAMusic({ onNavigate }) {
  const settings = getSettings()

  const [form, setForm] = useState({
    address: '',
    genre: 'Pop',
    language: 'English',
    highlights: '',
    agentName: settings.agentName,
    brokerage: settings.brandName,
    phone: settings.agentPhone,
  })

  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [stepIndex, setStepIndex] = useState(-1)
  const [song, setSong] = useState(null)
  const [error, setError] = useState('')
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })
  const [history, setHistory] = useState(getSongs)
  const [toast, setToast] = useState(null)
  const timers = useRef([])

  useEffect(() => {
    checkBackend().then(setBackend)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  async function handleGenerate() {
    if (!form.address.trim()) {
      setError('Property address is required.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    setSong(null)
    setStepIndex(0)

    // Walk the visual steps while the real request runs alongside.
    timers.current.forEach(clearTimeout)
    timers.current = []
    let elapsed = 0
    STEPS.forEach((s, i) => {
      elapsed += s.ms
      timers.current.push(setTimeout(() => setStepIndex(i + 1), elapsed))
    })

    try {
      const result = await generateSong(form)
      const saved = saveSong({ ...result, ...form })
      setSong(result)
      setHistory(getSongs())
      setStepIndex(STEPS.length)
      setStatus('done')
    } catch (err) {
      timers.current.forEach(clearTimeout)
      setError(err.message)
      setStatus('error')
    }
  }

  function reset() {
    setSong(null)
    setStatus('idle')
    setStepIndex(-1)
    setError('')
  }

  const backendDown = !backend.online
  const keyMissing = backend.online && !backend.openaiConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 1000 }}>
      <HowItWorks />

      {backendDown && (
        <Warning
          title="Backend is not running"
          body={
            <>
              REAAMusic needs the backend for its OpenAI call. Start it with{' '}
              <code style={code}>cd backend && npm run dev</code>, then reload this page.
            </>
          }
        />
      )}

      {keyMissing && (
        <Warning
          title="OpenAI key not configured"
          body={
            <>
              Add <code style={code}>OPENAI_API_KEY=sk-...</code> to{' '}
              <code style={code}>backend/.env</code> and restart the backend. The key stays server-side and
              never reaches this browser.
            </>
          }
        />
      )}

      {/* ─── Form ─── */}
      {status !== 'done' && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🎵 Generate a Listing Song</div>
              <div className="card-subtitle">Custom lyrics in English, Hinglish, or Telugu</div>
            </div>
          </div>
          <div className="card-body">
            {/* Address */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Property Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="123 Lakeshore Rd, Mississauga, ON"
              />
            </div>

            {/* Genre */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Music Genre</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {GENRES.map((g) => {
                  const active = form.genre === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => set('genre', g.id)}
                      style={{
                        textAlign: 'left',
                        padding: '13px 15px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: active ? 'var(--gold-alpha)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{g.icon}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? 'var(--gold)' : 'var(--w9)' }}>
                        {g.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--w3)', marginTop: 2 }}>{g.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Language</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    className={`pill${form.language === l ? ' active' : ''}`}
                    onClick={() => set('language', l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--w3)', marginTop: 7 }}>
                Language decides how the song is written. Genre shapes the musical style within it.
              </div>
            </div>

            {/* Highlights */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Property Highlights (optional)</label>
              <textarea
                className="input"
                value={form.highlights}
                onChange={(e) => set('highlights', e.target.value)}
                placeholder="3 beds, 2 baths, renovated kitchen, backyard, near Heartland Town Centre, Mississauga..."
              />
            </div>

            {/* Branding */}
            <div style={{ marginBottom: 22 }}>
              <label className="field-label">Agent Branding</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <input className="input" value={form.agentName} onChange={(e) => set('agentName', e.target.value)} placeholder="Agent name" />
                <input className="input" value={form.brokerage} onChange={(e) => set('brokerage', e.target.value)} placeholder="Brokerage" />
                <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={status === 'loading' || backendDown}
              style={{ width: '100%', padding: 14, fontSize: 14 }}
            >
              {status === 'loading' ? 'Generating…' : '🎵 Generate Music Video'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--w3)', marginTop: 10 }}>
              ⏱ Lyrics in about 30 seconds · Powered by OpenAI gpt-4o
            </div>

            {status === 'error' && (
              <div
                style={{
                  marginTop: 14,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.28)',
                  borderRadius: 10,
                  padding: '11px 14px',
                  fontSize: 12.5,
                  color: 'var(--red)',
                  lineHeight: 1.6,
                }}
              >
                ⚠ {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Loading ─── */}
      {status === 'loading' && <LoadingSteps stepIndex={stepIndex} />}

      {/* ─── Result ─── */}
      {status === 'done' && song && (
        <SongResult song={song} form={form} onReset={reset} flash={flash} />
      )}

      {/* ─── History ─── */}
      {history.length > 0 && status !== 'loading' && (
        <SongHistory
          history={history}
          onView={(s) => {
            setSong(s)
            setStatus('done')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {toast && <div className="toast"><span>✅</span>{toast}</div>}
    </div>
  )
}

/* ══════════════ How it works ══════════════ */
function HowItWorks() {
  const steps = [
    { n: '1️⃣', t: 'Enter property address' },
    { n: '2️⃣', t: 'Pick genre + language' },
    { n: '3️⃣', t: 'AI writes custom song' },
    { n: '4️⃣', t: 'Share everywhere' },
  ]
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-body" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 19 }}>{s.n}</span>
              <span style={{ fontSize: 12.5, color: 'var(--w7)' }}>{s.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════ Loading ══════════════ */
function LoadingSteps({ stepIndex }) {
  const all = [...STEPS, { icon: '✅', label: 'Your lyrics are ready!', ms: 0 }]
  return (
    <div className="card fade-up" style={{ marginBottom: 18 }}>
      <div className="card-body">
        {all.map((s, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          const pending = i > stepIndex
          return (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                opacity: pending ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                {done ? <span style={{ color: 'var(--green)' }}>✓</span> : active ? <span className="spinner" /> : <span style={{ color: 'var(--w3)' }}>○</span>}
              </div>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: done ? 'var(--green)' : active ? 'var(--w9)' : 'var(--w5)' }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════ Result ══════════════ */
function SongResult({ song, form, onReset, flash }) {
  const shareText = `🎵 ${song.title}\n\n${song.hook || ''}\n\n${form.address}\n${form.agentName} · ${form.brokerage}\n${form.phone}`

  function downloadLyrics() {
    const body = LYRIC_SECTIONS
      .filter((s) => song[s.key])
      .map((s) => `[${s.label}]\n${song[s.key]}`)
      .join('\n\n')
    const text = `${song.title}\n${'='.repeat(song.title.length)}\n\n${form.address}\nGenre: ${form.genre} · Language: ${form.language}\n\n${body}\n\n---\n${form.agentName} · ${form.brokerage}\n${form.phone}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${song.title.replace(/[^a-z0-9]+/gi, '_')}_lyrics.txt`
    a.click()
    URL.revokeObjectURL(url)
    flash('Lyrics downloaded')
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
  }

  async function shareNative(platform) {
    if (navigator.share) {
      try {
        await navigator.share({ title: song.title, text: shareText })
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard?.writeText(shareText)
      flash(`Copied — paste into ${platform}`)
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareText)
    flash('Song details copied to clipboard')
  }

  return (
    <div className="fade-up">
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body">
          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 32, color: 'var(--gold)', lineHeight: 1.1, marginBottom: 8 }}>
              {song.title}
            </h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-gold">{form.genre}</span>
              <span className="badge badge-blue">{form.language}</span>
              {song.mood && <span className="badge badge-muted">{song.mood}</span>}
              <span className="badge badge-green">✅ Lyrics ready</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--w3)', marginTop: 8 }}>📍 {form.address}</div>
          </div>

          {/* Hook */}
          {song.hook && (
            <div
              style={{
                background: 'var(--gold-alpha)',
                border: '1px solid var(--gold-border)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
                🎤 Hook
              </div>
              <div style={{ fontSize: 15, color: 'var(--w9)', fontStyle: 'italic', lineHeight: 1.6 }}>
                “{song.hook}”
              </div>
            </div>
          )}

          {/* Lyrics */}
          <div style={{ display: 'grid', gap: 10 }}>
            {LYRIC_SECTIONS.filter((s) => song[s.key]).map((s) => (
              <div
                key={s.key}
                style={{
                  border: '1px solid var(--gold-alpha)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 7 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--w7)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                  {song[s.key]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Media placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 11, color: 'var(--w3)', marginBottom: 10 }}>🔊 Audio — connects in Phase 2 (SUNO AI)</div>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', borderRadius: 99,
                padding: '10px 16px', opacity: 0.45,
              }}
            >
              <span style={{ fontSize: 15 }}>▶</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--w3)' }}>0:90</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 11, color: 'var(--w3)', marginBottom: 10 }}>🎬 Video — connects in Phase 2 (HeyGen)</div>
            <div
              style={{
                aspectRatio: '16/9', borderRadius: 12,
                background: 'linear-gradient(135deg, #1a1520, #0f0d16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.45,
              }}
            >
              <div
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'rgba(212,175,55,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'var(--ink)',
                }}
              >
                ▶
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share + download */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body">
          <label className="field-label">Share</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn-ghost" onClick={shareWhatsApp} style={shareBtn}>💬 WhatsApp</button>
            <button className="btn-ghost" onClick={() => shareNative('Instagram')} style={shareBtn}>📸 Instagram</button>
            <button className="btn-ghost" onClick={() => shareNative('TikTok')} style={shareBtn}>🎵 TikTok</button>
            <button className="btn-ghost" onClick={() => shareNative('YouTube')} style={shareBtn}>▶ YouTube</button>
            <button className="btn-ghost" onClick={() => shareNative('Facebook')} style={shareBtn}>📘 Facebook</button>
          </div>

          <label className="field-label">Download</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <button className="btn-ghost" onClick={downloadLyrics} style={shareBtn}>⬇ Lyrics (.txt)</button>
            <button className="btn-ghost" disabled title="Available once SUNO AI is connected in Phase 2" style={shareBtn}>
              ⬇ MP3 · Phase 2
            </button>
            <button className="btn-ghost" disabled title="Available once HeyGen is connected in Phase 2" style={shareBtn}>
              ⬇ MP4 · Phase 2
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--w1)' }}>
            <button className="btn-gold" onClick={copyLink}>🔗 Copy share text</button>
            <button className="btn-ghost" onClick={onReset}>🔄 Generate Another Song</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const shareBtn = { padding: '9px 14px', fontSize: 12 }
const code = { fontFamily: "'DM Mono', monospace", color: 'var(--gold)', fontSize: 11.5 }

/* ══════════════ History ══════════════ */
function SongHistory({ history, onView }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🎼 Recent Songs</div>
          <div className="card-subtitle">Last {Math.min(5, history.length)} generated · saved in this browser</div>
        </div>
      </div>
      <div className="card-body">
        {history.slice(0, 5).map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 13px', marginBottom: 6, borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: 18 }}>🎵</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--w9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.title}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--w3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.address} · {s.genre} · {s.language} · {s.createdAt}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => onView(s)} style={{ padding: '5px 11px', fontSize: 11, flexShrink: 0 }}>
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════ Warning banner ══════════════ */
function Warning({ title, body }) {
  return (
    <div
      className="card"
      style={{ marginBottom: 18, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.28)' }}
    >
      <div className="card-body" style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--orange)', marginBottom: 5 }}>⚠️ {title}</div>
        <div style={{ fontSize: 12, color: 'var(--w5)', lineHeight: 1.7 }}>{body}</div>
      </div>
    </div>
  )
}
