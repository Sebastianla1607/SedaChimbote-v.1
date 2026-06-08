const { createTicket, getClientTickets, getTicketDetail } = require('../services/ticket.service')

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

module.exports = { create, getMyTickets, getDetail }