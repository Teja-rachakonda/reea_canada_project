export default function Topbar({ activeModule, onNewClick, isMobile = false, onMenuClick }) {
  return (
    <div
      style={{
        height: 58,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(4,3,8,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--gold-alpha)',
        padding: isMobile ? '0 14px' : '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 10 : 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 9,
              border: '1px solid var(--gold-border)',
              background: 'var(--gold-alpha)',
              color: 'var(--gold)',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        )}
        <span style={{ fontSize: 18 }}>{activeModule?.icon}</span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 19,
              letterSpacing: 0.6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeModule?.label || 'REAA'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--w3)' }}>
            {activeModule?.category} · v{activeModule?.version || '1.0.0'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,232,122,0.1)',
              border: '1px solid rgba(0,232,122,0.28)',
              padding: '5px 11px',
              borderRadius: 20,
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--green)',
            }}
          >
            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
            LIVE
          </div>
        )}
        {!isMobile && (
          <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>
            ⚙️ Settings
          </button>
        )}
        <button
          className="btn-primary"
          style={{ padding: isMobile ? '7px 12px' : '7px 15px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={onNewClick}
        >
          + New
        </button>
      </div>
    </div>
  )
}
