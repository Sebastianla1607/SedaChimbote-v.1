const prisma = require('../utils/prisma')
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

const getHistory = async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        created_by: { select: { first_name: true, last_name_pat: true, role: true, access_code: true } },
        assigned_esp: { select: { access_code: true, first_name: true } },
        closed_by: { select: { access_code: true, first_name: true } },
        specialty: true,
        evidences: true,
        tech_report: true,
        client_survey: true,
        logs: {
          orderBy: { created_at: 'asc' },
          include: {
            user: { select: { role: true, access_code: true, first_name: true } }
          }
        }
      }
    })

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })

    res.json({ ticket })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLI_' },
      select: {
        id: true,
        first_name: true,
        last_name_pat: true,
        last_name_mat: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
        customer: {
          select: {
            supply_code: true,
            address: true,
            doc_number: true
          }
        },
        _count: {
          select: { tickets_created: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json({ clients })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { listTickets, createInternal, assign, approve, reject, getHistory, getClients }