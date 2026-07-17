export default function Placeholder({ module }) {
  return (
    <div className="card fade-up" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div className="card-body" style={{ padding: '48px 32px' }}>
        <div style={{ fontSize: 64, marginBottom: 18 }}>{module?.icon || '🚧'}</div>

        <h2 style={{ fontSize: 28, color: 'var(--gold)', marginBottom: 10 }}>
          {module?.label || 'Module'}
        </h2>

        <p style={{ fontSize: 13.5, color: 'var(--w5)', lineHeight: 1.7, marginBottom: 18 }}>
          This module is under development.
        </p>

        <span className="badge badge-gold" style={{ padding: '5px 14px', fontSize: 11 }}>
          Coming Soon
        </span>

        <div
          style={{
            marginTop: 26,
            paddingTop: 18,
            borderTop: '1px solid var(--w1)',
            fontSize: 11,
            color: 'var(--w3)',
            lineHeight: 1.8,
          }}
        >
          Build order: Admin Panel → REAAMusic → Dashboard → {module?.label}
        </div>
      </div>
    </div>
  )
}
