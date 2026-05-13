import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmail } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { leadId, result, voiceNotes, duration, xpEarned } = await req.json()

  // Get lead info
  const { data: lead } = await supabase
    .from('leads').select('company, name').eq('id', leadId).single()

  // Generate email if needed
  let email = null
  if (result === 'interested' || result === 'followup') {
    email = await generateEmail(lead?.company || lead?.name || '', result, voiceNotes || '')
  }

  // Save call
  await supabase.from('calls').insert({
    user_id: user.id, lead_id: leadId, result,
    voice_notes: voiceNotes, duration_seconds: duration,
    xp_earned: xpEarned,
    email_generated: email ? JSON.stringify(email) : null,
  })

  // Update lead status
  await supabase.from('leads').update({ status: result }).eq('id', leadId)

  // Update user stats
  const today = new Date().toISOString().split('T')[0]
  const { data: stats } = await supabase
    .from('user_stats').select('*').eq('user_id', user.id).single()

  const lastDate  = stats?.last_active_date
  const isToday   = lastDate === today
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const wasYesterday = lastDate === yesterday

  const newStreak = isToday
    ? stats.streak_days
    : wasYesterday
      ? (stats.streak_days || 0) + 1
      : 1

  await supabase.from('user_stats').upsert({
    user_id: user.id,
    total_xp: (stats?.total_xp || 0) + xpEarned,
    streak_days: newStreak,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, email })
}
