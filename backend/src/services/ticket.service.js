const prisma = require('../utils/prisma')

// Generar código único de ticket REC-YYYYMMDD-XXXX
const generateTicketCode = async () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  
  const lastTicket = await prisma.ticket.findFirst({
    where: { code: { startsWith: `REC-${dateStr}` } },
    orderBy: { created_at: 'desc' }
  })

  let sequence = 1
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.code.split('-')[2])
    sequence = lastSequence + 1
  }

  return `REC-${dateStr}-${String(sequence).padStart(4, '0')}`
}

// Crear ticket ciudadano
const createTicket = async (userId, data) => {
  const { description, reference_point, ai_category, ai_priority, ai_specialty, ai_report, ai_difficulty } = data

  // Verificar que el cliente no tenga un reclamo abierto
  const openTicket = await prisma.ticket.findFirst({
    where: {
      created_by_id: userId,
      status: { not: 'CERRADO' }
    }
  })

  if (openTicket) {
    throw new Error('Ya tienes un reclamo abierto. Debes esperar a que sea cerrado para crear uno nuevo.')
  }

  // Obtener dirección del customer vinculado al usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true }
  })

  const code = await generateTicketCode()

  // Calcular due_date (30 días desde hoy)
  const due_date = new Date()
  due_date.setDate(due_date.getDate() + 30)

  const ticket = await prisma.ticket.create({
    data: {
      code,
      origin: 'CIUDADANO',
      description,
      reference_point: reference_point || null,
      address: user.customer.address,
      latitude: user.customer.latitude,
      longitude: user.customer.longitude,
      status: 'PENDIENTE',
      priority: ai_priority || 'MEDIA',
      due_date,
      ai_category: ai_category || null,
      ai_priority: ai_priority || null,
      ai_specialty: ai_specialty || null,
      ai_report: ai_report || null,
      ai_difficulty: ai_difficulty || null,
      created_by_id: userId
    }
  })

  // Registrar en el log
  await prisma.ticketLog.create({
    data: {
      ticket_id: ticket.id,
      user_id: userId,
      action: 'CREADO',
      to_status: 'PENDIENTE',
      note: 'Ticket creado por ciudadano'
    }
  })

  return ticket
}

// Obtener tickets del cliente
const getClientTickets = async (userId) => {
  const tickets = await prisma.ticket.findMany({
    where: { created_by_id: userId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      code: true,
      description: true,
      status: true,
      priority: true,
      ai_category: true,
      created_at: true,
      due_date: true,
      assigned_esp: {
        select: { access_code: true }
      }
    }
  })

  return tickets.map(ticket => ({
    ...ticket,
    days_elapsed: Math.floor((new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24))
  }))
}

const getTicketDetail = async (ticketId, userId, role) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      created_by: { select: { first_name: true, last_name_pat: true } },
      assigned_esp: { select: { access_code: true, first_name: true } },
      evidences: true,
      logs: {
        orderBy: { created_at: 'asc' },
        select: { action: true, note: true, created_at: true }
      },
      tech_report: true,
      client_survey: true
    }
  })

  if (!ticket) throw new Error('Ticket no encontrado')

  if (role === 'CLI_' && ticket.created_by_id !== userId) {
    throw new Error('No tienes permiso para ver este ticket')
  }

  return ticket
}

module.exports = { createTicket, getClientTickets, getTicketDetail }