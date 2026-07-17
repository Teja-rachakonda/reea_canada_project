const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    name: 'Srinivas Pabba',
    permissions: ['*'],
  },
  {
    username: 'swetha',
    password: 'swetha123',
    role: 'manager',
    name: 'Swetha Pulluri-Pabba',
    permissions: [
      'leads', 'cma', 'social', 'whatsapp',
      'calendar', 'video', 'posters',
      'buyer', 'listing',
    ],
  },
  {
    username: 'user',
    password: 'user123',
    role: 'user',
    name: 'Team Member',
    permissions: ['leads', 'calendar', 'social'],
  },
]

export function initAuth() {
  if (!localStorage.getItem('reaa_users')) {
    localStorage.setItem('reaa_users', JSON.stringify(DEFAULT_USERS))
  }
}

export function login(username, password) {
  const users = JSON.parse(localStorage.getItem('reaa_users') || '[]')
  const user = users.find(
    (u) => u.username === username && u.password === password
  )
  if (!user) return null
  const session = { ...user, loginTime: Date.now() }
  localStorage.setItem('reaa_session', JSON.stringify(session))
  return session
}

export function logout() {
  localStorage.removeItem('reaa_session')
}

export function getSession() {
  const s = localStorage.getItem('reaa_session')
  return s ? JSON.parse(s) : null
}

export function hasPermission(user, moduleId) {
  if (!user) return false
  if (user.permissions.includes('*')) return true
  return user.permissions.includes(moduleId)
}

export function getUsers() {
  return JSON.parse(localStorage.getItem('reaa_users') || '[]')
}

export function saveUsers(users) {
  localStorage.setItem('reaa_users', JSON.stringify(users))
}

export function resetUsers() {
  localStorage.setItem('reaa_users', JSON.stringify(DEFAULT_USERS))
  return DEFAULT_USERS
}

export { DEFAULT_USERS }
