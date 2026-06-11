const { createTicket, getClientTickets, getTicketDetail } = require('../services/ticket.service')
const prisma = require('../utils/prisma')

const create = async (req, res) => {
  try {
    const ticket = await createTicket(req.user.id, req.body)
    res.status(201).json({ message: 'Ticket creado exitosamente', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getMyTickets = async (req, res) => {
  try {
    const tickets = await getClientTickets(req.user.id)
    res.json({ tickets })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getDetail = async (req, res) => {
  try {
    const ticket = await getTicketDetail(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    )
    res.json({ ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const submitSurvey = async (req, res) => {
  try {
    const { nps_score, comment } = req.body

    if (!nps_score || nps_score < 1 || nps_score > 5) {
      return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) }
    })

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })
    if (ticket.created_by_id !== req.user.id) return res.status(403).json({ error: 'No tienes permiso' })
    if (ticket.status !== 'CERRADO') return res.status(400).json({ error: 'El ticket debe estar cerrado para calificar' })

    const existing = await prisma.clientSurvey.findUnique({ where: { ticket_id: ticket.id } })
    if (existing) return res.status(400).json({ error: 'Ya calificaste este ticket' })

    const survey = await prisma.clientSurvey.create({
      data: {
        ticket_id: ticket.id,
        nps_score,
        comment: comment || null
      }
    })

    res.status(201).json({ message: 'Gracias por tu calificación', survey })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const respondPresence = async (req, res) => {
  try {
    const { is_home } = req.body
    const ticketId = parseInt(req.params.id)

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })
    if (ticket.created_by_id !== req.user.id) return res.status(403).json({ error: 'No tienes permiso' })
    if (ticket.status !== 'EN_CAMINO') return res.status(400).json({ error: 'El técnico aún no está en camino' })

    const action = is_home ? 'CLIENTE_EN_CASA' : 'CLIENTE_AUSENTE'
    const note = is_home ? 'Cliente confirmó que está en casa' : 'Cliente confirmó que no está en casa'

    await prisma.ticketLog.create({
      data: {
        ticket_id: ticketId,
        user_id: req.user.id,
        action,
        from_status: 'EN_CAMINO',
        to_status: 'EN_CAMINO',
        note
      }
    })

    // Notificar al técnico
    await prisma.notification.create({
      data: {
        user_id: ticket.assigned_esp_id,
        ticket_id: ticketId,
        message: is_home
          ? 'El cliente confirmó que está en casa, dirígete a la vivienda'
          : 'El cliente confirmó que no está en casa, puedes tomar otro ticket'
      }
    })

    res.json({
      message: is_home ? 'Confirmado, el técnico se dirigirá a tu vivienda' : 'Entendido, el técnico será notificado',
      is_home
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { create, getMyTickets, getDetail, submitSurvey, respondPresence }