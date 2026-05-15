'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  // Supabase envía el token en el hash de la URL — hay que escucharlo
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // PASSWORD_RECOVERY significa que el token del email ya está activo
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('Mínimo 6 caracteres.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/'), 2500)
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
      {/* Burbujas */}
      <div style={{ position: 'absolute', bottom: -160, right: -160, width: 480, height: 480, borderRadius: '50%', background: 'var(--orange)', opacity: 0.45, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -100, left: -100, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <img src="/logo.svg" alt="CoolCalling" style={{ height: 32, filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Card */}
      <div style={{ background: 'white', borderRadius: 40, padding: '52px 52px', width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Contraseña cambiada.</div>
            <div style={{ fontSize: 15, color: 'var(--gray-mid)' }}>Redirigiendo al login...</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)', marginBottom: 6 }}>Nueva contraseña.</div>
              <div style={{ fontSize: 15, color: 'var(--gray-mid)', fontWeight: 500 }}>Escribe tu nueva contraseña.</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nueva contraseña */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>Nueva contraseña</label>
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

              {/* Confirmar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray-mid)' }}>Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  style={{ height: 52, border: '2px solid var(--gray-border)', borderRadius: 14, padding: '0 18px', fontSize: 15, fontFamily: 'HostGrotesk, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--red)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-border)'}
                />
              </div>

              {error && <div style={{ background: '#FFF0EE', color: 'var(--red)', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{
                marginTop: 8, height: 56, borderRadius: 100,
                background: loading ? 'var(--gray)' : 'var(--red)',
                color: loading ? 'var(--gray-mid)' : 'white',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800,
                transition: 'all 0.15s',
              }}>
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
