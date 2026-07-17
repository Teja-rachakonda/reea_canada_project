import { useState } from 'react'
import { login } from '../services/auth'

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const user = login(username.trim(), password)
    if (user) {
      onLogin(user)
    } else {
      setError('Invalid credentials. Please try again.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              margin: '0 auto 14px',
              boxShadow: '0 6px 24px rgba(213,43,30,0.35)',
            }}
          >
            🍁
          </div>
          <h1 style={{ fontSize: 34, color: 'var(--gold)', lineHeight: 1 }}>REAA ULTIMATE</h1>
          <div style={{ fontSize: 12, color: 'var(--w3)', marginTop: 6, letterSpacing: 1 }}>
            Pabba Realty · GTA Canada
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="field-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                style={{ paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 15,
                  opacity: 0.6,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '10px 13px',
                fontSize: 12.5,
                color: 'var(--red)',
                marginBottom: 16,
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 13 }}>
            Sign In
          </button>
        </form>

        <div
          style={{
            marginTop: 26,
            paddingTop: 18,
            borderTop: '1px solid var(--w1)',
            textAlign: 'center',
            fontSize: 10.5,
            color: 'var(--w3)',
          }}
        >
          Pabba Realty · agency.pabbarealty.com
          <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
            admin/admin · swetha/swetha123 · user/user123
          </div>
        </div>
      </div>
    </div>
  )
}
