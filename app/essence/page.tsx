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
  const [draft, setDraft]         = useState('')
  const [editing, setEditing]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
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
      const saved = data?.essence || ''
      setEssence(saved)
      setDraft(saved)
      setEditing(!saved) // si no hay esencia, abrir directamente en modo edición
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('company_profile').upsert({
      user_id: user.id,
      essence: draft,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setEssence(draft)
    setSaving(false)
    setEditing(false)
  }

  function handleEdit() {
    setDraft(essence)
    setEditing(true)
  }

  function handleCancel() {
    setDraft(essence)
    setEditing(false)
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
            Cuéntame quién eres y qué haces. Con esto, los emails de seguimiento serán mucho más tuyos.
          </div>
        </div>

        {/* ── MODO GUARDADO ── */}
        {!editing && essence && (
          <div style={{ marginBottom: 20 }}>
            {/* Card esencia guardada */}
            <div style={{
              background: 'var(--black)', borderRadius: 28, padding: '32px 36px',
              marginBottom: 14, position: 'relative',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 16 }}>
                ✅ Esencia guardada
              </div>
              <div style={{
                fontSize: 15, lineHeight: 1.8, color: '#ccc',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 240, overflow: 'hidden',
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
              }}>
                {essence}
              </div>
            </div>

            {/* Botón modificar */}
            <button
              onClick={handleEdit}
              style={{
                width: '100%', height: 56, borderRadius: 100,
                background: 'white', color: 'var(--black)',
                border: '1.5px solid var(--gray-border)',
                cursor: 'pointer', fontFamily: 'HostGrotesk, sans-serif',
                fontSize: 15, fontWeight: 700, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              ✏️ &nbsp;Modificar esencia
            </button>
          </div>
        )}

        {/* ── MODO EDICIÓN ── */}
        {editing && (
          <>
            <div style={{ background: 'white', borderRadius: 28, border: '1px solid var(--gray-border)', overflow: 'hidden', marginBottom: 14 }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
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

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                onClick={handleSave}
                disabled={saving || !draft.trim()}
                style={{
                  flex: 1, height: 56, borderRadius: 100,
                  background: saving || !draft.trim() ? 'var(--gray)' : 'var(--red)',
                  color: saving || !draft.trim() ? 'var(--gray-mid)' : 'white',
                  border: 'none', cursor: saving || !draft.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'HostGrotesk, sans-serif', fontSize: 16, fontWeight: 800,
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar esencia'}
              </button>

              {essence && (
                <button
                  onClick={handleCancel}
                  style={{
                    height: 56, padding: '0 28px', borderRadius: 100,
                    background: 'white', color: 'var(--gray-mid)',
                    border: '1.5px solid var(--gray-border)',
                    cursor: 'pointer', fontFamily: 'HostGrotesk, sans-serif',
                    fontSize: 15, fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}

        {/* Tips — siempre visibles */}
        <div style={{ background: 'var(--black)', borderRadius: 20, padding: '20px 24px' }}>
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

      </div>
    </div>
  )
}
