'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const PLACEHOLDERS = [
  'nombre de la empresa',
  'qué hacéis exactamente',
  'a quién ayudáis (sector, tamaño de empresa, perfil del cliente)',
  'qué problema resolvéis',
  'qué os diferencia de la competencia',
  'tono que queréis usar (cercano, formal, directo...)',
  'algún caso de éxito o dato que impacte',
]

export default function EssencePage() {
  const [userEmail, setUserEmail] = useState('')
  const [essence, setEssence]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      setUserEmail(user.email || '')
      const { data } = await supabase
        .from('company_profile')
        .select('essence')
        .eq('user_id', user.id)
        .single()
      if (data?.essence) setEssence(data.essence)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true); setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('company_profile').upsert({
      user_id: user.id,
      essence,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-mid)' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: 100 }}>
      <NavBar userEmail={userEmail} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 32px 60px' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 8 }}>Tu empresa</div>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12 }}>Esencia.</div>
          <div style={{ fontSize: 16, color: 'var(--gray-mid)', lineHeight: 1.6 }}>
            Cuéntame quién eres y qué haces. Con esto, los emails de seguimiento que te sugiera serán mucho más tuyos.
          </div>
        </div>

        {/* Textarea principal */}
        <div style={{ background: 'white', borderRadius: 28, border: '1px solid var(--gray-border)', overflow: 'hidden', marginBottom: 16 }}>
          <textarea
            value={essence}
            onChange={e => setEssence(e.target.value)}
            placeholder={`Cuéntame sobre tu empresa. Por ejemplo:\n\n• ${PLACEHOLDERS.join('\n• ')}`}
            style={{
              width: '100%', minHeight: 320, padding: '28px 32px',
              fontSize: 15, fontFamily: 'HostGrotesk, sans-serif',
              lineHeight: 1.7, border: 'none', outline: 'none',
              resize: 'vertical', background: 'transparent',
              color: 'var(--black)', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tips */}
        <div style={{ background: 'var(--black)', borderRadius: 20, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>💡 Qué incluir para mejores emails</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLACEHOLDERS.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving || !essence.trim()}
          style={{
            width: '100%', height: 56, borderRadius: 100,
            background: saved ? 'var(--green)' : saving || !essence.trim() ? 'var(--gray)' : 'var(--red)',
            color: saving || !essence.trim() ? 'var(--gray-mid)' : 'white',
            border: 'none', cursor: saving || !essence.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800,
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✅ Guardado' : saving ? 'Guardando...' : 'Guardar esencia'}
        </button>
      </div>
    </div>
  )
}
