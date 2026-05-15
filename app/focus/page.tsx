'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcXpForResult, getMotivationalMessage } from '@/lib/gamification'
import Link from 'next/link'
import Image from 'next/image'

type FocusState = 'loading' | 'pre-call' | 'calling' | 'post-call' | 'xp-reward' | 'email-generated' | 'done'

interface Lead {
  id: string; name: string; phone: string; website: string; company: string
  brief?: { insight: string; pain: string; hook: string; objection: string }
}

interface CallResult { result: string; xpEarned: number; email?: { subject: string; body: string } }

const RESULT_OPTIONS = [
  { key: 'interested',     label: 'Interesado',    emoji: '✅' },
  { key: 'followup',       label: 'Follow-up',     emoji: '📅' },
  { key: 'no_answer',      label: 'No contesta',   emoji: '📵' },
  { key: 'not_interested', label: 'No interesado', emoji: '❌' },
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
  const recogRef   = useRef<any>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const userRef    = useRef<string>('')

  const lead = leads[idx]
  const pct  = Math.round((stats.callsToday / stats.dailyGoal) * 100)
  const fmt  = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
      setStats({ xp: statsData?.total_xp || 0, streak: statsData?.streak_days || 0, callsToday: count || 0, dailyGoal: 20 })
      setState(leadsData?.length ? 'pre-call' : 'done')
    }
    init()
  }, [])

  useEffect(() => {
    if (state === 'calling') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimer(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Tu navegador no soporta dictado de voz. Usa Chrome.'); return }
    const recog = new SpeechRecognition()
    recog.continuous = true; recog.interimResults = true; recog.lang = 'es-ES'
    recog.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + ' '
      setTranscript(text.trim())
    }
    recog.start(); recogRef.current = recog; setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => { recogRef.current?.stop(); setIsRecording(false) }, [])

  async function handleResult(result: string) {
    if (!lead) return
    const xp = calcXpForResult(result)
    const { data: { session } } = await supabase.auth.getSession()
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
      setTimeout(() => setState('email-generated'), 2200)
    } else {
      setState('xp-reward')
      setTimeout(() => nextLead(), 2200)
    }
  }

  function nextLead() {
    setTranscript(''); setCallResult(null)
    const next = idx + 1
    if (next >= leads.length) { setState('done'); return }
    setIdx(next); setState('pre-call')
  }

  // ── TOP NAV (pill centrado) ────────────────────────────────────
  const TopNav = ({ light = false }: { light?: boolean }) => (
    <div style={{ position: 'fixed', top: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: light ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${light ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 100, padding: '10px 20px 10px 14px',
      }}>
        <img src="/logo.svg" alt="CoolCalling" style={{ height: 18, filter: light ? 'brightness(0) invert(1)' : 'none' }} />
        <div style={{ width: 1, height: 16, background: light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: light ? 'white' : 'var(--black)' }}>
          {stats.callsToday}/{stats.dailyGoal} hoy
        </span>
        <Link href="/dashboard" style={{
          width: 32, height: 32, borderRadius: 100,
          background: light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: 16,
        }}>✕</Link>
      </div>
    </div>
  )

  // ── DONE ──────────────────────────────────────────────────────
  if (state === 'done') return (
    <div style={{ minHeight: '100vh', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 32 }}>
      <TopNav light />
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 96, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Sin más leads</div>
        <div style={{ fontSize: 20, opacity: 0.7, marginBottom: 40 }}>{stats.callsToday} llamadas hoy. Excelente trabajo.</div>
        <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', color: 'var(--red)', padding: '18px 40px', borderRadius: 100, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>
          📂 &nbsp;Subir más leads
        </Link>
      </div>
    </div>
  )

  // ── XP REWARD ─────────────────────────────────────────────────
  if (state === 'xp-reward') return (
    <div style={{ minHeight: '100vh', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TopNav light />
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 24 }}>XP Ganados</div>
        <div style={{
          background: 'white', borderRadius: 48, padding: '40px 80px',
          fontSize: 120, fontWeight: 900, color: 'var(--red)',
          letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 32,
          display: 'inline-block',
        }}>
          +{callResult?.xpEarned}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, opacity: 0.9 }}>
          {getMotivationalMessage(stats.callsToday, stats.streak)} 🔥
        </div>
      </div>
    </div>
  )

  // ── EMAIL ─────────────────────────────────────────────────────
  if (state === 'email-generated' && callResult?.email) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <div style={{ maxWidth: 680, margin: '100px auto 0', padding: '0 32px', width: '100%' }}>
        <div style={{ fontSize: 13, color: 'var(--gray-mid)', fontWeight: 600, cursor: 'pointer', marginBottom: 24 }} onClick={nextLead}>← Volver</div>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>Email generado</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)', marginBottom: 32 }}>para {lead?.company}</div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 4 }}>Asunto</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--gray-border)' }}>{callResult.email.subject}</div>
          <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{callResult.email.body}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-lg" onClick={() => navigator.clipboard.writeText(`${callResult.email!.subject}\n\n${callResult.email!.body}`)}>📋 Copiar</button>
          <button className="btn btn-primary btn-lg" style={{ marginLeft: 'auto' }} onClick={nextLead}>Siguiente →</button>
        </div>
      </div>
    </div>
  )

  if (!lead) return null

  // ── PRE-CALL / CALLING / POST-CALL ────────────────────────────
  const bgColor = state === 'calling' ? 'var(--red)' : state === 'post-call' ? '#1A1A1A' : 'var(--red)'
  const isLight = true

  return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <TopNav light={isLight} />

      {/* XP float */}
      {showXpFloat && callResult && (
        <div className="xp-float" style={{ color: 'white' }}>+{callResult.xpEarned} XP ⭐</div>
      )}

      {/* Label izquierda */}
      <div style={{ position: 'absolute', left: 48, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>
          {state === 'calling' ? 'En llamada' : state === 'post-call' ? '¿Cómo fue?' : 'Próxima llamada'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.6 }}>
          {idx + 1} · {leads.length}
        </div>
        {state === 'calling' && (
          <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            {fmt(timer)}
          </div>
        )}
      </div>

      {/* Brief derecha — solo en pre-call */}
      {(state === 'pre-call') && lead.brief && (
        <div style={{ position: 'absolute', right: 48, top: '50%', transform: 'translateY(-50%)', maxWidth: 260, color: 'rgba(255,255,255,0.85)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 16 }}>Brief IA</div>
          {[
            { label: 'Dolor', text: lead.brief.pain },
            { label: 'Apertura', text: lead.brief.hook },
          ].map(({ label, text }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CENTRO ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, zIndex: 1 }}>

        {/* PRE-CALL */}
        {state === 'pre-call' && (
          <>
            <div style={{
              background: 'white', borderRadius: 56,
              padding: '56px 80px', textAlign: 'center',
              minWidth: 400, maxWidth: 560,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 12 }}>
                {lead.website || 'Sin web'}
              </div>
              <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--black)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 16 }}>
                {lead.company || lead.name}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-mid)', letterSpacing: '0.04em' }}>
                {lead.phone}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', color: 'var(--red)', padding: '20px 52px', borderRadius: 100, fontWeight: 800, fontSize: 18, border: 'none', cursor: 'pointer' }}
                onClick={() => { setState('calling'); setTranscript('') }}>
                📞 &nbsp;Llamar
              </button>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', color: 'white', padding: '20px 32px', borderRadius: 100, fontWeight: 700, fontSize: 16, border: '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                onClick={nextLead}>
                ⏭ Saltar
              </button>
            </div>
          </>
        )}

        {/* CALLING */}
        {state === 'calling' && (
          <>
            <div style={{
              background: 'white', borderRadius: 56,
              padding: '48px 80px', textAlign: 'center',
              minWidth: 440, maxWidth: 580,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <div className="call-dot" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>En llamada</span>
              </div>
              <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--black)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 24 }}>
                {lead.company || lead.name}
              </div>
              <div style={{ background: 'var(--gray)', borderRadius: 20, padding: '20px 24px', minHeight: 80, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 8 }}>Nota de voz</div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: transcript ? 'var(--black)' : 'var(--gray-mid)', fontStyle: transcript ? 'normal' : 'italic' }}>
                  {transcript || 'Pulsa Dictar para grabar...'}
                  {isRecording && <span className="transcript-cursor" />}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-mid)', lineHeight: 1.6, marginTop: 8, textAlign: 'left' }}>
                🎙️ El dictado requiere permisos de micrófono activados en tu navegador. En Mac, también puedes pulsar <strong>Fn dos veces</strong> para activar el dictado del sistema.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: isRecording ? 'white' : 'rgba(255,255,255,0.15)', color: isRecording ? 'var(--red)' : 'white', padding: '18px 36px', borderRadius: 100, fontWeight: 700, fontSize: 15, border: isRecording ? 'none' : '1.5px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
                onClick={isRecording ? stopRecording : startRecording}>
                🎙️ &nbsp;{isRecording ? 'Parar' : 'Dictar'}
              </button>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', color: 'var(--red)', padding: '18px 44px', borderRadius: 100, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer' }}
                onClick={() => { stopRecording(); setState('post-call') }}>
                ✅ &nbsp;Finalizar
              </button>
            </div>
          </>
        )}

        {/* POST-CALL */}
        {state === 'post-call' && (
          <>
            <div style={{ textAlign: 'center', color: 'white', marginBottom: 8 }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>¿Cómo fue?</div>
              <div style={{ fontSize: 20, opacity: 0.7 }}>{lead.company || lead.name}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: 560 }}>
              {RESULT_OPTIONS.map(({ key, label, emoji }) => (
                <button key={key}
                  style={{
                    height: 88, borderRadius: 100, display: 'flex', alignItems: 'center',
                    gap: 14, padding: '0 32px', cursor: 'pointer', border: 'none',
                    fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800,
                    background: key === 'interested' ? 'var(--green)' : key === 'followup' ? 'var(--orange)' : key === 'no_answer' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
                    color: 'white', backdropFilter: 'blur(8px)',
                    transition: 'transform 0.1s',
                  }}
                  onClick={() => handleResult(key)}>
                  <span style={{ fontSize: 24 }}>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Flecha abajo (decorativa) */}
      {state === 'pre-call' && (
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>↓</div>
        </div>
      )}
    </div>
  )
}
