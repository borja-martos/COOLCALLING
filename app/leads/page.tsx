'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'

export default function LeadsPage() {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState({ current: 0, total: 0, name: '' })
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')
  const router  = useRouter()
  const supabase = createClient()

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('El archivo debe ser .xlsx, .xls o .csv')
      return
    }
    setUploading(true)
    setError('')

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

      // Now generate briefs in background
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }, [supabase])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const chistes = [
    { emoji: '📞', texto: '¿Por qué los vendedores nunca se pierden? Porque siempre tienen un buen "pitch".' },
    { emoji: '😅', texto: 'Cliente: "No me interesa." Vendedor: "¿Y si le digo que es gratis?" Cliente: "¿Cuántos quiere?"' },
    { emoji: '🧠', texto: 'El 80% de las ventas se cierran después del 5º seguimiento. El 80% de los vendedores se rinden en el 1º.' },
    { emoji: '☕', texto: 'Un SDR entra a una cafetería. El café le dice "no, gracias". El SDR anota: "follow-up en 3 días".' },
    { emoji: '🎯', texto: '¿Cuál es el CRM favorito de los malos vendedores? La memoria.' },
    { emoji: '📊', texto: 'Mi pipeline tiene más fantasmas que un cementerio en Halloween.' },
    { emoji: '🤝', texto: '— ¿Cerró la venta? — No, pero quedamos en hablar "en algún momento". — Eso es un no. — Es un maybe.' },
    { emoji: '💪', texto: 'Las llamadas en frío son como el gym: el primer día duele, el décimo ya no sientes nada.' },
  ]

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">Leads</span>
        </div>
        <div style={{ display: 'flex', gap: 40, padding: '32px 40px', alignItems: 'flex-start' }}>
        <div className="page-content" style={{ maxWidth: 680, padding: 0, flex: '0 0 680px' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Sube tus leads</h2>
            <p style={{ fontSize: 16, color: 'var(--gray-mid)' }}>
              Formato Excel (.xlsx) con columnas: <strong>nombre</strong>, <strong>teléfono</strong>, <strong>web</strong>
            </p>
          </div>

          {!uploading && !done && (
            <div
              className={`drop-zone ${dragging ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input id="file-input" type="file" accept=".xlsx,.xls,.csv" hidden onChange={onInputChange} />
              <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Arrastra tu Excel aquí</div>
              <div style={{ fontSize: 14, color: 'var(--gray-mid)', marginBottom: 24 }}>o haz clic para buscar</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['nombre', 'teléfono', 'web'].map(col => (
                  <span key={col} style={{ background: 'var(--gray)', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                    · {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Analizando {progress.total} empresas...
              </div>
              <div style={{ color: 'var(--gray-mid)', fontSize: 15, marginBottom: 24 }}>
                {progress.name && `${progress.name} · preparando brief IA...`}
              </div>
              <div className="progress-wrap" style={{ marginBottom: 12 }}>
                <div className="progress-fill purple"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--gray-mid)', fontWeight: 600 }}>
                {progress.current} / {progress.total}
              </div>
            </div>
          )}

          {done && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                {progress.total} leads listos
              </div>
              <div style={{ fontSize: 15, color: 'var(--gray-mid)', marginBottom: 32 }}>
                Brief IA preparado para cada empresa.
              </div>
              <button className="btn btn-primary btn-xl" onClick={() => router.push('/focus')}>
                📞 &nbsp;EMPEZAR A LLAMAR
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-lt)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, marginTop: 16 }}>
              {error}
            </div>
          )}

          {!uploading && !done && (
            <div style={{ marginTop: 32 }}>
              <div className="section-label" style={{ marginBottom: 16 }}>Una vez subido</div>
              {[
                ['✓', 'Análisis automático de cada web'],
                ['✓', 'Brief IA listo antes de llamar'],
                ['✓', '0 configuración extra'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de chistes */}
        <div style={{ flex: 1, paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-mid)', marginBottom: 20 }}>
            Mientras esperas 😄
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chistes.map((c, i) => (
              <div key={i} style={{ background: 'var(--gray)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{c.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--black)' }}>{c.texto}</span>
              </div>
            ))}
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
