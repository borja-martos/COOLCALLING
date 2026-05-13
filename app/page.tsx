'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const supabase = createClient()
  const router   = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="login-wrap">
      {/* Left — branding */}
      <div className="login-left">
        <div className="sidebar-logo" style={{ marginBottom: 48 }}>
          <div className="dot" />
          <span className="name">CoolCalling</span>
        </div>
        <div className="login-headline">Vende más.<br />Sin ruido.</div>
        <div className="login-sub">El sistema de prospección que elimina la fricción y multiplica tus llamadas.</div>

        <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
          {[['3.2×', 'Más llamadas'], ['<30s', 'Para empezar'], ['0', 'Notas manuales']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>{n}</span>
              <span style={{ fontSize: 12, color: '#444', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="login-right">
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          {isLogin ? 'Acceder' : 'Crear cuenta'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--gray-mid)', marginBottom: 36 }}>
          {isLogin ? 'Entra y empieza a llamar.' : 'Crea tu cuenta gratuita.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{ background: 'var(--red-lt)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-xl btn-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Un momento...' : isLogin ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-mid)', marginTop: 20 }}>
          {isLogin ? '¿Sin cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={() => { setIsLogin(!isLogin); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--purple)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {isLogin ? 'Regístrate gratis' : 'Accede aquí'}
          </button>
        </p>
      </div>
    </div>
  )
}
