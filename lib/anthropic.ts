import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── BRIEF GENERATION ─────────────────────────────────────────
export async function generateBrief(company: string, website: string) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    system: `Eres un asistente de ventas experto. Analizas empresas y preparas briefs de 4 bullets para SDRs que van a hacer cold calling. Respondes SIEMPRE en español y SOLO con JSON válido, sin texto adicional.`,
    messages: [
      {
        role: 'user',
        content: `Prepara un brief de llamada para esta empresa.

Empresa: ${company}
Web: ${website || 'no disponible'}

Devuelve EXACTAMENTE este JSON (sin markdown, sin explicaciones):
{
  "insight": "Insight clave sobre la empresa en 1-2 frases máximo",
  "pain": "Dolor probable que podemos resolver, concreto y accionable",
  "hook": "Pregunta de apertura para la llamada, máx 1 frase natural",
  "objection": "Objeción más probable + respuesta corta separados por →"
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  try {
    return JSON.parse(text.trim())
  } catch {
    return {
      insight: `Empresa: ${company}`,
      pain: 'Posible necesidad de optimizar su proceso comercial',
      hook: `¿Cómo gestionáis actualmente la prospección en ${company}?`,
      objection: 'Ya tenemos herramienta → ¿Cómo la complementáis con seguimiento automático?',
    }
  }
}

// ── EMAIL GENERATION ─────────────────────────────────────────
export async function generateEmail(
  company: string,
  result: string,
  notes: string,
  essence?: string
) {
  const resultLabels: Record<string, string> = {
    interested: 'interesado',
    followup: 'follow-up acordado',
    no_answer: 'no contestó',
    not_interested: 'no interesado',
  }

  const essenceBlock = essence?.trim()
    ? `\nInformación sobre quien envía el email (úsala para personalizar tono, propuesta de valor y firma):\n${essence.trim()}\n`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: `Eres un asistente de ventas experto. Generas emails de seguimiento cortos, naturales y muy efectivos en español. Respondes SOLO con JSON válido, sin texto adicional.`,
    messages: [
      {
        role: 'user',
        content: `Genera un email de seguimiento basado en esta llamada:

Empresa contactada: ${company}
Resultado de la llamada: ${resultLabels[result] || result}
Notas dictadas durante la llamada: ${notes || 'Sin notas adicionales'}
${essenceBlock}
Requisitos:
- Máximo 100 palabras en el cuerpo
- Tono cercano y profesional, que suene humano
- Si hay notas, referencia algo concreto de ellas
- Incluye un siguiente paso claro y accionable
- Si tienes información de la empresa emisora, úsala para personalizar la propuesta de valor

Devuelve EXACTAMENTE este JSON:
{
  "subject": "Asunto del email",
  "body": "Cuerpo del email"
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  try {
    return JSON.parse(text.trim())
  } catch {
    return {
      subject: `Seguimiento a nuestra conversación — ${company}`,
      body: `Hola,\n\nGracias por el rato de hoy. Quedo pendiente de vuestros próximos pasos.\n\nCualquier cosa, aquí me tienes.\n\nUn saludo`,
    }
  }
}
