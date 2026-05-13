import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getLevelFromXp } from '@/lib/gamification'

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single()
  const totalXp = stats?.total_xp || 0
  const streak  = stats?.streak_days || 0
  const level   = getLevelFromXp(totalXp)

  // Last 7 days calls
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: calls } = await supabase
    .from('calls').select('result, created_at').eq('user_id', user.id).gte('created_at', sevenDaysAgo)

  const total     = calls?.length || 0
  const interested  = calls?.filter(c => c.result === 'interested').length || 0
  const followup    = calls?.filter(c => c.result === 'followup').length || 0
  const contactRate = total ? Math.round(((total - (calls?.filter(c => c.result === 'no_answer').length || 0)) / total) * 100) : 0
  const interestRate = total ? Math.round((interested / total) * 100) : 0

  // Per-day counts
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const now  = new Date()
  const dayCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return calls?.filter(c => c.created_at.startsWith(dateStr)).length || 0
  })
  const maxCount = Math.max(...dayCounts, 1)

  return (
    <div className="layout">
      <Sidebar userEmail={user.email} totalXp={totalXp} streak={streak} />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">Analítica</span>
          <div className="topbar-right">
            <div style={{ display: 'flex', background: 'var(--gray)', borderRadius: 10, padding: 4, gap: 2 }}>
              {['Hoy', 'Semana', 'Mes'].map((p, i) => (
                <div key={p} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: i === 1 ? 'white' : 'transparent', color: i === 1 ? 'var(--black)' : 'var(--gray-mid)', cursor: 'pointer' }}>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="page-content">
          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card card">
              <span style={{ fontSize: 22 }}>📞</span>
              <span className="kpi-number">{total}</span>
              <span className="kpi-label">Llamadas</span>
            </div>
            <div className="kpi-card card card-purple">
              <span style={{ fontSize: 22 }}>📶</span>
              <span className="kpi-number" style={{ color: 'var(--purple)' }}>{contactRate}%</span>
              <span className="kpi-label">% Contacto</span>
            </div>
            <div className="kpi-card" style={{ background: 'var(--green-lt)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <span className="kpi-number" style={{ color: 'var(--green)' }}>{interestRate}%</span>
              <span className="kpi-label">% Interés</span>
            </div>
            <div className="kpi-card card">
              <span style={{ fontSize: 22 }}>📅</span>
              <span className="kpi-number">{followup}</span>
              <span className="kpi-label">Follow-ups</span>
            </div>
          </div>

          {/* Chart */}
          <div className="card" style={{ padding: 32, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em' }}>
              Llamadas por día — últimos 7 días
            </div>
            <div className="bar-chart">
              {dayCounts.map((count, i) => (
                <div key={i} className="bar-group">
                  <div className={`bar ${i === dayCounts.indexOf(Math.max(...dayCounts)) ? 'purple' : ''}`}
                    style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 8 : 0 }} />
                  <span className="bar-label">{days[(now.getDay() + i - 6 + 14) % 7]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>🔥</span>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em' }}>{streak} días</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Racha actual</div>
              </div>
            </div>
            <div className="card card-purple" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>⭐</span>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--purple)' }}>{totalXp}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {level.name} · XP total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
