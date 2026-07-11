const { analyzeTicket } = require('../services/gemini.service')
const { createTicket } = require('../services/ticket.service')
const prisma = require('../utils/prisma')

const analyzeAndCreate = async (req, res) => {
  try {
    const { description, reference_point, imageBase64, imageUrl, latitude, longitude } = req.body

    if (!description) {
      return res.status(400).json({ error: 'La descripción es requerida' })
    }

    // 1. Enviar a Gemini para análisis
    const analysis = await analyzeTicket(description, imageBase64 || null)

    // 2. Si Gemini rechaza el reclamo
    if (analysis.tipo === 'RECHAZADO') {
      return res.status(200).json({
        resultado: 'RECHAZADO',
        mensaje: analysis.mensaje_cliente
      })
    }

    // 3. Si Gemini necesita más información
    if (analysis.tipo === 'NECESITA_MAS_INFO') {
      return res.status(200).json({
        resultado: 'NECESITA_MAS_INFO',
        mensaje: analysis.mensaje_cliente
      })
    }

    // 4. Si Gemini aprueba — crear el ticket
    const ticket = await createTicket(req.user.id, {
      description,
      reference_point,
      ai_category: analysis.categoria,
      ai_priority: analysis.prioridad,
      ai_specialty: analysis.categoria,
      ai_report: analysis.reporte,
      ai_difficulty: analysis.dificultad,
      latitude,
      longitude
    })

    if (imageUrl) {
      await prisma.evidence.create({
        data: {
          image_url: imageUrl,
          type: 'REPORTE_INICIAL',
          ticket_id: ticket.id,
          uploaded_by_id: req.user.id
        }
      })
    }

    return res.status(201).json({
      resultado: 'APROBADO',
      mensaje: analysis.mensaje_cliente,
      ticket: {
        id: ticket.id,
        code: ticket.code,
        status: ticket.status,
        priority: ticket.priority,
        ai_category: ticket.ai_category,
        ai_difficulty: ticket.ai_difficulty,
        ai_report: ticket.ai_report,
        created_at: ticket.created_at,
        due_date: ticket.due_date
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al procesar el reclamo' })
  }
}

module.exports = { analyzeAndCreate }