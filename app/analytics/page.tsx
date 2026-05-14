'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { getLevelFromXp } from '@/lib/gamification'

export default function AnalyticsPage() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading]   = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [totalXp, setTotalXp]   = useState(0)
  const [streak, setStreak]     = useState(0)
  const [total, setTotal]       = useState(0)
  const [interested, setInterested] = useState(0)
  const [followup, setFollowup] = useState(0)
  const [contactRate, setContactRate] = useState(0)
  const [interestRate, setInterestRate] = useState(0)
  const [dayCounts, setDayCounts] = useState<number[]>(Array(7).fill(0))

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      setUserEmail(user.email || '')
      const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single()
      setTotalXp(stats?.total_xp || 0)
      setStreak(stats?.streak_days || 0)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: calls } = await supabase.from('calls').select('result, created_at').eq('user_id', user.id).gte('created_at', sevenDaysAgo)
      const t = calls?.length || 0
      const int = calls?.filter((c: any) => c.result === 'interested').length || 0
      const fol = calls?.filter((c: any) => c.result === 'followup').length || 0
      const noAns = calls?.filter((c: any) => c.result === 'no_answer').length || 0
      setTotal(t); setInterested(int); setFollowup(fol)
      setContactRate(t ? Math.round(((t - noAns) / t) * 100) : 0)
      setInterestRate(t ? Math.round((int / t) * 100) : 0)
      const now = new Date()
      setDayCounts(Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i))
        const dateStr = d.toISOString().split('T')[0]
        return calls?.filter((c: any) => c.created_at.startsWith(dateStr)).length || 0
      }))
      setLoading(false)
    }
    load()
  }, [])

  const level   = getLevelFromXp(totalXp)
  const maxCount = Math.max(...dayCounts, 1)
  const days    = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const now     = new Date()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-mid)' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: 100 }}>
      <NavBar userEmail={userEmail} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 60px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 8 }}>Últimos 7 días</div>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>Tu analítica.</div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { icon: '📞', value: total,           label: 'Llamadas',    bg: 'white' },
            { icon: '📶', value: `${contactRate}%`, label: '% Contacto', bg: 'var(--red)',   color: 'white' },
            { icon: '✅', value: `${interestRate}%`, label: '% Interés', bg: 'var(--green)', color: 'white' },
            { icon: '📅', value: followup,         label: 'Follow-ups',  bg: 'white' },
          ].map(({ icon, value, label, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 28, padding: '28px 24px', border: bg === 'white' ? '1px solid var(--gray-border)' : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: color || 'var(--black)', marginBottom: 6 }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: color ? 'rgba(255,255,255,0.6)' : 'var(--gray-mid)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Gráfica */}
        <div style={{ background: 'white', borderRadius: 28, padding: '36px 40px', marginBottom: 14, border: '1px solid var(--gray-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.01em' }}>Llamadas por día</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
            {dayCounts.map((count, i) => {
              const isMax = count === Math.max(...dayCounts) && count > 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', background: isMax ? 'var(--red)' : 'var(--gray)', borderRadius: '8px 8px 0 0', height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 8 : 0, transition: 'height 0.3s' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase' }}>
                    {days[(now.getDay() + i - 6 + 14) % 7]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats abajo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'var(--black)', borderRadius: 28, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>🔥</span>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'white' }}>{streak} días</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Racha actual</div>
            </div>
          </div>
          <div style={{ background: 'var(--red)', borderRadius: 28, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>⭐</span>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'white' }}>{totalXp}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{level.name} · XP total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
