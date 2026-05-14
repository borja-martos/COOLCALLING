import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

function getSupabase(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  return supabase
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const buffer   = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

  if (!rows.length) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })

  const normalize = (row: Record<string, string>) => {
    const keys = Object.keys(row)
    const find = (...terms: string[]) =>
      keys.find(k => terms.some(t => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(t.replace(/[^a-z0-9]/g, '')))) || ''

    // Phone: buscar cualquier columna que tenga números de teléfono
    const phoneKey = find('telefono', 'telef', 'phone', 'tel', 'movil', 'móvil', 'celular', 'cel', 'contacto', 'tlf', 'telf')
    // Si no hay columna clara de teléfono, buscar la primera columna con números
    const fallbackPhoneKey = !phoneKey
      ? keys.find(k => {
          const val = String(row[k] || '')
          return /[\d\s\-\+\(\)]{7,}/.test(val)
        }) || ''
      : phoneKey

    return {
      name:    String(row[find('nombre', 'name', 'contacto', 'persona', 'responsable')] || '').trim(),
      phone:   String(row[fallbackPhoneKey] || '').trim(),
      website: String(row[find('web', 'url', 'website', 'pagina', 'página', 'dominio', 'http')] || '').trim(),
      company: String(row[find('empresa', 'company', 'negocio', 'cliente', 'razon', 'razón', 'nombre')] || '').trim(),
    }
  }

  const leads = rows.map((row, i) => {
    const n = normalize(row)
    return {
      user_id:  user.id,
      name:     n.name || n.company || `Lead ${i + 1}`,
      phone:    n.phone || 'Sin teléfono',
      website:  n.website,
      company:  n.company || n.name || `Lead ${i + 1}`,
      position: i,
      status:   'pending',
    }
  })

  if (!leads.length) return NextResponse.json({ error: 'El archivo no tiene filas de datos' }, { status: 400 })

  const { data, error } = await supabase.from('leads').insert(leads).select('id, company, name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data, count: data.length })
}
