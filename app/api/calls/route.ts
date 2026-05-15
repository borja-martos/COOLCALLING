import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmail } from '@/lib/anthropic'

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

  const { leadId, result, voiceNotes, duration, xpEarned } = await req.json()

  const { data: lead } = await supabase
    .from('leads').select('company, name').eq('id', leadId).single()

  const { data: profile } = await supabase
    .from('company_profile').select('essence').eq('user_id', user.id).single()

  let email = null
  if (result === 'interested' || result === 'followup') {
    email = await generateEmail(
      lead?.company || lead?.name || '',
      result,
      voiceNotes || '',
      profile?.essence || ''
    )
  }

  await supabase.from('calls').insert({
    user_id: user.id, lead_id: leadId, result,
    voice_notes: voiceNotes, duration_seconds: duration,
    xp_earned: xpEarned,
    email_generated: email ? JSON.stringify(email) : null,
  })

  await supabase.from('leads').update({ status: result }).eq('id', leadId)

  const today = new Date().toISOString().split('T')[0]
  const { data: stats } = await supabase
    .from('user_stats').select('*').eq('user_id', user.id).single()

  const lastDate     = stats?.last_active_date
  const yesterday    = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak    = lastDate === today
    ? stats.streak_days
    : lastDate === yesterday ? (stats.streak_days || 0) + 1 : 1

  await supabase.from('user_stats').upsert({
    user_id: user.id,
    total_xp: (stats?.total_xp || 0) + xpEarned,
    streak_days: newStreak,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, email })
}
