export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: '🍁', category: 'Core', version: '1.0.0', permissions: ['*'], badge: 'LIVE', badgeType: 'green' },
  { id: 'leads', label: 'Lead Pipeline', icon: '🎯', category: 'CRM', version: '0.1.0', permissions: ['leads'], badge: '47', badgeType: 'red' },
  { id: 'whatsapp', label: 'WhatsApp Engine', icon: '💬', category: 'CRM', version: '0.1.0', permissions: ['whatsapp'], badge: '8.5K', badgeType: 'green' },
  { id: 'scraper', label: 'Find Businesses', icon: '🔎', category: 'Data', version: '1.0.0', permissions: ['scraper'], badge: 'NEW', badgeType: 'green' },
  { id: 'precon', label: 'Pre-Construction', icon: '🏗️', category: 'Data', version: '0.1.0', permissions: ['precon'] },
  { id: 'trreb', label: 'TRREB Intel', icon: '📊', category: 'Data', version: '0.1.0', permissions: ['trreb'] },
  { id: 'cma', label: 'Smart CMA', icon: '📋', category: 'Tools', version: '0.1.0', permissions: ['cma'] },
  { id: 'houzgpt', label: 'HouzGPT Canada', icon: '🏘️', category: 'Tools', version: '0.1.0', permissions: ['houzgpt'] },
  { id: 'buyer', label: 'Buyer Agent AI', icon: '🏷️', category: 'Tools', version: '0.1.0', permissions: ['buyer'] },
  { id: 'listing', label: 'Listing Agent AI', icon: '🏡', category: 'Tools', version: '0.1.0', permissions: ['listing'] },
  { id: 'social', label: 'Social Engine', icon: '📱', category: 'Content', version: '0.1.0', permissions: ['social'] },
  { id: 'calendar', label: 'Content Calendar', icon: '📅', category: 'Content', version: '0.1.0', permissions: ['social'] },
  { id: 'video', label: 'Video Studio', icon: '🎬', category: 'Content', version: '0.1.0', permissions: ['social'] },
  { id: 'posters', label: 'AI Posters', icon: '🖼️', category: 'Content', version: '0.1.0', permissions: ['social'] },
  { id: 'reaamusic', label: 'REAAMusic', icon: '🎵', category: 'Content', version: '1.0.0', permissions: ['social'], badge: 'NEW', badgeType: 'green' },
  { id: 'voicebot', label: 'Vapi Voice Bot', icon: '🎙️', category: 'AI', version: '0.1.0', permissions: ['voicebot'] },
  { id: 'metaads', label: 'Meta Ads Creator', icon: '📢', category: 'Ads', version: '0.1.0', permissions: ['ads'] },
  { id: 'admin', label: 'Admin Panel', icon: '⚙️', category: 'System', version: '1.0.0', permissions: ['admin'] },
]

export const CATEGORIES = ['Core', 'CRM', 'Data', 'Tools', 'Content', 'AI', 'Ads', 'System']

/** Every permission key an admin can grant, for the Admin Panel checkboxes. */
export const ALL_PERMISSIONS = [
  'leads', 'cma', 'social', 'whatsapp', 'calendar',
  'video', 'posters', 'buyer', 'listing', 'scraper',
  'precon', 'voicebot', 'ads', 'houzgpt', 'trreb',
  'reaamusic', 'dashboard', 'admin',
]

export function getModule(id) {
  return MODULES.find((m) => m.id === id)
}
