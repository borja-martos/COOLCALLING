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
  notes: string
) {
  const resultLabels: Record<string, string> = {
    interested: 'interesado',
    followup: 'follow-up acordado',
    no_answer: 'no contestó',
    not_interested: 'no interesado',
  }

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    system: `Eres un asistente de ventas. Generas emails de seguimiento cortos, naturales y efectivos en español. Respondes SOLO con JSON válido, sin texto adicional.`,
    messages: [
      {
        role: 'user',
        content: `Genera un email de seguimiento basado en esta llamada:

Empresa: ${company}
Resultado: ${resultLabels[result] || result}
Notas de la llamada: ${notes || 'Sin notas adicionales'}

Requisitos:
- Máximo 80 palabras en el cuerpo
- Tono cercano y profesional
- Referencia algo concreto de las notas si las hay
- Incluye un siguiente paso claro

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
