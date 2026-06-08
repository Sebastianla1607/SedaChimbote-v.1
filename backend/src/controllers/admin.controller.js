const { getAllTickets, createInternalTicket, assignTicket, approveClose, rejectClose } = require('../services/admin.service')

const listTickets = async (req, res) => {
  try {
    const tickets = await getAllTickets(req.query)
    res.json({ tickets })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const createInternal = async (req, res) => {
  try {
    const ticket = await createInternalTicket(req.user.id, req.body)
    res.status(201).json({ message: 'Ticket interno creado', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const assign = async (req, res) => {
  try {
    const { esp_id } = req.body
    const ticket = await assignTicket(req.user.id, parseInt(req.params.id), esp_id)
    res.json({ message: 'Ticket asignado correctamente', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const approve = async (req, res) => {
  try {
    const ticket = await approveClose(req.user.id, parseInt(req.params.id))
    res.json({ message: 'Ticket cerrado correctamente', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const reject = async (req, res) => {
  try {
    const { note } = req.body
    const ticket = await rejectClose(req.user.id, parseInt(req.params.id), note)
    res.json({ message: 'Ticket rechazado', ticket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { listTickets, createInternal, assign, approve, reject }