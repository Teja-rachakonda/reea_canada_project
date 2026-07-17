import { getSongs, getLeads, getSettings } from '../services/storage'

const AGENT_PROGRESS = [
  { label: 'Lead Generation', pct: 92 },
  { label: 'Social Media', pct: 87 },
  { label: 'WhatsApp Automation', pct: 95 },
  { label: 'CMA & Reports', pct: 78 },
  { label: 'Video Production', pct: 83 },
]

const PIPELINE = [
  { n: '✓', label: 'Viral topic scraped', tool: 'Perplexity Pro', done: true },
  { n: '✓', label: 'Script generated', tool: 'OpenAI gpt-4o', done: true },
  { n: '3', label: 'Waiting Srinivas approval', tool: 'Flaaxa WAPI', active: true },
  { n: '4', label: 'HeyGen render pending', tool: 'HeyGen API' },
  { n: '5', label: 'Multi-platform publish pending', tool: 'Meta + TikTok' },
]

const MARKETS = [
  {
    title: '🎯 Primary Markets',
    badge: 'gold',
    items: ['Mississauga', 'Brampton', 'Toronto', 'Scarborough', 'Etobicoke', 'North York'],
    note: 'TRREB Member · Daily active coverage',
  },
  {
    title: '🌐 Secondary Markets',
    badge: 'blue',
    items: ['Markham', 'Richmond Hill', 'Vaughan', 'Ajax', 'Whitby', 'Oshawa'],
    note: 'Full service · Active coverage',
  },
  {
    title: '🗺️ Communities Served',
    badge: 'green',
    items: ['Telugu 150K+', 'Tamil 250K+', 'Kannada 50K+', 'Hindi/Hinglish'],
    note: '60%+ Telugu GTA recognise the PABBA surname',
  },
]

export default function Dashboard({ user }) {
  const settings = getSettings()
  const songs = getSongs()
  const leads = getLeads()

  // Demo figures come from the spec. Songs/leads are real counts from storage.
  const stats = [
    { icon: '🎯', value: '47', label: 'Active Leads Pipeline', trend: '↑ +12 this week', demo: true },
    { icon: '📱', value: '8,500', label: 'WhatsApp Contacts', trend: '↑ 30-40K database', demo: true },
    { icon: '👁️', value: '1,489', label: 'Instagram Followers', trend: '↑ Target: 10,000', demo: true },
    { icon: '🎵', value: String(songs.length), label: 'Songs Generated', trend: songs.length ? 'REAAMusic · live' : 'None yet', demo: false },
  ]

  return (
    <div className="fade-up">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <div className="card-body" style={{ padding: '17px 19px', position: 'relative' }}>
              {s.demo && (
                <span
                  className="badge badge-muted"
                  style={{ position: 'absolute', top: 12, right: 12, fontSize: 8.5 }}
                  title="Placeholder figure — wires to Supabase when the Lead Pipeline module is built"
                >
                  DEMO
                </span>
              )}
              <div style={{ fontSize: 21, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: 'var(--gold)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--w5)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', marginTop: 6 }}>{s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card fade-up-1">
          <div className="card-header">
            <div>
              <div className="card-title">🤖 AI Agent Coverage</div>
              <div className="card-subtitle">Planned automation surface · demo figures</div>
            </div>
          </div>
          <div className="card-body">
            {AGENT_PROGRESS.map((p) => (
              <div key={p.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--w5)', marginBottom: 5 }}>
                  <span>{p.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{p.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--w1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p.pct}%`,
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                      transition: 'width 1.2s cubic-bezier(.22,1,.36,1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-up-2">
          <div className="card-header">
            <div>
              <div className="card-title">📅 Today's Content Pipeline</div>
              <div className="card-subtitle">Automated · Monday · English · Market Update</div>
            </div>
          </div>
          <div className="card-body">
            {PIPELINE.map((p) => (
              <div
                key={p.label}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '11px 0', borderBottom: '1px solid var(--w1)',
                }}
              >
                <div
                  style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 800,
                    background: p.done ? 'rgba(0,232,122,0.15)' : p.active ? 'var(--gold-alpha)' : 'var(--w1)',
                    border: `1px solid ${p.done ? 'rgba(0,232,122,0.3)' : p.active ? 'var(--gold-border)' : 'transparent'}`,
                    color: p.done ? 'var(--green)' : p.active ? 'var(--gold)' : 'var(--w3)',
                  }}
                >
                  {p.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--w9)' }}>{p.label}</div>
                  <span
                    style={{
                      display: 'inline-block', marginTop: 4,
                      background: 'rgba(74,158,245,0.1)', border: '1px solid rgba(74,158,245,0.2)',
                      padding: '2px 8px', borderRadius: 5, fontSize: 9.5, fontWeight: 700,
                      color: 'var(--blue)', fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {p.tool}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'var(--w3)', marginTop: 12, fontStyle: 'italic' }}>
              Illustrative pipeline — becomes live once the Social Engine module is built.
            </div>
          </div>
        </div>
      </div>

      {/* Markets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {MARKETS.map((m) => (
          <div className="card fade-up-3" key={m.title}>
            <div className="card-header">
              <div className="card-title">{m.title}</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {m.items.map((i) => (
                  <span key={i} className={`badge badge-${m.badge}`} style={{ padding: '4px 10px', fontSize: 10.5 }}>
                    {i}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--w5)' }}>{m.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: 'var(--w3)', textAlign: 'center' }}>
        {settings.brandName} · {settings.domain} · Signed in as {user.name}
      </div>
    </div>
  )
}
