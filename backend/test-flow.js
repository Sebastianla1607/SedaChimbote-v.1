const axios = require('axios')

const API_URL = 'http://localhost:3000/api'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runTest() {
  console.log('🧪 Iniciando testeo completo del flujo del sistema...\n')

  try {
    console.log('🧹 Limpiando tickets activos del técnico ESP001...')
    await prisma.user.updateMany({
      where: { access_code: 'ESP001' },
      data: { is_wip_locked: false }
    })
    const esp = await prisma.user.findFirst({ where: { access_code: 'ESP001' } })
    if (esp) {
      await prisma.ticket.updateMany({
        where: { assigned_esp_id: esp.id, status: { notIn: ['CERRADO', 'OBSERVADO', 'PRE_CERRADO'] } },
        data: { status: 'CERRADO' }
      })
    }
    // 1. Logins
    console.log('1️⃣ Iniciando sesión como Administrador y Técnico...')
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'ADM001',
      password: 'SedaADM0012024!'
    })
    const adminToken = adminLogin.data.token
    
    const techLogin = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'ESP001',
      password: 'SedaESP0012024!'
    })
    const techToken = techLogin.data.token
    const techId = techLogin.data.user.id
    console.log('✅ Logins exitosos')

    // 2. Admin crea ticket
    console.log('\n2️⃣ Admin: Creando ticket interno...')
    const createTicket = await axios.post(`${API_URL}/admin/tickets`, {
      description: 'Fuga de agua masiva en la pista reportada por vecino en llamada.',
      reference_point: 'Frente a la farmacia Inkafarma',
      address: 'Av. Pardo 1024, Chimbote',
      priority: 'ALTA',
      assigned_esp_id: techId,
      specialty_id: 1 // Fugas
    }, { headers: { Authorization: `Bearer ${adminToken}` } })
    const ticketId = createTicket.data.ticket.id
    console.log(`✅ Ticket creado y asignado al técnico (ID: ${ticketId})`)

    // 3. Técnico acepta y va en camino
    console.log('\n3️⃣ Técnico: Aceptando e iniciando camino...')
    await axios.patch(`${API_URL}/tech/tickets/${ticketId}/start`, {}, { headers: { Authorization: `Bearer ${techToken}` } })
    console.log('✅ Técnico aceptó el ticket (Estado: EN_CAMINO)')

    // 4. Técnico llega
    console.log('\n4️⃣ Técnico: Llegando al lugar...')
    await axios.patch(`${API_URL}/tech/tickets/${ticketId}/arrived`, {}, { headers: { Authorization: `Bearer ${techToken}` } })
    console.log('✅ Técnico registró llegada')

    // 5. Técnico inicia ejecución (asumiendo que es interno directo o el admin confirmó)
    console.log('\n5️⃣ Técnico: Iniciando ejecución de trabajo...')
    await axios.patch(`${API_URL}/tech/tickets/${ticketId}/execute`, {}, { headers: { Authorization: `Bearer ${techToken}` } })
    console.log('✅ Técnico inició ejecución (Estado: EJECUCION_ACTIVA)')

    // 6. Técnico finaliza enviando reporte
    console.log('\n6️⃣ Técnico: Enviando reporte final de trabajo...')
    await axios.post(`${API_URL}/tech/tickets/${ticketId}/report`, {
      description: 'Se reemplazó la tubería matriz de 4 pulgadas y se selló con cemento rápido. Fuga controlada.',
      image_urls: ['http://localhost:3000/uploads/reportes/test-image.jpg']
    }, { headers: { Authorization: `Bearer ${techToken}` } })
    console.log('✅ Técnico envió reporte (Estado: PRE_CERRADO)')

    // 7. Admin aprueba cierre
    console.log('\n7️⃣ Admin: Aprobando cierre de ticket...')
    await axios.patch(`${API_URL}/admin/tickets/${ticketId}/approve`, {}, { headers: { Authorization: `Bearer ${adminToken}` } })
    console.log('✅ Admin aprobó el cierre (Estado: CERRADO)')

    console.log('\n🎉 ¡TESTEO FINALIZADO CON ÉXITO! 🎉')
    console.log('El flujo principal funciona perfectamente (Creación -> Asignación -> Camino -> Ejecución -> Reporte -> Aprobación Admin).')

  } catch (error) {
    console.error('\n❌ ERROR EN EL TESTEO:')
    if (error.response) {
      console.error(error.response.data)
    } else {
      console.error(error.message)
    }
  }
}

runTest()
