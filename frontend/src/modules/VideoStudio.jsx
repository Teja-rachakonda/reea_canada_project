import { useState, useEffect, useRef } from 'react'
import { writeVideoScript, createVideo, getVideoStatus, checkHeyGen } from '../services/video'
import { getSettings } from '../services/storage'
import { Banner, CopyBtn, LoadingCard } from '../components/ui'

export default function VideoStudio() {
  const settings = getSettings()
  const [details, setDetails] = useState({ address: '', price: '', details: '' })
  const [script, setScript] = useState('')
  const [title, setTitle] = useState('')

  const [writing, setWriting] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | submitting | processing | completed | failed
  const [videoId, setVideoId] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState({ online: true, heygenConfigured: true, openaiConfigured: true })
  const attemptsRef = useRef(0)

  useEffect(() => { checkHeyGen().then(setStatus) }, [])
  const set = (k) => (e) => setDetails((d) => ({ ...d, [k]: e.target.value }))

  async function writeScript() {
    if (!details.address.trim() && !details.details.trim()) {
      setError('Add an address or some details first, so the script has something to say.')
      return
    }
    setWriting(true); setError('')
    try {
      setScript(await writeVideoScript({ ...details, agentName: settings.agentName }))
    } catch (err) { setError(err.message) }
    finally { setWriting(false) }
  }

  async function generate() {
    if (!script.trim()) { setError('Write or paste a script first.'); return }
    setError(''); setVideoUrl(''); setPhase('submitting')
    try {
      const id = await createVideo(script, title || `REAA Video — ${details.address || 'Listing'}`)
      attemptsRef.current = 0
      setVideoId(id); setElapsed(0); setPhase('processing')
    } catch (err) { setError(err.message); setPhase('idle') }
  }

  // Poll HeyGen while a render is in progress.
  useEffect(() => {
    if (phase !== 'processing' || !videoId) return
    const iv = setInterval(async () => {
      attemptsRef.current += 1
      setElapsed((s) => s + 6)
      try {
        const s = await getVideoStatus(videoId)
        if (s.status === 'completed') { setVideoUrl(s.videoUrl); setPhase('completed'); clearInterval(iv) }
        else if (s.status === 'failed') { setError(s.error || 'HeyGen could not render this video.'); setPhase('failed'); clearInterval(iv) }
      } catch { /* transient network hiccup — keep polling */ }
      if (attemptsRef.current > 60) { // ~6 minutes
        clearInterval(iv); setPhase('failed'); setError('Timed out waiting for HeyGen. It may still finish — check your HeyGen dashboard.')
      }
    }, 6000)
    return () => clearInterval(iv)
  }, [phase, videoId])

  function reset() {
    setPhase('idle'); setVideoId(null); setVideoUrl(''); setElapsed(0); setError('')
  }

  const busy = writing || phase === 'submitting' || phase === 'processing'
  const heygenMissing = status.online && !status.heygenConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 900 }}>
      <div className="card" style={{ marginBottom: 16 }}><div className="card-body">
        <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>🎬 Video Studio</h2>
        <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
          Turn a listing into a Swetha avatar video. Write the script (or let AI draft it), then generate —
          HeyGen renders it in about 1–3 minutes using the branded template.
        </p>
      </div></div>

      {!status.online && <Banner tone="red">⚠️ Backend offline — start it with <code>cd backend &amp;&amp; npm run dev</code>.</Banner>}
      {heygenMissing && <Banner tone="gold">🔑 HeyGen key not set — add <code>HEYGEN_API_KEY</code> to <code>backend/.env</code>.</Banner>}
      <Banner tone="gold">💳 Each video uses your HeyGen account credits. Generate when the script is final.</Banner>

      {/* Step 1: script */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">1 · Script</div></div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
            <div><div className="field-label">Address / Area</div><input className="input" value={details.address} onChange={set('address')} placeholder="55 Lakeshore Rd, Mississauga" /></div>
            <div><div className="field-label">Price</div><input className="input" value={details.price} onChange={set('price')} placeholder="$899,000" /></div>
          </div>
          <div><div className="field-label">Listing details</div>
            <textarea className="input" value={details.details} onChange={set('details')} rows={2} style={{ resize: 'vertical' }}
              placeholder="3 bed detached, renovated kitchen, finished basement, steps to GO station, open house Sat 2–4 PM" />
          </div>
          <button type="button" className="btn-ghost" onClick={writeScript} disabled={busy} style={{ justifySelf: 'start', fontSize: 12.5 }}>
            {writing ? '✍️ Writing…' : '✨ Write script with AI'}
          </button>

          <div>
            <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Script (spoken by Swetha)</span>
              <span style={{ color: script.length > 1500 ? 'var(--red)' : 'var(--w3)' }}>{script.length}/1500</span>
            </div>
            <textarea className="input" value={script} onChange={(e) => setScript(e.target.value)} rows={6} style={{ resize: 'vertical' }}
              placeholder="Write or edit the words Swetha will say in the video…" />
          </div>
        </div>
      </div>

      {/* Step 2: generate */}
      <div className="card">
        <div className="card-header"><div className="card-title">2 · Generate video</div></div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          {phase === 'idle' || phase === 'failed' ? (
            <button className="btn-primary" onClick={generate} disabled={busy || !script.trim() || script.length > 1500} style={{ justifySelf: 'start', padding: '10px 22px' }}>
              🎬 Generate Video
            </button>
          ) : phase === 'submitting' ? (
            <LoadingCard>Submitting to HeyGen…</LoadingCard>
          ) : phase === 'processing' ? (
            <div style={{ textAlign: 'center', padding: 26, color: 'var(--w6)' }}>
              <div className="spinner" style={{ margin: '0 auto 14px' }} />
              <div style={{ fontSize: 14, color: 'var(--gold)' }}>Rendering your video…</div>
              <div style={{ fontSize: 12, color: 'var(--w3)', marginTop: 6 }}>~{elapsed}s elapsed · usually 1–3 minutes. Keep this tab open.</div>
            </div>
          ) : null}

          {phase === 'completed' && videoUrl && (
            <div style={{ display: 'grid', gap: 12 }}>
              <video controls src={videoUrl} style={{ width: '100%', borderRadius: 12, background: '#000' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a className="btn-primary" href={videoUrl} target="_blank" rel="noreferrer" download style={{ padding: '8px 16px', fontSize: 12.5, textDecoration: 'none' }}>⬇ Download MP4</a>
                <CopyBtn text={videoUrl} label="⧉ Copy video link" />
                <button className="btn-ghost" onClick={reset} style={{ fontSize: 12.5 }}>＋ New video</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--w3)' }}>Tip: the HeyGen link can expire — download the MP4 to keep it.</div>
            </div>
          )}

          {error && <Banner tone="red" style={{ marginBottom: 0 }}>{error}</Banner>}
        </div>
      </div>
    </div>
  )
}
