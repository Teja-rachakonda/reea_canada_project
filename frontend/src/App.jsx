import { useState, useEffect } from 'react'
import { initAuth, getSession, logout, hasPermission } from './services/auth'
import { isModuleEnabled } from './services/storage'
import { MODULES } from './data/modules'
import { useIsMobile } from './hooks/useMediaQuery'

import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Placeholder from './components/Placeholder'

import Dashboard from './modules/Dashboard'
import AdminPanel from './modules/AdminPanel'
import REAAMusic from './modules/REAAMusic'

// Built modules. Everything else falls through to Placeholder.
const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  admin: AdminPanel,
  reaamusic: REAAMusic,
}

/**
 * The first module this user can actually open.
 * `dashboard` isn't in the manager/user permission arrays, so landing
 * everyone there would drop them on a module they can't see in the sidebar.
 */
function firstAllowedModule(user) {
  const found = MODULES.find((m) => hasPermission(user, m.id) && isModuleEnabled(m.id))
  return found?.id || null
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeModule, setActiveModule] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    initAuth()
    const session = getSession()
    if (session) {
      setUser(session)
      setActiveModule(firstAllowedModule(session))
    }
  }, [])

  // Leaving mobile width should never leave a stale drawer open on desktop.
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  function handleLogin(u) {
    setUser(u)
    setActiveModule(firstAllowedModule(u))
  }

  function handleLogout() {
    logout()
    setUser(null)
    setActiveModule(null)
    setDrawerOpen(false)
  }

  // On mobile, picking a module closes the drawer so the content is visible.
  function selectModule(id) {
    setActiveModule(id)
    setDrawerOpen(false)
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />

  // Guard: never render a module this user lacks permission for.
  const allowed = activeModule && hasPermission(user, activeModule) && isModuleEnabled(activeModule)
  const safeModule = allowed ? activeModule : firstAllowedModule(user)
  const activeModuleData = MODULES.find((m) => m.id === safeModule)
  const ModuleComponent = MODULE_COMPONENTS[safeModule] || Placeholder

  if (!activeModuleData) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="card-body" style={{ padding: 44 }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🚫</div>
            <h2 style={{ fontSize: 22, color: 'var(--red)', marginBottom: 8 }}>No Modules Available</h2>
            <p style={{ fontSize: 13, color: 'var(--w5)', marginBottom: 18 }}>
              This account has no enabled modules. Ask an admin to grant permissions.
            </p>
            <button className="btn-ghost" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Sidebar
        user={user}
        activeModule={safeModule}
        onModuleChange={selectModule}
        onLogout={handleLogout}
        mobile={isMobile}
        open={drawerOpen}
      />

      {/* Backdrop — tap outside the drawer to close it (mobile only). */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 190,
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          // On desktop the sidebar occupies grid column 1; on mobile it's an
          // overlay, so the content column must start at column 1 itself.
          gridColumn: isMobile ? '1 / -1' : 'auto',
        }}
      >
        <Topbar
          activeModule={activeModuleData}
          onNewClick={() => hasPermission(user, 'reaamusic') && selectModule('reaamusic')}
          isMobile={isMobile}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px 14px 32px' : '24px 28px 40px',
          }}
        >
          <ModuleComponent key={safeModule} user={user} module={activeModuleData} />
        </div>
      </div>
    </div>
  )
}
