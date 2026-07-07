const prisma = require('../utils/prisma')

const getTechTickets = async (techId) => {
  const tickets = await prisma.ticket.findMany({
    where: {
      assigned_esp_id: techId,
      status: { in: ['ASIGNADO', 'EN_CAMINO', 'EJECUCION_ACTIVA', 'OBSERVADO'] }
    },
    orderBy: [
      { priority: 'desc' },
      { created_at: 'asc' }
    ],
    include: {
      specialty: true,
      evidences: true
    }
  })

  const waitingClose = await prisma.ticket.findMany({
    where: {
      assigned_esp_id: techId,
      status: 'PRE_CERRADO'
    },
    include: { specialty: true }
  })

  return { active: tickets, waiting_close: waitingClose }
}

// Técnico acepta ticket
const startRoute = async (techId, ticketId) => {
  const tech = await prisma.user.findUnique({ where: { id: techId } })
  if (tech.is_wip_locked) throw new Error('Ya tienes un ticket activo en curso')

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'ASIGNADO') throw new Error('El ticket no está en estado ASIGNADO')

  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: true }
  })

  // Ticket INTERNO — va directo a EN_CAMINO sin esperar cliente
  if (ticket.origin === 'INTERNO') {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'EN_CAMINO' }
    })

    await prisma.ticketLog.create({
      data: {
        ticket_id: ticketId,
        user_id: techId,
        action: 'EN_CAMINO',
        from_status: 'ASIGNADO',
        to_status: 'EN_CAMINO',
        note: 'Ticket interno — técnico en camino directo a la ubicación'
      }
    })

    return { message: 'Ticket interno aceptado, dirígete a la ubicación', ticket: updated, origin: 'INTERNO' }
  }

  // Ticket CIUDADANO — espera confirmación del cliente
  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'ASIGNADO',
      from_status: 'ASIGNADO',
      to_status: 'ASIGNADO',
      note: 'Técnico aceptó el ticket, esperando confirmación del cliente'
    }
  })

  await prisma.notification.create({
    data: {
      user_id: ticket.created_by_id,
      ticket_id: ticketId,
      message: `El técnico ${tech.access_code} ha aceptado tu reclamo ${ticket.code}. ¿Estás en casa?`
    }
  })

  return { message: 'Ticket aceptado, esperando confirmación del cliente', origin: 'CIUDADANO' }
}

// Técnico confirma que el cliente está en casa y sale hacia la vivienda
const goToLocation = async (techId, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.origin === 'INTERNO') throw new Error('Los tickets internos no requieren confirmación del cliente')
  if (ticket.status !== 'ASIGNADO') throw new Error('El cliente aún no ha confirmado que está en casa')

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'EN_CAMINO' }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'EN_CAMINO',
      from_status: 'ASIGNADO',
      to_status: 'EN_CAMINO',
      note: 'Cliente confirmó presencia, técnico en camino a la vivienda'
    }
  })

  await prisma.notification.create({
    data: {
      user_id: ticket.created_by_id,
      ticket_id: ticketId,
      message: `El técnico está en camino a tu vivienda para atender tu reclamo ${ticket.code}`
    }
  })

  return updated
}

// Técnico llega a la vivienda
const arrivedAtLocation = async (techId, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'EN_CAMINO') throw new Error('El ticket no está en estado EN_CAMINO')

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'TECNICO_AFUERA',
      from_status: 'EN_CAMINO',
      to_status: 'EN_CAMINO',
      note: 'Técnico llegó a la vivienda'
    }
  })

  // Solo notificar al cliente si es ticket CIUDADANO
  if (ticket.origin === 'CIUDADANO') {
    await prisma.notification.create({
      data: {
        user_id: ticket.created_by_id,
        ticket_id: ticketId,
        message: `El técnico está afuera de tu vivienda. Por favor, acércate a atenderlo.`
      }
    })
  }

  return { message: ticket.origin === 'INTERNO' ? 'Llegaste a la ubicación' : 'Cliente notificado, esperando que abra la puerta' }
}

// Cliente ausente
const clientAbsent = async (techId, ticketId, data) => {
  const { description, image_url } = data

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'OBSERVADO' }
  })

  if (image_url) {
    await prisma.evidence.create({
      data: {
        ticket_id: ticketId,
        image_url,
        type: 'AUSENCIA',
        uploaded_by_id: techId
      }
    })
  }

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'CLIENTE_AUSENTE',
      from_status: 'EN_CAMINO',
      to_status: 'OBSERVADO',
      note: description || 'Cliente no atendió la visita'
    }
  })

  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: false }
  })

  return { message: 'Ticket marcado como observado, puedes tomar otro ticket' }
}

// Iniciar ejecución
const startExecution = async (techId, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'EN_CAMINO') throw new Error('El ticket no está en estado EN_CAMINO')

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'EJECUCION_ACTIVA' }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'EJECUCION_ACTIVA',
      from_status: 'EN_CAMINO',
      to_status: 'EJECUCION_ACTIVA',
      note: ticket.origin === 'INTERNO'
        ? 'Técnico inició trabajo en la ubicación'
        : 'Cliente abrió la puerta, técnico inició ejecución'
    }
  })

  return updated
}

