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

const autoAssignTech = async (specialty, prisma) => {
  // Buscar técnicos disponibles con la especialidad correcta
  const techs = await prisma.user.findMany({
    where: {
      role: 'ESP_',
      is_active: true,
      is_wip_locked: false,
      specialties: {
        some: {
          specialty: {
            name: { contains: specialty, mode: 'insensitive' }
          }
        }
      }
    },
    include: {
      tickets_assigned: {
        where: { status: { notIn: ['CERRADO', 'OBSERVADO'] } }
      }
    }
  })

  if (techs.length === 0) return null

  // Asignar al técnico con menos tickets activos
  const sorted = techs.sort((a, b) =>
    a.tickets_assigned.length - b.tickets_assigned.length
  )

  return sorted[0].id
}

// Crear ticket ciudadano
const createTicket = async (userId, data) => {
  const { description, reference_point, ai_category, ai_priority, ai_specialty, ai_report, ai_difficulty } = data

  const openTicket = await prisma.ticket.findFirst({
    where: {
      created_by_id: userId,
      status: { not: 'CERRADO' }
    }
  })

  if (openTicket) {
    throw new Error('Ya tienes un reclamo abierto. Debes esperar a que sea cerrado para crear uno nuevo.')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true }
  })

  const code = await generateTicketCode()

  const due_date = new Date()
  due_date.setDate(due_date.getDate() + 30)

  // Intentar asignar técnico automáticamente
  let assigned_esp_id = null
  let initialStatus = 'PENDIENTE'

  if (ai_specialty) {
    assigned_esp_id = await autoAssignTech(ai_specialty, prisma)
    if (assigned_esp_id) initialStatus = 'ASIGNADO'
  }

  const ticket = await prisma.ticket.create({
    data: {
      code,
      origin: 'CIUDADANO',
      description,
      reference_point: reference_point || null,
      address: user.customer.address,
      latitude: user.customer.latitude,
      longitude: user.customer.longitude,
      status: initialStatus,
      priority: ai_priority || 'MEDIA',
      due_date,
      ai_category: ai_category || null,
      ai_priority: ai_priority || null,
      ai_specialty: ai_specialty || null,
      ai_report: ai_report || null,
      ai_difficulty: ai_difficulty || null,
      created_by_id: userId,
      assigned_esp_id: assigned_esp_id || null
    }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticket.id,
      user_id: userId,
      action: 'CREADO',
      to_status: initialStatus,
      note: assigned_esp_id
        ? `Ticket creado y asignado automáticamente`
        : 'Ticket creado por ciudadano, pendiente de asignación'
    }
  })

  if (assigned_esp_id) {
    await prisma.ticketLog.create({
      data: {
        ticket_id: ticket.id,
        user_id: userId,
        action: 'ASIGNADO',
        to_status: 'ASIGNADO',
        note: 'Asignación automática por el sistema'
      }
    })

    await prisma.notification.create({
      data: {
        user_id: assigned_esp_id,
        ticket_id: ticket.id,
        message: `Nuevo ticket asignado automáticamente: ${code}`
      }
    })
  }

  return ticket
}

// ✅ Actualizado: incluye logs para detectar si el técnico aceptó
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
      },
      logs: {
        select: { action: true, note: true },
        orderBy: { created_at: 'asc' }
      }
    }
  })

  return tickets.map(ticket => ({
    ...ticket,
    days_elapsed: Math.floor((new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24)),
    tech_accepted: ticket.logs?.some(l => l.action === 'ASIGNADO' && l.note?.includes('esperando'))
  }))
}

// ✅ Actualizado: incluye logs completos con todos los campos
const getTicketDetail = async (ticketId, userId, role) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      created_by: { select: { first_name: true, last_name_pat: true } },
      assigned_esp: { select: { access_code: true, first_name: true } },
      evidences: true,
      logs: {
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          user_id: true,
          action: true,
          from_status: true,
          to_status: true,
          note: true,
          created_at: true
        }
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