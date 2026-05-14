'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { getLevelFromXp, getXpProgress, getNextLevel } from '@/lib/gamification'

export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading, setLoading]         = useState(true)
  const [userEmail, setUserEmail]     = useState('')
  const [totalXp, setTotalXp]         = useState(0)
  const [streak, setStreak]           = useState(0)
  const [callsToday, setCallsToday]   = useState(0)
  const [interestedToday, setInterestedToday] = useState(0)
  const [xpToday, setXpToday]         = useState(0)
  const [pendingLeads, setPendingLeads] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      setUserEmail(user.email || '')
      const [{ data: stats }, { data: todayCalls }, { count }] = await Promise.all([
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
        supabase.from('calls').select('result, xp_earned').eq('user_id', user.id).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'),
      ])
      setTotalXp(stats?.total_xp || 0)
      setStreak(stats?.streak_days || 0)
      setCallsToday(todayCalls?.length || 0)
      setInterestedToday(todayCalls?.filter((c: any) => c.result === 'interested').length || 0)
      setXpToday(todayCalls?.reduce((s: number, c: any) => s + (c.xp_earned || 0), 0) || 0)
      setPendingLeads(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const level    = getLevelFromXp(totalXp)
  const nextLvl  = getNextLevel(totalXp)
  const progress = getXpProgress(totalXp)
  const name     = userEmail.split('@')[0]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-mid)' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: 100 }}>
      <NavBar userEmail={userEmail} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px 60px' }}>

        {/* Saludo */}
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 6 }}>Buenos días</div>
            <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--black)' }}>{name}.</div>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--black)', color: 'white', borderRadius: 100, padding: '14px 24px' }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>{streak} días</div>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Racha</div>
              </div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { icon: '📞', value: callsToday,      label: 'Llamadas hoy', bg: 'white' },
            { icon: '⭐', value: `${xpToday} XP`, label: 'XP hoy',       bg: 'var(--red)',    color: 'white' },
            { icon: '✅', value: interestedToday,  label: 'Interesados',  bg: 'var(--green)',  color: 'white' },
            { icon: '👥', value: pendingLeads,     label: 'Leads pendientes', bg: 'white' },
          ].map(({ icon, value, label, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 28, padding: '28px 24px', border: bg === 'white' ? '1px solid var(--gray-border)' : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: color || 'var(--black)', marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: color ? 'rgba(255,255,255,0.6)' : 'var(--gray-mid)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA + acciones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          {/* CTA principal */}
          <div style={{ background: 'var(--black)', borderRadius: 28, padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 240 }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24 }}>
                {pendingLeads ? `${pendingLeads} leads esperando.` : 'Sube tus leads\ny empieza.'}
              </div>
              {/* Barra nivel */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', fontWeight: 600, marginBottom: 8 }}>
                  <span>{level.name}</span>
                  <span>{totalXp} / {nextLvl?.minXp || '∞'} XP</span>
                </div>
                <div style={{ background: '#1C1C1C', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'var(--red)', height: '100%', width: `${progress}%`, borderRadius: 100, transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>
            <Link href="/focus" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'white', color: 'var(--black)', padding: '18px 36px', borderRadius: 100, fontWeight: 800, fontSize: 16, textDecoration: 'none', marginTop: 12 }}>
              📞 &nbsp;Iniciar llamadas
            </Link>
          </div>

          {/* Acciones rápidas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: '/leads',     icon: '📂', label: 'Subir nuevo Excel' },
              { href: '/leads',     icon: '👥', label: 'Ver lista de leads' },
              { href: '/analytics', icon: '📊', label: 'Ver analítica' },
            ].map(({ href, icon, label }) => (
              <Link key={label} href={href} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                padding: '20px 24px', background: 'white',
                borderRadius: 20, textDecoration: 'none',
                color: 'var(--black)', fontSize: 14, fontWeight: 600,
                border: '1px solid var(--gray-border)', transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
