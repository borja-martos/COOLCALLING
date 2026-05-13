'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { getLevelFromXp, getXpProgress, getNextLevel } from '@/lib/gamification'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading]   = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [totalXp, setTotalXp]   = useState(0)
  const [streak, setStreak]     = useState(0)
  const [callsToday, setCallsToday] = useState(0)
  const [interestedToday, setInterestedToday] = useState(0)
  const [xpToday, setXpToday]   = useState(0)
  const [pendingLeads, setPendingLeads] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      setUserEmail(user.email || '')

      const [{ data: stats }, { data: todayCalls }, { count }] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
        supabase.from('calls').select('result, xp_earned').eq('user_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('leads').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'pending'),
      ])

      setTotalXp(stats?.total_xp || 0)
      setStreak(stats?.streak_days || 0)
      setCallsToday(todayCalls?.length || 0)
      setInterestedToday(todayCalls?.filter(c => c.result === 'interested').length || 0)
      setXpToday(todayCalls?.reduce((s, c) => s + (c.xp_earned || 0), 0) || 0)
      setPendingLeads(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const level    = getLevelFromXp(totalXp)
  const nextLvl  = getNextLevel(totalXp)
  const progress = getXpProgress(totalXp)

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--white)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-mid)' }}>Cargando...</div>
    </div>
  )

  return (
    <div className="layout">
      <Sidebar userEmail={userEmail} totalXp={totalXp} streak={streak} />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">Inicio</span>
          <div className="topbar-right">
            <Link href="/leads" className="btn btn-secondary btn-md">📂 Subir leads</Link>
            <Link href="/focus" className="btn btn-primary btn-md">📞 Iniciar sesión</Link>
          </div>
        </div>

        <div className="page-content">
          {/* Greeting */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div className="section-label">Buenos días</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {userEmail.split('@')[0]}.
              </div>
            </div>
            {streak > 0 && (
              <div className="streak-badge">
                <span style={{ fontSize: 28 }}>🔥</span>
                <div>
                  <div className="days">{streak} días</div>
                  <div className="lbl">Racha activa</div>
                </div>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card card">
              <span style={{ fontSize: 22 }}>📞</span>
              <span className="kpi-number">{callsToday}</span>
              <span className="kpi-label">Llamadas hoy</span>
            </div>
            <div className="kpi-card card card-purple">
              <span style={{ fontSize: 22 }}>⭐</span>
              <span className="kpi-number" style={{ color: 'var(--purple)' }}>{xpToday}</span>
              <span className="kpi-label">XP hoy</span>
            </div>
            <div className="kpi-card" style={{ background: 'var(--green-lt)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <span className="kpi-number" style={{ color: 'var(--green)' }}>{interestedToday}</span>
              <span className="kpi-label">Interesados</span>
            </div>
            <div className="kpi-card card">
              <span style={{ fontSize: 22 }}>👥</span>
              <span className="kpi-number">{pendingLeads}</span>
              <span className="kpi-label">Leads pendientes</span>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
            <div className="card card-black" style={{ padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
                  {pendingLeads ? `${pendingLeads} leads esperando.` : 'Sube tus leads\ny empieza.'}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', fontWeight: 600, marginBottom: 8 }}>
                    <span>Nivel {level.level} · {level.name}</span>
                    <span>{totalXp} / {nextLvl?.minXp || '∞'} XP</span>
                  </div>
                  <div style={{ background: '#1A1A1A', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--purple)', height: '100%', width: `${progress}%`, borderRadius: 8, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
              <Link href="/focus" className="btn btn-primary btn-lg btn-full" style={{ background: 'white', color: 'black' }}>
                📞 &nbsp;INICIAR SESIÓN DE LLAMADAS
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/leads',     icon: '📂', label: 'Subir nuevo Excel' },
                { href: '/leads',     icon: '👥', label: 'Ver lista de leads' },
                { href: '/analytics', icon: '📊', label: 'Ver analítica' },
              ].map(({ href, icon, label }) => (
                <Link key={label} href={href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: 'var(--gray)', borderRadius: 14, textDecoration: 'none', color: 'var(--black)', fontSize: 14, fontWeight: 600 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
