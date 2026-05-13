export const XP_VALUES = {
  call_completed: 10,
  interested: 30,
  followup: 20,
  no_answer: 5,
  not_interested: 5,
  email_sent: 10,
  session_10_calls: 50,
  streak_maintained: 15,
}

export const LEVELS = [
  { level: 1, name: 'Prospector', minXp: 0 },
  { level: 2, name: 'Caller',     minXp: 500 },
  { level: 3, name: 'Hunter',     minXp: 1500 },
  { level: 4, name: 'Closer',     minXp: 4000 },
  { level: 5, name: 'Legend',     minXp: 10000 },
]

export function getLevelFromXp(xp: number) {
  const level = [...LEVELS].reverse().find(l => xp >= l.minXp)
  return level || LEVELS[0]
}

export function getNextLevel(xp: number) {
  const current = getLevelFromXp(xp)
  return LEVELS.find(l => l.level === current.level + 1) || null
}

export function getXpProgress(xp: number) {
  const current = getLevelFromXp(xp)
  const next = getNextLevel(xp)
  if (!next) return 100
  const range = next.minXp - current.minXp
  const progress = xp - current.minXp
  return Math.round((progress / range) * 100)
}

export function calcXpForResult(result: string): number {
  const base = XP_VALUES.call_completed
  const bonus = XP_VALUES[result as keyof typeof XP_VALUES] || 0
  return base + bonus
}

export function getMotivationalMessage(callsToday: number, streak: number): string {
  if (callsToday === 1)  return '¡Primera del día! Que empiece la racha.'
  if (callsToday === 5)  return '5 llamadas. Estás entrando en calor.'
  if (callsToday === 10) return '10 llamadas. Eso es consistencia.'
  if (callsToday === 20) return '20 llamadas. Nivel máximo activado.'
  if (streak >= 7)       return `${streak} días seguidos. Leyenda en camino.`
  if (streak >= 3)       return `Racha de ${streak} días. No pares.`
  return '¡Sigue así. Vas a tope!'
}
