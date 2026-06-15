const Groq = require('groq-sdk')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const analyzeTicket = async (description, imageBase64 = null) => {
  const prompt = `
Eres el sistema de triaje de SEDACHIMBOTE, empresa de saneamiento de agua potable de Chimbote, Perú.
Tu trabajo es analizar reclamos de ciudadanos y determinar si son averías técnicas del servicio de agua.

INSTRUCCIONES:
1. Analiza la descripción del reclamo
2. Determina si es una avería técnica válida (fuga, presión baja, medidor dañado, calidad del agua, etc.)
3. Si NO es una avería técnica (problemas de pago, facturación, consultas generales, pruebas, insultos, contenido irrelevante) responde con tipo: "RECHAZADO"
4. Si necesitas más información para clasificar responde con tipo: "NECESITA_MAS_INFO"
5. Si es válido responde con tipo: "APROBADO"

CATEGORÍAS VÁLIDAS: Fugas, Medidores, Presión baja, Calidad del agua, Conexión nueva, Otros técnicos

PRIORIDADES:
- BAJA: problema menor, no urgente
- MEDIA: afecta el servicio pero no es emergencia
- ALTA: afecta severamente el servicio
- EXTREMA: emergencia inmediata (inundación, rotura de tubería principal)

DIFICULTAD DE LA TAREA:
- SIMPLE: trabajo de menos de 1 hora
- MODERADO: trabajo de 1 a 3 horas
- COMPLEJO: trabajo de más de 3 horas o requiere equipo especial

Descripción del reclamo: "${description}"

Responde ÚNICAMENTE en este formato JSON exacto, sin texto adicional, sin markdown, sin backticks:
{"tipo":"APROBADO","categoria":"nombre categoria","prioridad":"BAJA|MEDIA|ALTA|EXTREMA","dificultad":"SIMPLE|MODERADO|COMPLEJO","reporte":"descripción técnica breve máximo 200 caracteres","mensaje_cliente":"mensaje para el cliente"}
`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 500
  })

  const response = completion.choices[0]?.message?.content || ''
  const cleaned = response.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned)

  return parsed
}

module.exports = { analyzeTicket }