// ✅ Técnico envía reporte SOLO si el cliente ha dado conformidad (para tickets ciudadanos)
const submitTechReport = async (techId, ticketId, data) => {
  const { description, image_urls } = data

  if (!description) throw new Error('La descripción del reporte es obligatoria')
  if (!image_urls || image_urls.length === 0) throw new Error('Debes subir al menos una foto')

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { logs: true } // incluye logs para posibles validaciones futuras
  })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'EJECUCION_ACTIVA') throw new Error('El ticket no está en ejecución activa')

  // 🔥 VALIDACIÓN CLAVE: el técnico NO puede enviar reporte si el cliente no ha dado conformidad (solo para ciudadanos)
  if (ticket.origin === 'CIUDADANO' && !ticket.is_client_conformed) {
    throw new Error('Debes esperar que el cliente confirme la conformidad del trabajo antes de enviar el reporte')
  }

  // Guardar reporte técnico
  await prisma.techReport.create({
    data: {
      ticket_id: ticketId,
      tech_id: techId,
      description,
      evidences_urls: image_urls
    }
  })

  // Guardar evidencias
  await prisma.evidence.createMany({
    data: image_urls.map(url => ({
      ticket_id: ticketId,
      image_url: url,
      type: 'RESOLUCION_FINAL',
      uploaded_by_id: techId
    }))
  })

  // Cambiar estado a PRE_CERRADO
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'PRE_CERRADO' }
  })

  // Liberar al técnico
  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: false }
  })

  // Log
  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'PRE_CERRADO',
      from_status: 'EJECUCION_ACTIVA',
      to_status: 'PRE_CERRADO',
      note: 'Técnico envió reporte, esperando aprobación del administrador'
    }
  })

  // Notificar a administradores
  const admins = await prisma.user.findMany({ where: { role: 'ADM_', is_active: true } })
  await prisma.notification.createMany({
    data: admins.map(admin => ({
      user_id: admin.id,
      ticket_id: ticketId,
      message: `El ticket ${ticket.code} está listo para revisión de cierre`
    }))
  })

  return { message: 'Reporte enviado, ticket en espera de aprobación' }
}

// Estadísticas de rendimiento del técnico
const getTechPerformance = async (techId) => {
  const DAILY_TARGET = 10
  const PERU_OFFSET_MS = -5 * 60 * 60 * 1000

  // Fecha actual en UTC-5 (Perú)
  const nowUtc = new Date()
  const nowPeru = new Date(nowUtc.getTime() + PERU_OFFSET_MS)

  const year = nowPeru.getUTCFullYear()
  const month = nowPeru.getUTCMonth()
  const day = nowPeru.getUTCDate()

  // Inicio del día (medianoche Perú) en UTC
  const todayStartUtc = new Date(Date.UTC(year, month, day) - PERU_OFFSET_MS)
  // Inicio del mes (1ero del mes Perú) en UTC
  const monthStartUtc = new Date(Date.UTC(year, month, 1) - PERU_OFFSET_MS)

  const user = await prisma.user.findUnique({ where: { id: techId } })

  // daily.closed
  const dailyClosed = await prisma.ticket.count({
    where: {
      assigned_esp_id: techId,
      status: 'CERRADO',
      closed_at: { gte: todayStartUtc }
    }
  })

  // monthly.closed
  const monthlyClosed = await prisma.ticket.count({
    where: {
      assigned_esp_id: techId,
      status: 'CERRADO',
      closed_at: { gte: monthStartUtc }
    }
  })

  // total all-time
  const total = await prisma.ticket.count({
    where: {
      assigned_esp_id: techId,
      status: 'CERRADO'
    }
  })

  // calendar: agrupar tickets cerrados por día del mes actual
  const closedThisMonth = await prisma.ticket.findMany({
    where: {
      assigned_esp_id: techId,
      status: 'CERRADO',
      closed_at: { gte: monthStartUtc }
    },
    select: { closed_at: true }
  })

  // Contar tickets por fecha (en zona horaria Perú)
  const countsByDate = {}
  for (const t of closedThisMonth) {
    const peruDate = new Date(t.closed_at.getTime() + PERU_OFFSET_MS)
    const dateStr = peruDate.toISOString().slice(0, 10)
    countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1
  }

  // Generar array desde día 1 hasta hoy
  const calendar = []
  for (let d = 1; d <= day; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const count = countsByDate[dateStr] || 0
    calendar.push({ date: dateStr, count, met_quota: count >= DAILY_TARGET })
  }

  return {
    daily: { closed: dailyClosed, target: DAILY_TARGET },
    monthly: { closed: monthlyClosed, target: user.monthly_quota || 200 },
    total,
    calendar
  }
}

// ✅ Exportación al final (orden correcto)
module.exports = {
  getTechTickets,
  startRoute,
  goToLocation,
  arrivedAtLocation,
  clientAbsent,
  startExecution,
  submitTechReport,
  getTechPerformance
}