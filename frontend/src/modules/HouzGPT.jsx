import { useState, useRef, useEffect } from 'react'
import { askHouzGPT } from '../services/houzgpt'
import { checkBackend } from '../services/openai'

const SUGGESTIONS = [
  'What is the land transfer tax on an $800k home in Toronto?',
  'How much deposit do I need to buy a home in Ontario?',
  'What are the steps to buy my first home in the GTA?',
  'Is now a good time to invest in Brampton pre-construction?',
  'What closing costs should a buyer budget for?',
]

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm HouzGPT 🏘️ — your Pabba Realty assistant for the Toronto GTA. Ask me about buying, selling, mortgages, land transfer tax, pre-construction, or anything about the local market. How can I help?",
}

export default function HouzGPT() {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backend, setBackend] = useState({ online: true, openaiConfigured: true })
  const scrollRef = useRef(null)

  useEffect(() => {
    checkBackend().then(setBackend)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const question = (text ?? input).trim()
    if (!question || loading) return

    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setError('')
    setLoading(true)

    try {
      // Send only the real conversation (skip the local greeting).
      const history = next.filter((m, i) => !(i === 0 && m === GREETING))
      const reply = await askHouzGPT(history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([GREETING])
    setError('')
  }

  const keyMissing = backend.online && !backend.openaiConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--gold)' }}>🏘️ HouzGPT</h2>
          <p style={{ fontSize: 12.5, color: 'var(--w5)' }}>Real-estate Q&amp;A for the Toronto GTA · powered by OpenAI</p>
        </div>
        <button className="btn-ghost" onClick={reset} style={{ fontSize: 12 }}>↻ New chat</button>
      </div>

      {!backend.online && (
        <Banner tone="red">⏳ Connecting to the server… free hosting can take ~30–60s to wake up. If it persists, reload the page.</Banner>
      )}
      {keyMissing && (
        <Banner tone="gold">🔑 OpenAI key not set on the backend — add <code>OPENAI_API_KEY</code> to <code>backend/.env</code>.</Banner>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="card"
        style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <Bubble role="assistant" content="…" typing />}
      </div>

      {error && <Banner tone="red" style={{ marginTop: 10, marginBottom: 0 }}>{error}</Banner>}

      {/* Suggestions (only before the first question) */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="pill" onClick={() => send(s)} style={{ fontSize: 11.5, cursor: 'pointer', textAlign: 'left' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send() }}
        style={{ display: 'flex', gap: 8, marginTop: 12 }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about buying, selling, mortgages, taxes…"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button className="btn-primary" type="submit" disabled={loading || !input.trim()} style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
          {loading ? '…' : 'Send'}
        </button>
      </form>
      <p style={{ fontSize: 10.5, color: 'var(--w3)', marginTop: 7, textAlign: 'center' }}>
        HouzGPT can be wrong on exact figures — always confirm tax/legal numbers with Srinivas Pabba or an official source.
      </p>
    </div>
  )
}

function Bubble({ role, content, typing }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '82%',
          padding: '10px 14px',
          borderRadius: 14,
          borderTopRightRadius: isUser ? 4 : 14,
          borderTopLeftRadius: isUser ? 14 : 4,
          background: isUser ? 'var(--primary)' : 'var(--gold-alpha)',
          border: isUser ? 'none' : '1px solid var(--gold-border)',
          color: isUser ? '#fff' : 'var(--w9)',
          fontSize: 13.5,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {typing ? <span className="typing-dots">HouzGPT is typing…</span> : content}
      </div>
    </div>
  )
}

function Banner({ tone, children, style }) {
  const map = {
    red: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.3)', fg: '#fca5a5' },
    gold: { bg: 'var(--gold-alpha)', bd: 'var(--gold-border)', fg: 'var(--gold-light)' },
  }
  const c = map[tone] || map.gold
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, borderRadius: 12, padding: '11px 14px', fontSize: 12.5, lineHeight: 1.6, marginBottom: 12, ...style }}>
      {children}
    </div>
  )
}
