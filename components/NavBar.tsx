'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavBarProps {
  userEmail?: string
  light?: boolean   // true = sobre fondo oscuro/rojo → texto blanco
}

const NAV = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/focus',     label: 'Llamar' },
  { href: '/leads',     label: 'Leads' },
  { href: '/analytics', label: 'Analítica' },
  { href: '/essence',   label: 'Esencia' },
]

export default function NavBar({ userEmail = '', light = false }: NavBarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const fg     = light ? 'rgba(255,255,255,0.9)' : 'var(--black)'
  const fgMid  = light ? 'rgba(255,255,255,0.5)' : 'var(--gray-mid)'
  const bg     = light ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)'
  const border = light ? 'rgba(255,255,255,0.2)'  : 'var(--gray-border)'
  const activeBg = light ? 'rgba(255,255,255,0.25)' : 'var(--black)'
  const activeFg = light ? 'white' : 'white'

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ position: 'fixed', top: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: bg, backdropFilter: 'blur(16px)',
        border: `1px solid ${border}`,
        borderRadius: 100, padding: '6px 8px',
        pointerEvents: 'all',
        boxShadow: light ? 'none' : '0 2px 20px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', padding: '6px 14px 6px 8px', textDecoration: 'none', borderRight: `1px solid ${border}`, marginRight: 4 }}>
          <img src="/logo.svg" alt="CoolCalling" style={{ height: 16, filter: light ? 'brightness(0) invert(1)' : 'none' }} />
        </Link>

        {/* Nav links */}
        {NAV.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              padding: '8px 16px', borderRadius: 100,
              fontSize: 13, fontWeight: 600,
              color: active ? activeFg : fgMid,
              background: active ? activeBg : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </Link>
          )
        })}

        {/* User */}
        {userEmail && (
          <div style={{ borderLeft: `1px solid ${border}`, marginLeft: 4, paddingLeft: 8 }}>
            <button onClick={logout} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 100,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: fgMid,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 100,
                background: light ? 'rgba(255,255,255,0.25)' : 'var(--red)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: fgMid }}>Salir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
