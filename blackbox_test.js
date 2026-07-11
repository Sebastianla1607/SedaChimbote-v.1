const API_URL = 'http://localhost:3000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

async function runTests() {
  try {
    console.log('🚀 Iniciando pruebas de Caja Negra (Black Box Testing)...\n');

    // 1. LOGIN ADMIN
    console.log('1️⃣ Iniciando sesión como Administrador...');
    const adminRes = await fetchAPI('/auth/login', 'POST', {
      identifier: 'ADM001',
      password: 'SedaADM0012024!'
    });
    const adminToken = adminRes.token;
    console.log('✅ Admin logueado correctamente.');

    // 2. CREATE AND LOGIN CITIZEN
    console.log('\\n2️⃣ Registrando y logueando un Ciudadano 100% fresco...');
    const testEmail = `blackbox_${Date.now()}@example.com`;
    // We can just use Prisma to create the user directly to bypass validation for tests,
    // or just use cli_50 and clean it. Let's just use cli_200. Wait, there are only 150 clients.
    
    // We will just fetch cli_149, because we are running clean.js anyway
    const citizenRes = await fetchAPI('/auth/login', 'POST', {
      identifier: 'cli_149@example.com',
      password: '123456'
    });
    const citizenToken = citizenRes.token;
    console.log('✅ Ciudadano logueado correctamente.');

    // 3. CITIZEN CREATES TICKET
    console.log('\n3️⃣ Ciudadano creando un nuevo ticket...');
    const ticketRes = await fetchAPI('/tickets', 'POST', {
      description: 'Fuga de agua masiva en la calle principal (Test Caja Negra)',
      address: 'Av. Test 123',
      lat: -9.07,
      lng: -78.59,
      images: ['test_image.jpg']
    }, citizenToken);
    const newTicketId = ticketRes.ticket.id;
    console.log(`✅ Ticket creado exitosamente. ID: ${newTicketId}, Code: ${ticketRes.ticket.code}`);

    // 4. ADMIN ASSIGNS TICKET
    console.log('\n4️⃣ Administrador buscando técnico libre y asignando el ticket...');
    const techsData = await fetchAPI('/users?role=ESP_', 'GET', null, adminToken);
    const tech = techsData.users.find(t => !t.is_wip_locked);
    if (!tech) throw new Error('No hay técnicos disponibles (todos en WIP)');
    
    await fetchAPI(`/admin/tickets/${newTicketId}/assign`, 'PATCH', {
      esp_id: tech.id,
      priority: 'ALTA'
    }, adminToken);
    console.log(`✅ Ticket asignado al Técnico ${tech.access_code}.`);

    // 5. LOGIN TECH
    console.log('\n5️⃣ Iniciando sesión como Técnico...');
    // Dependiendo del técnico seleccionado, el seed establece contraseñas distintas
    const techPassword = (tech.access_code === 'ESP001' || tech.access_code === 'ESP002') 
                          ? `Seda${tech.access_code}2024!` 
                          : '123456';
    const techRes = await fetchAPI('/auth/login', 'POST', {
      identifier: tech.access_code,
      password: techPassword
    });
    const techToken = techRes.token;
    console.log('✅ Técnico logueado correctamente.');

    // 6. TECH SUBMITS REPORT
    console.log('\n6️⃣ Técnico acepta, viaja, llega e inicia ejecución...');
    await fetchAPI(`/tech/tickets/${newTicketId}/start`, 'PATCH', {}, techToken);
    await fetchAPI(`/tech/tickets/${newTicketId}/go`, 'PATCH', {}, techToken);
    await fetchAPI(`/tech/tickets/${newTicketId}/arrived`, 'PATCH', {}, techToken);
    await fetchAPI(`/tech/tickets/${newTicketId}/execute`, 'PATCH', {}, techToken);
    
    // 6.5 CITIZEN CONFORMITY
    console.log('\n6.5️⃣ Ciudadano firma la conformidad del trabajo...');
    await fetchAPI(`/tickets/${newTicketId}/conformity`, 'POST', { conform: true }, citizenToken);

    console.log('\n7️⃣ Técnico envía reporte...');
    await fetchAPI(`/tech/tickets/${newTicketId}/report`, 'POST', {
      description: 'Se cambió la tubería principal y se selló la fuga con éxito.',
      image_urls: ['reparacion1.jpg']
    }, techToken);
    console.log('✅ Reporte enviado y ticket en estado PRE-CERRADO.');

    // 7. ADMIN APPROVES TICKET
    console.log('\n7️⃣ Administrador revisa y aprueba (Cierra) el ticket...');
    await fetchAPI(`/admin/tickets/${newTicketId}/approve`, 'PATCH', {}, adminToken);
    console.log('✅ Ticket CERRADO oficialmente.');

    // 8. CITIZEN CHECKS TICKET
    console.log('\n8️⃣ Ciudadano verifica el estado del ticket...');
    const citizenTickets = await fetchAPI('/tickets/my-tickets', 'GET', null, citizenToken);
    const verifiedTicket = citizenTickets.tickets.find(t => t.id === newTicketId);
    if (verifiedTicket.status === 'CERRADO') {
      console.log('✅ Ciudadano confirma que el estado es CERRADO.');
    } else {
      throw new Error(`Estado incorrecto: ${verifiedTicket.status}`);
    }

    console.log('\n🎉 TODAS LAS PRUEBAS DE CAJA NEGRA PASARON EXITOSAMENTE. EL FLUJO ESTÁ INTACTO.');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
  }
}

runTests();
