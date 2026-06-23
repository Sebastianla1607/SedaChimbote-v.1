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

CRITERIOS PARA ASIGNAR PRIORIDAD (basados en las palabras clave del reclamo):
- EXTREMA: si menciona "inundación", "rotura de tubería principal", "fuga masiva", "agua en la calle", "daño estructural", "desabastecimiento total en zona".
- ALTA: si menciona "sin agua", "presión muy baja", "agua sucia", "olor fuerte", "fuga que moja paredes", "medidor roto".
- MEDIA: si menciona "baja presión", "fuga pequeña", "ruido en tuberías", "medidor con error", "agua turbia".
- BAJA: si menciona "goteo", "fuga mínima", "consulta de mantenimiento", "problema estético".

DIFICULTAD DE LA TAREA:
- SIMPLE: trabajo de menos de 1 hora
- MODERADO: trabajo de 1 a 3 horas
- COMPLEJO: trabajo de más de 3 horas o requiere equipo especial

CRITERIOS PARA ASIGNAR DIFICULTAD (según la complejidad técnica descrita):
- COMPLEJO: si requiere "excavación", "reemplazo de tubería", "rotura de red", "equipo especial", "soldadura", o se estima >3 horas.
- MODERADO: si requiere "reparación de fuga en tubería secundaria", "cambio de medidor", "ajuste de presión", "limpieza de filtros", o se estima 1-3 horas.
- SIMPLE: si requiere "ajuste de válvula", "apriete de conexión", "inspección", "lectura", o se estima <1 hora.

Nota: prioridad y dificultad pueden no coincidir; asigna cada una según sus propios criterios.

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