'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [remember, setRemember]     = useState(false)
  const [isLogin, setIsLogin]       = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [msg, setMsg]               = useState('')
  // Modal recuperar contraseña
  const [showReset, setShowReset]   = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // Si no quiere recordar sesión, la borramos de localStorage al cerrar la pestaña
      if (!remember) {
        window.addEventListener('beforeunload', () => {
          supabase.auth.signOut()
        }, { once: true })
      }
      window.location.href = '/dashboard'
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.session) { window.location.href = '/dashboard'; return }
      setMsg('Cuenta creada. Revisa tu email y confirma antes de entrar.')
      setIsLogin(true); setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true); setResetError('')
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) { setResetError(error.message); return }
    setResetSent(true)
  }

  const EyeIcon = () => showPass ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--red)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Burbujas decorativas */}
      <div style={{ position: 'absolute', bottom: -160, right: -160, width: 480, height: 480, borderRadius: '50%', background: 'var(--orange)', opacity: 0.45, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -100, left: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <img src="/logo.svg" alt="CoolCalling" style={{ height: 32, filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* ── MODAL recuperar contraseña ── */}
      {showReset && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowReset(false); setResetSent(false); setResetError('') } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ background: 'white', borderRadius: 32, padding: '44px 44px', width: '100%', maxWidth: 400, position: 'relative' }}>
            {/* X cerrar */}
            <button
              onClick={() => { setShowReset(false); setResetSent(false); setResetError('') }}
              style={{ position: 'absolute', top: 20, right: 20, background: 'var(--gray)', border: 'none', borderRadius: 100, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-mid)' }}
            >✕</button>

            {resetSent ? (
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>📬</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Revisa tu email.</div>
                <div style={{ fontSize: 14, color: 'var(--gray-mid)', lineHeight: 1.6 }}>Te hemos enviado un enlace para restablecer tu contraseña.</div>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false) }}
                  style={{ marginTop: 28, height: 48, width: '100%', borderRadius: 100, background: 'var(--red)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'HostGrotesk, sans-serif', fontSize: 15, fontWeight: 800 }}
                >Entendido</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>Recuperar contraseña</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-mid)' }}>Te enviamos un enlace a tu email.</div>
                </div>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>Email</label>
                    <input
                      type="email" placeholder="tu@email.com" required autoFocus
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      style={{ height: 52, border: '2px solid var(--gray-border)', borderRadius: 14, padding: '0 18px', fontSize: 15, fontFamily: 'HostGrotesk, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = 'var(--red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--gray-border)'}
                    />
                  </div>
                  {resetError && <div style={{ background: '#FFF0EE', color: 'var(--red)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{resetError}</div>}
                  <button type="submit" disabled={resetLoading} style={{ height: 52, borderRadius: 100, background: resetLoading ? 'var(--gray)' : 'var(--red)', color: resetLoading ? 'var(--gray-mid)' : 'white', border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer', fontFamily: 'HostGrotesk, sans-serif', fontSize: 15, fontWeight: 800 }}>
                    {resetLoading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card login */}
      <div style={{ background: 'white', borderRadius: 40, padding: '52px 52px', width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
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
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--gray-mid)', display: 'flex', alignItems: 'center' }}>
                <EyeIcon />
              </button>
            </div>
          </div>

          {/* Recordar + Olvidé */}
          {isLogin && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setRemember(!remember)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${remember ? 'var(--red)' : 'var(--gray-border)'}`, background: remember ? 'var(--red)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                  {remember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-mid)' }}>Recordarme</span>
              </label>
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(email) }}
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>
                ¿Olvidaste la contraseña?
              </button>
            </div>
          )}

          {error && <div style={{ background: '#FFF0EE', color: 'var(--red)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          {msg   && <div style={{ background: '#E6F9EE', color: 'var(--green)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

          <button type="submit" disabled={loading} style={{ marginTop: 8, height: 56, borderRadius: 100, background: loading ? 'var(--gray)' : 'var(--red)', color: loading ? 'var(--gray-mid)' : 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800, transition: 'all 0.15s' }}>
            {loading ? 'Un momento...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-mid)' }}>
          {isLogin ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setMsg('') }}
            style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {isLogin ? 'Regístrate' : 'Accede aquí'}
          </button>
        </div>
      </div>
    </div>
  )
}
