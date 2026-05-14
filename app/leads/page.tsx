'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const CHISTES = [
  { emoji: '☕', texto: 'Un SDR entra a una cafetería. El café le dice "no, gracias". El SDR anota: "follow-up en 3 días".' },
  { emoji: '🎯', texto: '¿Cuál es el CRM favorito de los malos vendedores? La memoria.' },
  { emoji: '🧠', texto: 'El 80% de las ventas se cierran después del 5º seguimiento. El 80% de los vendedores se rinden en el 1º.' },
  { emoji: '🤝', texto: '— ¿Cerró la venta? — No, pero quedamos en hablar "en algún momento". — Eso es un no. — Es un maybe.' },
  { emoji: '🦷', texto: '¿Qué le dice un diente a otro diente? Me alegra que estés a mi lado.' },
  { emoji: '📊', texto: 'Mi pipeline tiene más fantasmas que un cementerio en Halloween.' },
  { emoji: '💪', texto: 'Las llamadas en frío son como el gym: el primer día duele, el décimo ya no sientes nada.' },
  { emoji: '🐌', texto: 'IKEA debería hacer un mapa de su tienda. Aunque tampoco lo entendería nadie.' },
]

export default function LeadsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState({ current: 0, total: 0, name: '' })
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      setUserEmail(user.email || '')
    })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) { setError('El archivo debe ser .xlsx, .xls o .csv'); return }
    setUploading(true); setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir')
      const leads = json.leads as { id: string; company: string }[]
      setProgress({ current: 0, total: leads.length, name: '' })
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]
        setProgress({ current: i + 1, total: leads.length, name: lead.company })
        await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ leadId: lead.id }),
        })
      }
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }, [supabase])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: 100 }}>
      <NavBar userEmail={userEmail} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 60px', display: 'flex', gap: 48, alignItems: 'flex-start' }}>

        {/* Columna principal */}
        <div style={{ flex: '0 0 520px' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 8 }}>Leads</div>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>Sube tu lista.</div>
            <div style={{ fontSize: 16, color: 'var(--gray-mid)' }}>Excel con columnas: nombre · teléfono · web</div>
          </div>

          {!uploading && !done && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--red)' : 'var(--gray-border)'}`,
                  background: dragging ? 'var(--red-lt)' : 'white',
                  borderRadius: 28, padding: '52px 40px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <input id="file-input" type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                <div style={{ fontSize: 48, marginBottom: 14 }}>📂</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Arrastra tu Excel aquí</div>
                <div style={{ fontSize: 14, color: 'var(--gray-mid)', marginBottom: 24 }}>o haz clic para buscar</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['nombre', 'teléfono', 'web'].map(col => (
                    <span key={col} style={{ background: 'var(--gray)', padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>· {col}</span>
                  ))}
                </div>
              </div>

              {error && <div style={{ marginTop: 16, background: 'var(--red-lt)', color: 'var(--red)', padding: '14px 18px', borderRadius: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['✓', 'Análisis automático de cada web'],
                  ['✓', 'Brief IA listo antes de llamar'],
                  ['✓', '0 configuración extra'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 100, background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{icon}</div>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {uploading && (
            <div style={{ background: 'white', borderRadius: 28, padding: 40, textAlign: 'center', border: '1px solid var(--gray-border)' }}>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Analizando {progress.total} empresas</div>
              {progress.name && <div style={{ color: 'var(--gray-mid)', fontSize: 15, marginBottom: 24 }}>{progress.name} · preparando brief IA...</div>}
              <div style={{ background: 'var(--gray)', borderRadius: 100, height: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: 'var(--red)', height: '100%', width: `${pct}%`, borderRadius: 100, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-mid)', fontWeight: 600 }}>{progress.current} / {progress.total}</div>
            </div>
          )}

          {done && (
            <div style={{ background: 'var(--red)', borderRadius: 28, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 8 }}>{progress.total} leads listos</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>Brief IA preparado para cada empresa.</div>
              <button onClick={() => router.push('/focus')} style={{ background: 'white', color: 'var(--red)', padding: '18px 44px', borderRadius: 100, fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer' }}>
                📞 &nbsp;Empezar a llamar
              </button>
            </div>
          )}
        </div>

        {/* Chistes */}
        <div style={{ flex: 1, paddingTop: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 16 }}>Mientras esperas 😄</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHISTES.map((c, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 18, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', border: '1px solid var(--gray-border)' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--black)' }}>{c.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
