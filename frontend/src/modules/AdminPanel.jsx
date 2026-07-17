import { useState } from 'react'
import { MODULES, ALL_PERMISSIONS } from '../data/modules'
import { getUsers, saveUsers } from '../services/auth'
import {
  getApiKeys, saveApiKeys,
  getSettings, saveSettings,
  getEnabledModules, saveEnabledModules,
} from '../services/storage'

const TABS = [
  { id: 'apikeys', label: 'API Keys', icon: '🔑' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'modules', label: 'Modules', icon: '🧩' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const CATEGORY_COLORS = {
  ai: 'blue', video: 'gold', voice: 'gold',
  data: 'green', messaging: 'green', maps: 'blue',
}

export default function AdminPanel({ user }) {
  const [tab, setTab] = useState('apikeys')
  const [toast, setToast] = useState(null)

  function flash(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 2600)
  }

  if (user.role !== 'admin') {
    return (
      <div className="card fade-up" style={{ maxWidth: 460, margin: '60px auto', textAlign: 'center' }}>
        <div className="card-body" style={{ padding: 44 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔒</div>
          <h2 style={{ fontSize: 24, color: 'var(--red)', marginBottom: 8 }}>Admin Only</h2>
          <p style={{ fontSize: 13, color: 'var(--w5)' }}>
            Your role is <strong style={{ color: 'var(--w7)' }}>{user.role}</strong>. Ask Srinivas for access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 16px',
              borderRadius: 9,
              border: '1px solid ' + (tab === t.id ? 'var(--gold-border)' : 'transparent'),
              background: tab === t.id ? 'var(--gold-alpha)' : 'transparent',
              color: tab === t.id ? 'var(--gold)' : 'var(--w5)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'apikeys' && <ApiKeysTab flash={flash} />}
      {tab === 'users' && <UsersTab flash={flash} />}
      {tab === 'modules' && <ModulesTab flash={flash} />}
      {tab === 'settings' && <SettingsTab flash={flash} />}

      {toast && (
        <div className={`toast${toast.isError ? ' error' : ''}`}>
          <span>{toast.isError ? '❌' : '✅'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ══════════════ TAB 1 — API KEYS ══════════════ */
function ApiKeysTab({ flash }) {
  const [keys, setKeys] = useState(getApiKeys)
  const [shown, setShown] = useState({})

  const grouped = Object.entries(keys).reduce((acc, [id, api]) => {
    ;(acc[api.category] ||= []).push([id, api])
    return acc
  }, {})

  function update(id, field, value) {
    setKeys((k) => ({ ...k, [id]: { ...k[id], [field]: value } }))
  }

  function handleSave() {
    saveApiKeys(keys)
    flash('API keys saved!')
  }

  return (
    <>
      <div
        className="card"
        style={{
          marginBottom: 16,
          background: 'rgba(74,158,245,0.06)',
          borderColor: 'rgba(74,158,245,0.22)',
        }}
      >
        <div className="card-body" style={{ padding: '14px 18px', fontSize: 12, color: 'var(--w5)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--blue)' }}>ℹ️ Where the OpenAI key lives.</strong>{' '}
          REAAMusic calls OpenAI through the backend, which reads{' '}
          <code style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>OPENAI_API_KEY</code> from{' '}
          <code style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>backend/.env</code> — so the key
          never reaches the browser. The fields below store config for the other services as they get wired up.
        </div>
      </div>

      {Object.entries(grouped).map(([cat, apis]) => (
        <div className="card" key={cat} style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div>
              <div className="card-title">{cat.toUpperCase()}</div>
              <div className="card-subtitle">{apis.length} service{apis.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="card-body">
            {apis.map(([id, api]) => (
              <div key={id} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--w9)' }}>{api.label}</span>
                  <span className={`badge badge-${CATEGORY_COLORS[api.category] || 'muted'}`}>{api.category}</span>
                  {api.model && (
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--w3)' }}>
                      {api.model}
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={shown[id] ? 'text' : 'password'}
                    value={api.key}
                    onChange={(e) => update(id, 'key', e.target.value)}
                    placeholder={`${api.label} API key`}
                    style={{ paddingRight: 44, fontFamily: "'DM Mono', monospace", fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [id]: !s[id] }))}
                    aria-label={shown[id] ? 'Hide key' : 'Show key'}
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6,
                    }}
                  >
                    {shown[id] ? '🙈' : '👁️'}
                  </button>
                </div>

                {id === 'heygen' && (
                  <input
                    className="input"
                    style={{ marginTop: 8 }}
                    value={api.swetha_avatar_id || ''}
                    onChange={(e) => update(id, 'swetha_avatar_id', e.target.value)}
                    placeholder="Swetha avatar ID"
                  />
                )}
                {id === 'elevenlabs' && (
                  <input
                    className="input"
                    style={{ marginTop: 8 }}
                    value={api.srinivas_voice_id || ''}
                    onChange={(e) => update(id, 'srinivas_voice_id', e.target.value)}
                    placeholder="Srinivas voice ID"
                  />
                )}
                {id === 'vapi' && (
                  <input
                    className="input"
                    style={{ marginTop: 8 }}
                    value={api.phone_number || ''}
                    onChange={(e) => update(id, 'phone_number', e.target.value)}
                    placeholder="+1 416-xxx-xxxx"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn-gold" onClick={handleSave} style={{ width: '100%', padding: 13 }}>
        💾 Save All API Keys
      </button>
    </>
  )
}

/* ══════════════ TAB 2 — USERS ══════════════ */
const BLANK_USER = { username: '', name: '', password: '', role: 'user', permissions: [] }

function UsersTab({ flash }) {
  const [users, setUsers] = useState(getUsers)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK_USER)

  function persist(next) {
    setUsers(next)
    saveUsers(next)
  }

  function startAdd() {
    setForm(BLANK_USER)
    setEditing('new')
  }

  function startEdit(u) {
    setForm({ ...u })
    setEditing(u.username)
  }

  function togglePerm(p) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }))
  }

  function handleSave() {
    if (!form.username.trim() || !form.password.trim()) {
      flash('Username and password are required.', true)
      return
    }
    const clash = users.find((u) => u.username === form.username && u.username !== editing)
    if (clash) {
      flash(`Username "${form.username}" already exists.`, true)
      return
    }
    const clean = { ...form, username: form.username.trim(), name: form.name.trim() || form.username.trim() }
    const next = editing === 'new'
      ? [...users, clean]
      : users.map((u) => (u.username === editing ? clean : u))
    persist(next)
    setEditing(null)
    flash(editing === 'new' ? 'User created!' : 'User updated!')
  }

  function handleDelete(username) {
    if (username === 'admin') {
      flash('The admin account cannot be deleted.', true)
      return
    }
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    persist(users.filter((u) => u.username !== username))
    flash('User deleted.')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">User Management</div>
            <div className="card-subtitle">{users.length} accounts</div>
          </div>
          <button className="btn-gold" onClick={startAdd} style={{ padding: '8px 14px', fontSize: 12 }}>
            + Add User
          </button>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {['Username', 'Name', 'Role', 'Permissions', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left', padding: '8px 10px',
                      fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                      textTransform: 'uppercase', color: 'var(--w3)',
                      borderBottom: '1px solid var(--w1)', whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.username}>
                  <td style={td}>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--w9)' }}>{u.username}</span>
                  </td>
                  <td style={td}>{u.name}</td>
                  <td style={td}>
                    <span className={`badge badge-${u.role === 'admin' ? 'red' : u.role === 'manager' ? 'gold' : 'muted'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ ...td, maxWidth: 240 }}>
                    <span style={{ fontSize: 11, color: 'var(--w5)' }}>
                      {u.permissions.includes('*') ? 'All modules' : `${u.permissions.length} modules`}
                    </span>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button className="btn-ghost" onClick={() => startEdit(u)} style={miniBtn}>Edit</button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleDelete(u.username)}
                      style={{ ...miniBtn, marginLeft: 6, color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="card fade-up">
          <div className="card-header">
            <div className="card-title">{editing === 'new' ? 'New User' : `Edit — ${editing}`}</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="field-label">Username</label>
                <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Full name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="user">user</option>
                </select>
              </div>
            </div>

            <label className="field-label">Permissions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <button
                className="pill"
                onClick={() => setForm({ ...form, permissions: form.permissions.includes('*') ? [] : ['*'] })}
                style={form.permissions.includes('*') ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff' } : {}}
              >
                ★ All modules (*)
              </button>
            </div>
            {!form.permissions.includes('*') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_PERMISSIONS.map((p) => (
                  <button
                    key={p}
                    className={`pill${form.permissions.includes(p) ? ' active' : ''}`}
                    onClick={() => togglePerm(p)}
                    style={{ fontSize: 11.5, padding: '6px 12px' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn-gold" onClick={handleSave}>💾 Save User</button>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const td = { padding: '11px 10px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--w5)' }
const miniBtn = { padding: '4px 10px', fontSize: 11, borderRadius: 7 }

/* ══════════════ TAB 3 — MODULES ══════════════ */
function ModulesTab({ flash }) {
  const [enabled, setEnabled] = useState(() => {
    const saved = getEnabledModules()
    return Object.fromEntries(MODULES.map((m) => [m.id, saved[m.id] !== false]))
  })

  function toggle(id) {
    if (id === 'admin') {
      flash('Admin Panel cannot be disabled — you would lock yourself out.', true)
      return
    }
    setEnabled((e) => ({ ...e, [id]: !e[id] }))
  }

  function handleSave() {
    saveEnabledModules(enabled)
    flash('Module settings saved! Reload to see sidebar changes.')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Module Control</div>
            <div className="card-subtitle">
              Disabled modules are hidden from the sidebar for every user
            </div>
          </div>
          <span className="badge badge-gold">
            {Object.values(enabled).filter(Boolean).length}/{MODULES.length} enabled
          </span>
        </div>
        <div className="card-body">
          {MODULES.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', marginBottom: 6, borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--w9)' }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--w3)' }}>{m.category}</div>
              </div>
              <span className="badge badge-muted" style={{ fontFamily: "'DM Mono', monospace" }}>v{m.version}</span>
              <button
                className={`toggle${enabled[m.id] ? ' on' : ''}`}
                onClick={() => toggle(m.id)}
                aria-label={`Toggle ${m.label}`}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="btn-gold" onClick={handleSave} style={{ width: '100%', padding: 13 }}>
        💾 Save Module Settings
      </button>
    </>
  )
}

/* ══════════════ TAB 4 — SETTINGS ══════════════ */
const SETTING_FIELDS = [
  { key: 'agencyName', label: 'Agency Name' },
  { key: 'brandName', label: 'Brand Name' },
  { key: 'agentName', label: 'Agent Name' },
  { key: 'agentPhone', label: 'Agent Phone' },
  { key: 'agentEmail', label: 'Agent Email' },
  { key: 'domain', label: 'Domain' },
  { key: 'whatsappNumber', label: 'WhatsApp Number' },
]

function SettingsTab({ flash }) {
  const [settings, setSettings] = useState(getSettings)

  function handleSave() {
    saveSettings(settings)
    flash('Settings saved!')
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Agency Settings</div>
            <div className="card-subtitle">Used as defaults across every module</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {SETTING_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="field-label">{f.label}</label>
                <input
                  className="input"
                  value={settings[f.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-gold" onClick={handleSave} style={{ width: '100%', padding: 13 }}>
        💾 Save Settings
      </button>
    </>
  )
}
