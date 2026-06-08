const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const analyzeTicket = async (description, imageBase64 = null) => {
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
Eres el sistema de triaje de SEDACHIMBOTE, empresa de saneamiento de agua potable.
Tu trabajo es analizar reclamos de ciudadanos y determinar si son averías técnicas del servicio de agua.

INSTRUCCIONES:
1. Analiza la descripción y/o imagen del reclamo
2. Determina si es una avería técnica válida (fuga, presión baja, medidor dañado, calidad del agua, etc.)
3. Si NO es una avería técnica (problemas de pago, facturación, consultas generales, pruebas, insultos, etc.) responde con tipo: "RECHAZADO"
4. Si necesitas más información para clasificar responde con tipo: "NECESITA_MAS_INFO"
5. Si es válido responde con tipo: "APROBADO"

CATEGORÍAS VÁLIDAS: Fugas, Medidores, Presión baja, Calidad del agua, Conexión nueva, Otros técnicos

PRIORIDADES:
- BAJA: problema menor, no urgente
- MEDIA: afecta el servicio pero no es emergencia  
- ALTA: afecta severamente el servicio
- EXTREMA: emergencia inmediata (inundación, rotura de tubería principal)

DIFICULTAD DE LA TAREA PARA EL TÉCNICO:
- SIMPLE: trabajo de menos de 1 hora
- MODERADO: trabajo de 1 a 3 horas
- COMPLEJO: trabajo de más de 3 horas o requiere equipo especial

Responde ÚNICAMENTE en este formato JSON exacto, sin texto adicional:
{
  "tipo": "APROBADO|RECHAZADO|NECESITA_MAS_INFO",
  "categoria": "nombre de la categoría o null",
  "prioridad": "BAJA|MEDIA|ALTA|EXTREMA o null",
  "dificultad": "SIMPLE|MODERADO|COMPLEJO o null",
  "reporte": "descripción técnica breve para el técnico, máximo 200 caracteres, o null",
  "mensaje_cliente": "mensaje para mostrar al cliente explicando la decisión"
}
`

  const parts = [{ text: prompt }, { text: `Descripción del reclamo: ${description}` }]

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    })
  }

  const result = await model.generateContent(parts)
  const response = result.response.text()

  // Limpiar respuesta y parsear JSON
  const cleaned = response.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned)

  return parsed
}

module.exports = { analyzeTicket }