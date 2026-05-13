'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLevelFromXp } from '@/lib/gamification'

interface SidebarProps {
  userEmail?: string
  totalXp?: number
  streak?: number
}

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Inicio' },
  { href: '/focus',     icon: '📞', label: 'Llamar' },
  { href: '/leads',     icon: '👥', label: 'Leads' },
  { href: '/analytics', icon: '📊', label: 'Analítica' },
]

export default function Sidebar({ userEmail = '', totalXp = 0, streak = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const level    = getLevelFromXp(totalXp)
  const initials = userEmail.charAt(0).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="dot" />
        <span className="name">CoolCalling</span>
      </div>

      {streak > 0 && (
        <div style={{ margin: '0 12px 20px', background: '#1A1A1A', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{streak} días</div>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Racha activa</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
            <span className="icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip" onClick={handleLogout} title="Cerrar sesión">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{userEmail.split('@')[0]}</span>
            <span className="user-level">{level.name} · {totalXp} XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
