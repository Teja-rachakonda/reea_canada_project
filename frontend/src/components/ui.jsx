import { useState } from 'react'

/** Coloured info/warning banner. */
export function Banner({ tone = 'gold', children, style }) {
  const map = {
    red: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.3)', fg: '#fca5a5' },
    gold: { bg: 'var(--gold-alpha)', bd: 'var(--gold-border)', fg: 'var(--gold-light)' },
    green: { bg: 'rgba(0,232,122,0.1)', bd: 'rgba(0,232,122,0.28)', fg: 'var(--green)' },
  }
  const c = map[tone] || map.gold
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, borderRadius: 12, padding: '11px 14px', fontSize: 12.5, lineHeight: 1.6, marginBottom: 14, ...style }}>
      {children}
    </div>
  )
}

/** Copy-to-clipboard button with a brief "Copied" confirmation. */
export function CopyBtn({ text, label = '⧉ Copy' }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="btn-ghost"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1600) })}
      style={{ padding: '7px 14px', fontSize: 12, color: done ? 'var(--green)' : undefined }}
    >
      {done ? '✓ Copied' : label}
    </button>
  )
}

/** Row of selectable pills (single-select). */
export function ChipRow({ items, value, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
      {items.map((it) => (
        <button
          key={it}
          type="button"
          onClick={() => onPick(it)}
          className="pill"
          style={{
            fontSize: 12, cursor: 'pointer',
            background: value === it ? 'var(--gold-alpha)' : 'transparent',
            color: value === it ? 'var(--gold)' : 'var(--w5)',
            borderColor: value === it ? 'var(--gold-border)' : 'var(--w1)',
          }}
        >
          {it}
        </button>
      ))}
    </div>
  )
}

/** Centered spinner card shown while a request is in flight. */
export function LoadingCard({ children = 'Working…' }) {
  return (
    <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 34, color: 'var(--w5)' }}>
      <div className="spinner" style={{ margin: '0 auto 12px' }} />{children}
    </div></div>
  )
}
