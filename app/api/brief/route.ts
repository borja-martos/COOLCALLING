import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBrief } from '@/lib/anthropic'

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId requerido' }, { status: 400 })

  const { data: lead } = await supabase
    .from('leads').select('id, company, name, website')
    .eq('id', leadId).eq('user_id', user.id).single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const brief = await generateBrief(lead.company || lead.name, lead.website || '')

  await supabase.from('leads').update({ brief }).eq('id', leadId)

  return NextResponse.json({ brief })
}
