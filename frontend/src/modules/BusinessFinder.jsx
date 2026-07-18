import { useState, useEffect } from 'react'
import { searchBusinesses, checkPlaces } from '../services/businesses'
import { addLead } from '../services/storage'

const TYPE_CHIPS = ['Restaurants', 'Hair Salon', 'Grocery Store', 'Real Estate Office', 'Pizza Store', 'Dental Clinic', 'Gym']
const CITY_CHIPS = ['Mississauga', 'Brampton', 'Scarborough', 'North York', 'Etobicoke', 'Toronto']
const CUISINE_PLACEHOLDER = 'Indian, Chinese, Italian… (optional)'

export default function BusinessFinder() {
  const [type, setType] = useState('Restaurants')
  const [location, setLocation] = useState('Mississauga')
  const [cuisine, setCuisine] = useState('')
  const [wantEmail, setWantEmail] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [added, setAdded] = useState({}) // name -> true

  const [places, setPlaces] = useState({ online: true, placesConfigured: true })

  useEffect(() => {
    checkPlaces().then(setPlaces)
  }, [])

  async function run(e) {
    e?.preventDefault()
    if (!type.trim() || !location.trim()) {
      setError('Enter both a business type and a location.')
      return
    }
    setLoading(true)
    setError('')
    setData(null)
    setAdded({})
    try {
      const res = await searchBusinesses({ type, location, cuisine, wantEmail })
      setData(res)
      if (!res.results?.length) setError('No businesses found. Try a broader type or a different city.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function addOne(row) {
    addLead({
      name: row.name,
      phone: row.phone,
      email: row.email,
      source: 'Business Finder',
      keyword: `${cuisine ? cuisine + ' ' : ''}${type} in ${location}`,
      status: 'new',
      address: row.address,
      website: row.website,
    })
    setAdded((a) => ({ ...a, [row.name]: true }))
  }

  function addAll() {
    data.results.forEach((r) => addOne(r))
  }

  function exportCsv() {
    const rows = data.results
    const head = ['Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Email', 'Address', 'Website']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [head.join(',')]
    rows.forEach((r) =>
      lines.push([r.name, r.category, r.rating ?? '', r.reviews ?? '', r.phone, r.email, r.address, r.website].map(esc).join(','))
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `businesses-${location}-${type}`.toLowerCase().replace(/\s+/g, '-') + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const keyMissing = places.online && !places.placesConfigured

  return (
    <div className="fade-up" style={{ maxWidth: 1100 }}>
      {/* Intro */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <h2 style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 6 }}>🔎 Find Businesses</h2>
          <p style={{ fontSize: 13, color: 'var(--w5)', lineHeight: 1.65 }}>
            Search real businesses by type and location — get name, phone, address and website. Add them
            straight to Leads or export a CSV. Data comes from Google&apos;s live business index, so every
            contact is real and callable (no AI guesses).
          </p>
        </div>
      </div>

      {/* Backend / key warnings */}
      {!places.online && (
        <Banner tone="red">⚠️ Backend offline — start it with <code>cd backend &amp;&amp; npm run dev</code>. On the free host it may take ~50s to wake; refresh shortly.</Banner>
      )}
      {keyMissing && (
        <Banner tone="gold">
          🔑 Google Places key not set. Add <code>GOOGLE_PLACES_KEY</code> to <code>backend/.env</code> and
          enable “Places API (New)” on the key. Until then, searches return nothing.
        </Banner>
      )}

      {/* Search form */}
      <form className="card" onSubmit={run} style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 14 }}>
            <div>
              <div className="field-label">Business type</div>
              <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Restaurants" />
              <ChipRow items={TYPE_CHIPS} onPick={setType} active={type} />
            </div>
            <div>
              <div className="field-label">Location</div>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mississauga" />
              <ChipRow items={CITY_CHIPS} onPick={setLocation} active={location} />
            </div>
          </div>

          <div>
            <div className="field-label">Cuisine / keyword (optional)</div>
            <input className="input" value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder={CUISINE_PLACEHOLDER} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--w7)', cursor: 'pointer' }}>
            <input type="checkbox" checked={wantEmail} onChange={(e) => setWantEmail(e.target.checked)} />
            Also try to find email addresses (slower — scans each business website; often blank)
          </label>

          <button className="btn-primary" type="submit" disabled={loading} style={{ justifySelf: 'start', padding: '10px 22px' }}>
            {loading ? '🔄 Searching…' : '🔎 Search Businesses'}
          </button>
        </div>
      </form>

      {error && <Banner tone="red">{error}</Banner>}

      {loading && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--w5)' }}>
            <div className="spinner" style={{ margin: '0 auto 14px' }} />
            Searching Google for “{[cuisine, type].filter(Boolean).join(' ')} in {location}”
            {wantEmail && <div style={{ fontSize: 11, marginTop: 8 }}>Checking business websites for emails — this can take up to a minute.</div>}
          </div>
        </div>
      )}

      {/* Results */}
      {data?.results?.length > 0 && !loading && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="card-title">{data.count} businesses found</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={addAll} style={{ fontSize: 12 }}>+ Add all to Leads</button>
              <button className="btn-ghost" onClick={exportCsv} style={{ fontSize: 12 }}>⬇ Export CSV</button>
            </div>
          </div>
          <div className="card-body" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
              <thead>
                <tr>
                  {['Business', 'Phone', 'Email', 'Address', '', ''].map((h, i) => (
                    <th key={i} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--w1)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: 'var(--w9)' }}>{r.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--w3)' }}>
                        {r.category}{r.rating != null && ` · ⭐ ${r.rating} (${r.reviews})`}
                      </div>
                    </td>
                    <td style={td}>
                      {r.phone ? <a href={`tel:${r.phone}`} style={link}>{r.phone}</a> : <span style={{ color: 'var(--w3)' }}>—</span>}
                    </td>
                    <td style={td}>
                      {r.email ? <a href={`mailto:${r.email}`} style={link}>{r.email}</a> : <span style={{ color: 'var(--w3)' }}>{data.emailsAttempted ? 'not found' : '—'}</span>}
                    </td>
                    <td style={{ ...td, maxWidth: 240, color: 'var(--w5)' }}>{r.address}</td>
                    <td style={td}>
                      {r.website && <a href={r.website} target="_blank" rel="noreferrer" style={link}>site ↗</a>}
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button
                        className="btn-ghost"
                        onClick={() => addOne(r)}
                        disabled={added[r.name]}
                        style={{ fontSize: 11, padding: '5px 10px', color: added[r.name] ? 'var(--green)' : undefined }}
                      >
                        {added[r.name] ? '✓ Added' : '+ Lead'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wantEmail && (
            <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--w3)', borderTop: '1px solid var(--w1)' }}>
              ⚖️ Canada&apos;s anti-spam law (CASL) requires consent before commercial email. Use these to
              call or research — not for unsolicited bulk email.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChipRow({ items, onPick, active }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {items.map((it) => (
        <button
          key={it}
          type="button"
          onClick={() => onPick(it)}
          className="pill"
          style={{
            fontSize: 11,
            cursor: 'pointer',
            background: active === it ? 'var(--gold-alpha)' : 'transparent',
            color: active === it ? 'var(--gold)' : 'var(--w5)',
            borderColor: active === it ? 'var(--gold-border)' : 'var(--w1)',
          }}
        >
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

const th = { textAlign: 'left', padding: '9px 12px', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--w3)', borderBottom: '1px solid var(--w1)', whiteSpace: 'nowrap' }
const td = { padding: '10px 12px', verticalAlign: 'top' }
const link = { color: 'var(--blue)', textDecoration: 'none' }
