const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { fakerES: faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos ultra realistas...')

  // Limpieza inicial
  await prisma.clientSurvey.deleteMany()
  await prisma.techReport.deleteMany()
  await prisma.ticketLog.deleteMany()
  await prisma.evidence.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.userSpecialty.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany({ where: { role: { not: 'ADM_' } } })

  // ========================
  // 1. ESPECIALIDADES
  // ========================
  const specialtiesData = [
    { name: 'Fugas', description: 'Fuga de agua en red interna o externa' },
    { name: 'Medidores', description: 'Daño, robo o cambio de medidor' },
    { name: 'Presión baja', description: 'Baja presión o falta de suministro' },
    { name: 'Calidad del agua', description: 'Turbidez, olor, sabor o color' },
  ]
  await prisma.specialty.createMany({ skipDuplicates: true, data: specialtiesData })
  const specialties = await prisma.specialty.findMany()

  // ========================
  // 2. USUARIOS ADMINISTRATIVOS
  // ========================
  const defaultPassword = await bcrypt.hash('123456', 10)
  
  // Jefe
  await prisma.user.upsert({
    where: { access_code: 'JEF001' }, update: {},
    create: { role: 'JEF_', access_code: 'JEF001', password_hash: await bcrypt.hash('Jefe2024!', 10), first_name: 'Roberto', last_name_pat: 'Sánchez', last_name_mat: 'Torres', phone: '999888777' }
  })

  // Admin
  const admin = await prisma.user.upsert({
    where: { access_code: 'ADM001' }, update: {},
    create: { role: 'ADM_', access_code: 'ADM001', password_hash: await bcrypt.hash('SedaADM0012024!', 10), first_name: 'Carmen', last_name_pat: 'Vargas', last_name_mat: 'Ríos', phone: '945678123' }
  })

  // ========================
  // 3. GENERACIÓN DE TÉCNICOS (20 Técnicos)
  // ========================
  console.log('🔧 Generando 20 técnicos operativos...')
  const techsToCreate = []
  for(let i=1; i<=20; i++) {
    techsToCreate.push({
      role: 'ESP_',
      access_code: `ESP${String(i).padStart(3, '0')}`,
      password_hash: i <= 2 ? await bcrypt.hash(`SedaESP00${i}2024!`, 10) : defaultPassword,
      first_name: faker.person.firstName(),
      last_name_pat: faker.person.lastName(),
      last_name_mat: faker.person.lastName(),
      phone: `9${faker.string.numeric(8)}`,
      is_wip_locked: false // Inicialmente libres
    })
  }
  await prisma.user.createMany({ skipDuplicates: true, data: techsToCreate })
  const allTechs = await prisma.user.findMany({ where: { role: 'ESP_' } })
  
  // Asignar 2 especialidades al azar a cada técnico
  const techSpecs = []
  for (const tech of allTechs) {
    const shuffled = [...specialties].sort(() => 0.5 - Math.random())
    techSpecs.push({ user_id: tech.id, specialty_id: shuffled[0].id })
    techSpecs.push({ user_id: tech.id, specialty_id: shuffled[1].id })
  }
  await prisma.userSpecialty.createMany({ skipDuplicates: true, data: techSpecs })

  // ========================
  // 4. GENERACIÓN DE CLIENTES (150 Clientes)
  // ========================
  console.log('👥 Generando 150 clientes...')
  const customersToCreate = []
  for (let i = 1; i <= 150; i++) {
    const lat = -9.0745 + (Math.random() - 0.5) * 0.05
    const lng = -78.5936 + (Math.random() - 0.5) * 0.05
    customersToCreate.push({
      supply_code: `SUM-${String(i).padStart(4, '0')}`,
      reference_amount: faker.number.float({ min: 20, max: 200, multipleOf: 0.1 }),
      doc_type: 'DNI', doc_number: faker.string.numeric(8),
      first_name: faker.person.firstName(), last_name_pat: faker.person.lastName(), last_name_mat: faker.person.lastName(),
      address: faker.location.streetAddress() + ', Chimbote', latitude: lat, longitude: lng,
      phone: `9${faker.string.numeric(8)}`, email: `cli_${i}@example.com`
    })
  }
  await prisma.customer.createMany({ skipDuplicates: true, data: customersToCreate })
  const allCustomers = await prisma.customer.findMany()
  
  const usersToCreate = allCustomers.map(c => ({
    role: 'CLI_', email: c.email, password_hash: defaultPassword,
    first_name: c.first_name, last_name_pat: c.last_name_pat, last_name_mat: c.last_name_mat,
    phone: c.phone, customer_id: c.id
  }))
  await prisma.user.createMany({ skipDuplicates: true, data: usersToCreate })
  const allClients = await prisma.user.findMany({ where: { role: 'CLI_' } })

  // ========================
  // 5. GENERACIÓN DE TICKETS REALISTAS (500 Tickets)
  // ========================
  console.log('🎫 Generando 500 tickets con distribuciones realistas...')
  
  const priorityPool = ['BAJA', 'MEDIA', 'ALTA', 'EXTREMA']
  const ticketsData = []
  
  // Distribución objetivo:
  // 400 Cerrados (Históricos)
  // 60 Pendientes (Sin asignar)
  // 25 Asignados (Esperando técnico)
  // 10 Ejecución activa / En camino (Bloquea el WIP del técnico)
  // 5 Observados / Pre_Cerrado (Esperando validación)

  const distribution = [
    ...Array(400).fill('CERRADO'),
    ...Array(60).fill('PENDIENTE'),
    ...Array(25).fill('ASIGNADO'),
    ...Array(5).fill('EN_CAMINO'),
    ...Array(5).fill('EJECUCION_ACTIVA'),
    ...Array(3).fill('PRE_CERRADO'),
    ...Array(2).fill('OBSERVADO')
  ]
  
  // Barajar distribución
  distribution.sort(() => 0.5 - Math.random())

  const lockedTechs = new Set() // Para trackear WIP
  
  for (let i = 0; i < 500; i++) {
    const client = faker.helpers.arrayElement(allClients)
    const spec = faker.helpers.arrayElement(specialties)
    const status = distribution[i]
    
    // Fechas lógicas: si está cerrado, fue hace días/meses. Si está activo, es muy reciente.
    let created_at = new Date()
    if (status === 'CERRADO') {
      created_at = faker.date.recent({ days: 180 })
    } else {
      created_at = faker.date.recent({ days: 3 })
    }

    const dateStr = created_at.toISOString().slice(0, 10).replace(/-/g, '')
    const code = `REC-${dateStr}-${String(i+1).padStart(4, '0')}`

    let assigned_esp_id = null
    let closed_by_id = null
    let closed_at = null
    
    if (status !== 'PENDIENTE') {
      // Necesita un técnico.
      // Si el estado es activo (EN_CAMINO o EJECUCION_ACTIVA), el técnico debe bloquearse (WIP).
      const availableTechs = allTechs.filter(t => !lockedTechs.has(t.id))
      const tech = faker.helpers.arrayElement(availableTechs) || allTechs[0]
      assigned_esp_id = tech.id
      
      if (['EN_CAMINO', 'EJECUCION_ACTIVA'].includes(status)) {
        lockedTechs.add(tech.id) // Bloquear el WIP
      }
    }

    if (status === 'CERRADO') {
      closed_by_id = admin.id
      closed_at = new Date(created_at.getTime() + faker.number.int({ min: 1, max: 48 }) * 3600000) // 1 a 48 horas después
    }

    ticketsData.push({
      code, origin: 'CIUDADANO', description: faker.lorem.paragraph(),
      reference_point: faker.location.secondaryAddress(),
      address: client.customer?.address, latitude: client.customer?.latitude, longitude: client.customer?.longitude,
      status, priority: faker.helpers.arrayElement(priorityPool),
      created_at, due_date: new Date(created_at.getTime() + 30 * 24 * 60 * 60 * 1000), closed_at,
      ai_category: spec.name, specialty_id: spec.id, created_by_id: client.id, assigned_esp_id, closed_by_id
    })
  }

  await prisma.ticket.createMany({ data: ticketsData })
  
  // Actualizar el estado is_wip_locked en Prisma para los técnicos bloqueados
  for (const techId of Array.from(lockedTechs)) {
    await prisma.user.update({ where: { id: techId }, data: { is_wip_locked: true } })
  }

  const createdTickets = await prisma.ticket.findMany({ select: { id: true, status: true, created_at: true, closed_at: true, created_by_id: true, assigned_esp_id: true }})

  console.log('📝 Generando Logs coherentes con la nueva distribución...')
  const logs = []
  const reports = []
  const surveys = []
  
  for (const t of createdTickets) {
    logs.push({ ticket_id: t.id, user_id: t.created_by_id, action: 'CREADO', to_status: 'PENDIENTE', note: 'Ticket reportado', created_at: t.created_at })
    
    if (t.assigned_esp_id) {
      const assignDate = new Date(t.created_at.getTime() + 15 * 60000) // 15 mins después
      logs.push({ ticket_id: t.id, user_id: admin.id, action: 'ASIGNADO', from_status: 'PENDIENTE', to_status: 'ASIGNADO', note: 'Asignado', created_at: assignDate })
      
      if (['EN_CAMINO', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'OBSERVADO', 'CERRADO'].includes(t.status)) {
         logs.push({ ticket_id: t.id, user_id: t.assigned_esp_id, action: 'EN_CAMINO', from_status: 'ASIGNADO', to_status: 'EN_CAMINO', note: 'Técnico desplazándose', created_at: new Date(assignDate.getTime() + 15 * 60000) })
      }
      
      if (['EJECUCION_ACTIVA', 'PRE_CERRADO', 'OBSERVADO', 'CERRADO'].includes(t.status)) {
         logs.push({ ticket_id: t.id, user_id: t.assigned_esp_id, action: 'EJECUCION_ACTIVA', from_status: 'EN_CAMINO', to_status: 'EJECUCION_ACTIVA', note: 'Iniciando reparación', created_at: new Date(assignDate.getTime() + 45 * 60000) })
      }
      
      if (['PRE_CERRADO', 'OBSERVADO', 'CERRADO'].includes(t.status)) {
        const preCloseDate = new Date(assignDate.getTime() + 120 * 60000)
        logs.push({ ticket_id: t.id, user_id: t.assigned_esp_id, action: 'PRE_CERRADO', from_status: 'EJECUCION_ACTIVA', to_status: 'PRE_CERRADO', note: 'Trabajo finalizado', created_at: preCloseDate })
        reports.push({ ticket_id: t.id, tech_id: t.assigned_esp_id, description: `Reparación completada. ${faker.lorem.paragraph()}`, evidences_urls: [] })
      }

      if (t.status === 'OBSERVADO') {
         logs.push({ ticket_id: t.id, user_id: admin.id, action: 'RECHAZADO', from_status: 'PRE_CERRADO', to_status: 'OBSERVADO', note: 'Faltan evidencias', created_at: new Date(assignDate.getTime() + 180 * 60000) })
      }
      
      if (t.status === 'CERRADO') {
         logs.push({ ticket_id: t.id, user_id: admin.id, action: 'CERRADO', from_status: 'PRE_CERRADO', to_status: 'CERRADO', note: 'Cierre conforme', created_at: t.closed_at })
         if (Math.random() > 0.4) {
           surveys.push({ ticket_id: t.id, nps_score: faker.number.int({ min: 3, max: 5 }), comment: faker.lorem.sentence() })
         }
      }
    }
  }

  const chunkSize = 2000
  for (let i = 0; i < logs.length; i += chunkSize) {
    await prisma.ticketLog.createMany({ data: logs.slice(i, i + chunkSize) })
  }
  if (reports.length > 0) await prisma.techReport.createMany({ data: reports })
  if (surveys.length > 0) await prisma.clientSurvey.createMany({ data: surveys })

  console.log('✅ ¡Población de datos ultra realista completada!')
  console.log('📊 Resumen de estado:')
  console.log(`  - 20 Técnicos (Aprox ${lockedTechs.size} ocupados actualmente WIP)`)
  console.log(`  - 150 Clientes (Pass: 123456)`)
  console.log(`  - 500 Tickets (400 cerrados, 100 activos)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })