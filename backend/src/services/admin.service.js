const prisma = require('../utils/prisma')

// Listar todos los tickets con filtros
const getAllTickets = async (filters = {}) => {
  const { status, priority, specialty_id } = filters

  const where = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (specialty_id) where.specialty_id = parseInt(specialty_id)

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { created_at: 'asc' }
    ],
    include: {
      created_by: { select: { first_name: true, last_name_pat: true, role: true } },
      assigned_esp: { select: { access_code: true, first_name: true } },
      specialty: true
    }
  })

  return tickets.map(ticket => ({
    ...ticket,
    days_elapsed: Math.floor((new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24))
  }))
}

// Crear ticket interno
const createInternalTicket = async (adminId, data) => {
  const { description, reference_point, address, latitude, longitude, priority, specialty_id, assigned_esp_id } = data

  const due_date = new Date()
  due_date.setDate(due_date.getDate() + 30)

  // Generar código con reintentos
  let ticket = null
  let retries = 3
  
  while (retries > 0) {
    try {
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
      const code = `REC-${dateStr}-${String(sequence).padStart(4, '0')}`

      ticket = await prisma.ticket.create({
        data: {
          code,
          origin: 'INTERNO',
          description,
          reference_point: reference_point || null,
          address,
          latitude: latitude || null,
          longitude: longitude || null,
          priority: priority || 'MEDIA',
          status: assigned_esp_id ? 'ASIGNADO' : 'PENDIENTE',
          due_date,
          created_by_id: adminId,
          specialty_id: specialty_id ? parseInt(specialty_id) : null,
          assigned_esp_id: assigned_esp_id || null
        }
      })
      break
    } catch (err) {
      if (err.code === 'P2002' && err.meta?.target?.includes('code')) {
        retries--
        if (retries === 0) throw new Error('No se pudo generar un código único para el ticket. Intenta de nuevo.')
      } else {
        throw err
      }
    }
  }

  // Log
  await prisma.ticketLog.create({
    data: {
      ticket_id: ticket.id,
      user_id: adminId,
      action: 'CREADO',
      to_status: ticket.status,
      note: 'Ticket interno creado por administrador'
    }
  })

  if (assigned_esp_id) {
    await prisma.ticketLog.create({
      data: {
        ticket_id: ticket.id,
        user_id: adminId,
        action: 'ASIGNADO',
        to_status: 'ASIGNADO',
        note: `Asignado por administrador`
      }
    })

    // Notificar al técnico
    await prisma.notification.create({
      data: {
        user_id: assigned_esp_id,
        ticket_id: ticket.id,
        message: `Tienes un nuevo ticket asignado: ${ticket.code}`
      }
    })
  }

  return ticket
}

// Asignar o reasignar ticket
const assignTicket = async (adminId, ticketId, espId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')

  const tech = await prisma.user.findUnique({ where: { id: espId } })
  if (!tech || tech.role !== 'ESP_') throw new Error('Técnico no válido')
  if (!tech.is_active) throw new Error('El técnico está inactivo')

  const oldEspId = ticket.assigned_esp_id

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assigned_esp_id: espId,
      status: 'ASIGNADO'
    }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: adminId,
      action: oldEspId ? 'REASIGNADO' : 'ASIGNADO',
      from_status: ticket.status,
      to_status: 'ASIGNADO',
      note: oldEspId ? `Reasignado de ESP id ${oldEspId} a ESP id ${espId}` : `Asignado a ESP id ${espId}`
    }
  })

  // Notificar al nuevo técnico
  await prisma.notification.create({
    data: {
      user_id: espId,
      ticket_id: ticketId,
      message: `Se te ha asignado el ticket ${ticket.code}`
    }
  })

  return updated
}

// Aprobar cierre
const approveClose = async (adminId, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.status !== 'PRE_CERRADO') throw new Error('El ticket no está en estado PRE_CERRADO')

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CERRADO',
      closed_at: new Date(),
      closed_by_id: adminId
    }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: adminId,
      action: 'CERRADO',
      from_status: 'PRE_CERRADO',
      to_status: 'CERRADO',
      note: 'Cierre aprobado por administrador'
    }
  })

  // Notificar al cliente
  await prisma.notification.create({
    data: {
      user_id: ticket.created_by_id,
      ticket_id: ticketId,
      message: `Tu reclamo ${ticket.code} ha sido cerrado exitosamente`
    }
  })

  return updated
}

// Rechazar cierre
const rejectClose = async (adminId, ticketId, note) => {
  if (!note) throw new Error('El motivo de rechazo es obligatorio')

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.status !== 'PRE_CERRADO') throw new Error('El ticket no está en estado PRE_CERRADO')

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'OBSERVADO' }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: adminId,
      action: 'RECHAZADO',
      from_status: 'PRE_CERRADO',
      to_status: 'OBSERVADO',
      note
    }
  })

  // Notificar al técnico
  await prisma.notification.create({
    data: {
      user_id: ticket.assigned_esp_id,
      ticket_id: ticketId,
      message: `Tu reporte del ticket ${ticket.code} fue rechazado: ${note}`
    }
  })

  return updated
}

module.exports = { getAllTickets, createInternalTicket, assignTicket, approveClose, rejectClose }