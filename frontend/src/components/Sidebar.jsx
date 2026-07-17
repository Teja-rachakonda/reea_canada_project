import { MODULES, CATEGORIES } from '../data/modules'
import { hasPermission } from '../services/auth'
import { isModuleEnabled } from '../services/storage'

export default function Sidebar({ user, activeModule, onModuleChange, onLogout }) {
  // A module shows only if the user has permission AND admin hasn't disabled it.
  const visible = MODULES.filter(
    (m) => hasPermission(user, m.id) && isModuleEnabled(m.id)
  )

  const initials = (user.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: 'rgba(4,3,8,0.94)',
        borderRight: '1px solid var(--gold-alpha)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '18px 16px',
          borderBottom: '1px solid var(--gold-alpha)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 19,
            flexShrink: 0,
          }}
        >
          🍁
        </div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold)', lineHeight: 1 }}>
            REAA
          </div>
          <div style={{ fontSize: 9, color: 'var(--w3)', letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 2 }}>
            Pabba Realty · GTA
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {CATEGORIES.map((cat) => {
          const items = visible.filter((m) => m.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: 2.4,
                  textTransform: 'uppercase',
                  color: 'var(--w3)',
                  padding: '0 8px',
                  marginBottom: 7,
                }}
              >
                {cat}
              </div>
              {items.map((m) => {
                const active = m.id === activeModule
                return (
                  <button
                    key={m.id}
                    onClick={() => onModuleChange(m.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 10px',
                      marginBottom: 2,
                      borderRadius: 9,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12.5,
                      fontWeight: 500,
                      textAlign: 'left',
                      background: active ? 'var(--gold-alpha)' : 'transparent',
                      color: active ? 'var(--gold)' : 'var(--w5)',
                      border: '1px solid transparent',
                      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--gold-alpha)'
                        e.currentTarget.style.color = 'var(--w7)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--w5)'
                      }
                    }}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                    <span style={{ flex: 1 }}>{m.label}</span>
                    {m.badge && <span className={`badge badge-${m.badgeType || 'gold'}`}>{m.badge}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Agent pill */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--gold-alpha)', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--gold-alpha)',
            border: '1px solid var(--gold-border)',
            borderRadius: 10,
            padding: '9px 11px',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ink)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--gold)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--w3)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
          <div className="pulse-dot" />
        </div>
        <button
          className="btn-ghost"
          onClick={onLogout}
          style={{ width: '100%', marginTop: 8, padding: '7px', fontSize: 11.5 }}
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
