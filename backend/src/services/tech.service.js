const prisma = require('../utils/prisma')

// Ver tickets asignados al técnico
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

// Aceptar ticket e iniciar ruta
const startRoute = async (techId, ticketId) => {
  const tech = await prisma.user.findUnique({ where: { id: techId } })
  if (tech.is_wip_locked) throw new Error('Ya tienes un ticket activo en curso')

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'ASIGNADO') throw new Error('El ticket no está en estado ASIGNADO')

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'EN_CAMINO' }
  })

  // Bloquear WIP del técnico
  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: true }
  })

  await prisma.ticketLog.create({
    data: {
      ticket_id: ticketId,
      user_id: techId,
      action: 'EN_CAMINO',
      from_status: 'ASIGNADO',
      to_status: 'EN_CAMINO',
      note: 'Técnico en camino a la vivienda'
    }
  })

  // Notificar al cliente
  await prisma.notification.create({
    data: {
      user_id: ticket.created_by_id,
      ticket_id: ticketId,
      message: `El técnico ${tech.access_code} está en camino a tu vivienda para atender tu reclamo ${ticket.code}`
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

  // Notificar al cliente
  await prisma.notification.create({
    data: {
      user_id: ticket.created_by_id,
      ticket_id: ticketId,
      message: `El técnico está afuera de tu vivienda. Por favor, acércate a atenderlo.`
    }
  })

  return { message: 'Cliente notificado, esperando respuesta' }
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

  // Subir evidencia de ausencia
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

  // Liberar WIP del técnico
  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: false }
  })

  return { message: 'Ticket marcado como observado, puedes tomar otro ticket' }
}

// Iniciar ejecución (cliente abrió la puerta)
const startExecution = async (techId, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')

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
      note: 'Cliente en casa, técnico inició ejecución'
    }
  })

  return updated
}

// Técnico envía reporte y solicita pre-cierre
const submitTechReport = async (techId, ticketId, data) => {
  const { description, image_urls } = data

  if (!description) throw new Error('La descripción del reporte es obligatoria')
  if (!image_urls || image_urls.length === 0) throw new Error('Debes subir al menos una foto')

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket no encontrado')
  if (ticket.assigned_esp_id !== techId) throw new Error('Este ticket no te pertenece')
  if (ticket.status !== 'EJECUCION_ACTIVA') throw new Error('El ticket no está en ejecución activa')

  // Guardar reporte técnico
  await prisma.techReport.create({
    data: {
      ticket_id: ticketId,
      tech_id: techId,
      description,
      evidences_urls: image_urls
    }
  })

  // Subir evidencias
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

  // Liberar WIP
  await prisma.user.update({
    where: { id: techId },
    data: { is_wip_locked: false }
  })

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

  // Notificar al administrador
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

module.exports = { getTechTickets, startRoute, arrivedAtLocation, clientAbsent, startExecution, submitTechReport }