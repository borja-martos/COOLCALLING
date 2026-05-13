import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBrief } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
