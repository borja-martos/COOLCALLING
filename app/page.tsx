'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [remember, setRemember]   = useState(false)
  const [isLogin, setIsLogin]     = useState(true)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [msg, setMsg]             = useState('')
  const [resetSent, setResetSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      window.location.href = '/dashboard'
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.session) { window.location.href = '/dashboard'; return }
      setMsg('Cuenta creada. Revisa tu email y confirma antes de entrar.')
      setIsLogin(true); setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Escribe tu email primero.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--red)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Burbujas decorativas */}
      <div style={{
        position: 'absolute', bottom: -160, right: -160,
        width: 480, height: 480, borderRadius: '50%',
        background: 'var(--orange)', opacity: 0.45,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -100, left: -100,
        width: 320, height: 320, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />

      {/* Logo arriba centrado */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <img src="/logo.svg" alt="CoolCalling" style={{ height: 32, filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Card central */}
      <div style={{
        background: 'white', borderRadius: 40,
        padding: '52px 52px', width: '100%', maxWidth: 440,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)', marginBottom: 6 }}>
            {isLogin ? 'Bienvenido.' : 'Empieza gratis.'}
          </div>
          <div style={{ fontSize: 15, color: 'var(--gray-mid)', fontWeight: 500 }}>
            {isLogin ? 'Entra y empieza a llamar.' : 'Crea tu cuenta en 30 segundos.'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>Email</label>
            <input
              type="email" placeholder="tu@email.com" required
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ height: 52, border: '2px solid var(--gray-border)', borderRadius: 14, padding: '0 18px', fontSize: 15, fontFamily: 'HostGrotesk, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--red)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-border)'}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ height: 52, border: '2px solid var(--gray-border)', borderRadius: 14, padding: '0 52px 0 18px', fontSize: 15, fontFamily: 'HostGrotesk, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gray-mid)', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center' }}
              >
                {showPass ? (
                  // ojo tachado
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // ojo normal
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Recordar + Olvidé contraseña */}
          {isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setRemember(!remember)}
                  style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${remember ? 'var(--red)' : 'var(--gray-border)'}`,
                    background: remember ? 'var(--red)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-mid)' }}>Recordarme</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}
              >
                ¿Olvidaste la contraseña?
              </button>
            </div>
          )}

          {resetSent && <div style={{ background: '#E6F9EE', color: 'var(--green)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>Te hemos enviado un email para restablecer tu contraseña.</div>}
          {error && <div style={{ background: '#FFF0EE', color: 'var(--red)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          {msg   && <div style={{ background: '#E6F9EE', color: 'var(--green)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

          <button type="submit" disabled={loading} style={{
            marginTop: 8, height: 56, borderRadius: 100,
            background: loading ? 'var(--gray)' : 'var(--red)',
            color: loading ? 'var(--gray-mid)' : 'white',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800,
            transition: 'all 0.15s',
          }}>
            {loading ? 'Un momento...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-mid)' }}>
          {isLogin ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setMsg(''); setResetSent(false) }}
            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {isLogin ? 'Regístrate' : 'Accede aquí'}
          </button>
        </div>
      </div>
    </div>
  )
}
