'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import { calcXpForResult, getMotivationalMessage } from '@/lib/gamification'
import Link from 'next/link'

type FocusState = 'loading' | 'pre-call' | 'calling' | 'post-call' | 'xp-reward' | 'email-generated' | 'done'

interface Lead {
  id: string; name: string; phone: string; website: string; company: string
  brief?: { insight: string; pain: string; hook: string; objection: string }
}

interface CallResult { result: string; xpEarned: number; email?: { subject: string; body: string } }

const RESULT_OPTIONS = [
  { key: 'interested',     label: 'INTERESADO',    emoji: '✅' },
  { key: 'followup',       label: 'FOLLOW-UP',     emoji: '📅' },
  { key: 'no_answer',      label: 'NO CONTESTA',   emoji: '📵' },
  { key: 'not_interested', label: 'NO INTERESADO', emoji: '❌' },
]

export default function FocusPage() {
  const [state, setState]           = useState<FocusState>('loading')
  const [leads, setLeads]           = useState<Lead[]>([])
  const [idx, setIdx]               = useState(0)
  const [stats, setStats]           = useState({ xp: 0, streak: 0, callsToday: 0, dailyGoal: 20 })
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer]           = useState(0)
  const [callResult, setCallResult] = useState<CallResult | null>(null)
  const [showXpFloat, setShowXpFloat] = useState(false)

  const supabase   = createClient()
  const recogRef   = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const userRef    = useRef<string>('')

  const lead = leads[idx]

  // ── INIT ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userRef.current = user.id

      const [{ data: leadsData }, { data: statsData }] = await Promise.all([
        supabase.from('leads').select('*').eq('user_id', user.id).eq('status', 'pending').order('position'),
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      ])

      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('calls').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', today)

      setLeads(leadsData || [])
      setStats({
        xp: statsData?.total_xp || 0,
        streak: statsData?.streak_days || 0,
        callsToday: count || 0,
        dailyGoal: 20,
      })
      setState(leadsData?.length ? 'pre-call' : 'done')
    }
    init()
  }, [])

  // ── TIMER ──────────────────────────────────────────────────────
  useEffect(() => {
    if (state === 'calling') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimer(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  // ── VOICE DICTATION ───────────────────────────────────────────
  const startRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Tu navegador no soporta dictado de voz. Usa Chrome.'); return }

    const recog = new SpeechRecognition()
    recog.continuous = true
    recog.interimResults = true
    recog.lang = 'es-ES'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript + ' '
      }
      setTranscript(text.trim())
    }
    recog.start()
    recogRef.current = recog
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    recogRef.current?.stop()
    setIsRecording(false)
  }, [])

  // ── POST-CALL ─────────────────────────────────────────────────
  async function handleResult(result: string) {
    if (!lead) return
    const xp = calcXpForResult(result)

    const { data: { session } } = await supabase.auth.getSession()

    // Save call
    const res = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ leadId: lead.id, result, voiceNotes: transcript, duration: timer, xpEarned: xp }),
    })
    const json = await res.json()

    setCallResult({ result, xpEarned: xp, email: json.email })
    setStats(s => ({ ...s, xp: s.xp + xp, callsToday: s.callsToday + 1 }))
    setShowXpFloat(true)
    setTimeout(() => setShowXpFloat(false), 1500)

    if (result === 'interested' || result === 'followup') {
      setState('xp-reward')
      setTimeout(() => setState('email-generated'), 2000)
    } else {
      setState('xp-reward')
      setTimeout(() => nextLead(), 2000)
    }
  }

  function nextLead() {
    setTranscript('')
    setCallResult(null)
    const next = idx + 1
    if (next >= leads.length) { setState('done'); return }
    setIdx(next)
    setState('pre-call')
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const pct = Math.round((stats.callsToday / stats.dailyGoal) * 100)

  // ── RENDER: DONE ──────────────────────────────────────────────
  if (state === 'done') return (
    <div className="layout">
      <Sidebar userEmail="" totalXp={stats.xp} streak={stats.streak} />
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Sin más leads</div>
          <div style={{ fontSize: 18, color: 'var(--gray-mid)', marginBottom: 32 }}>
            {stats.callsToday} llamadas hoy. Excelente trabajo.
          </div>
          <Link href="/leads" className="btn btn-primary btn-xl">📂 &nbsp;SUBIR MÁS LEADS</Link>
        </div>
      </div>
    </div>
  )

  // ── RENDER: XP REWARD ─────────────────────────────────────────
  if (state === 'xp-reward') return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userEmail="" totalXp={stats.xp} streak={stats.streak} />
      <div className="xp-screen" style={{ flex: 1 }}>
        <div>
          <div style={{ fontSize: 80, marginBottom: 16 }}>⭐</div>
          <div className="xp-amount">+{callResult?.xpEarned}</div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#333', marginBottom: 40 }}>XP GANADOS</div>
          <div className="xp-message">{getMotivationalMessage(stats.callsToday, stats.streak)} 🔥</div>
        </div>
        <div style={{ minWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#111', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, color: '#555', fontWeight: 600 }}>
              <span>XP total</span><span>{stats.xp} XP</span>
            </div>
            <div style={{ background: '#1A1A1A', borderRadius: 8, height: 12, overflow: 'hidden' }}>
              <div style={{ background: 'var(--purple)', height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 8 }} />
            </div>
          </div>
          <div style={{ background: '#111', borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#333', marginBottom: 8 }}>Llamadas hoy</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.callsToday}</div>
            <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Objetivo: {stats.dailyGoal}</div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── RENDER: EMAIL ─────────────────────────────────────────────
  if (state === 'email-generated' && callResult?.email) return (
    <div className="layout">
      <Sidebar userEmail="" totalXp={stats.xp} streak={stats.streak} />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">Email generado</span>
        </div>
        <div className="page-content" style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: 4, fontSize: 13, color: 'var(--gray-mid)', fontWeight: 600, cursor: 'pointer' }}
            onClick={nextLead}>← Volver al foco</div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>Email generado</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple)', marginBottom: 24 }}>para {lead?.company}</div>

          <div className="card" style={{ padding: 32, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 4 }}>Asunto</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--gray-border)' }}>
              {callResult.email.subject}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{callResult.email.body}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary btn-lg"
              onClick={() => navigator.clipboard.writeText(`${callResult.email!.subject}\n\n${callResult.email!.body}`)}>
              📋 Copiar
            </button>
            <button className="btn btn-primary btn-lg" style={{ marginLeft: 'auto' }} onClick={nextLead}>
              SIGUIENTE LLAMADA →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (!lead) return null

  // ── RENDER: PRE-CALL & CALLING & POST-CALL ────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userEmail="" totalXp={stats.xp} streak={stats.streak} />

      {/* XP float animation */}
      {showXpFloat && callResult && (
        <div className="xp-float">+{callResult.xpEarned} XP ⭐</div>
      )}

      <div className="focus-wrap">
        {/* Top bar */}
        <div className="focus-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800 }}>
            🔥 {stats.streak}
          </div>
          <div style={{ flex: 1, maxWidth: 200, background: 'var(--gray-border)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ background: 'var(--black)', height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{stats.callsToday}/{stats.dailyGoal}</div>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--gray-mid)', fontWeight: 600, textDecoration: 'none', marginLeft: 12 }}>
            salir
          </Link>
        </div>

        {/* Main */}
        <div className="focus-main" style={{ paddingTop: 80 }}>

          {/* PRE-CALL */}
          {state === 'pre-call' && (
            <>
              <div className="company-name">{lead.company || lead.name}</div>
              <div className="company-sub">{lead.website || 'Sin web'}</div>
              <div className="phone-number">{lead.phone}</div>
              <div className="focus-actions">
                <button className="btn btn-primary btn-xxl" onClick={() => { setState('calling'); setTranscript('') }}>
                  📞 &nbsp;LLAMAR
                </button>
                <button className="btn btn-secondary btn-xl" onClick={nextLead}>⏭ Saltar</button>
              </div>
            </>
          )}

          {/* CALLING */}
          {state === 'calling' && (
            <div style={{ width: '100%', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div className="call-dot" />
                <span style={{ fontSize: 20, fontWeight: 700 }}>{fmt(timer)}</span>
                <span style={{ fontSize: 16, color: 'var(--gray-mid)' }}>· En llamada</span>
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 24 }}>
                {lead.company || lead.name}
              </div>
              <div className="transcript-box" style={{ marginBottom: 24, minHeight: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 10 }}>
                  Transcripción en vivo
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {transcript || <span style={{ color: 'var(--gray-mid)' }}>Pulsa DICTAR para empezar a grabar notas...</span>}
                  {isRecording && <span className="transcript-cursor" />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className={`btn btn-xl ${isRecording ? 'btn-green' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={isRecording ? stopRecording : startRecording}>
                  🎙️ &nbsp;{isRecording ? 'DICTANDO... PARAR' : 'DICTAR NOTA'}
                </button>
                <button className="btn btn-primary btn-xl" onClick={() => { stopRecording(); setState('post-call') }}>
                  ✅ &nbsp;FINALIZAR
                </button>
              </div>
            </div>
          )}

          {/* POST-CALL */}
          {state === 'post-call' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
                ¿Cómo fue la llamada?
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple)', marginBottom: 40 }}>
                {lead.company || lead.name}
              </div>
              <div className="result-grid">
                {RESULT_OPTIONS.map(({ key, label, emoji }) => (
                  <button key={key} className={`result-card ${key}`} onClick={() => handleResult(key)}>
                    <span className="emoji">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brief panel (right) */}
        <div className="focus-right">
          <div className="brief-title">📋 Brief IA · {lead.company || lead.name}</div>
          <div style={{ height: 1, background: 'var(--gray-border)', margin: '0 0 20px' }} />

          {lead.brief ? (
            <>
              {[
                { icon: '💡', label: 'Insight',    text: lead.brief.insight },
                { icon: '🎯', label: 'Dolor',      text: lead.brief.pain },
                { icon: '🗣️', label: 'Apertura',  text: lead.brief.hook },
                { icon: '⚠️', label: 'Objeción',  text: lead.brief.objection },
              ].map(({ icon, label, text }) => (
                <div className="brief-item" key={label}>
                  <span className="icon">{icon}</span>
                  <div className="content">
                    <strong>{label}</strong>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[80, 60, 100, 70].map((w, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div className="brief-skeleton" style={{ height: 10, width: 60, marginBottom: 8 }} />
                  <div className="brief-skeleton" style={{ height: 14, width: `${w}%` }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
