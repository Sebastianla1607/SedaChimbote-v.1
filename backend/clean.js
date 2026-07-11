const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.ticket.updateMany({
    data: { status: 'CERRADO' }
  });
  await prisma.user.updateMany({
    where: { role: 'ESP_' },
    data: { is_wip_locked: false }
  });
  console.log('✅ Tickets cerrados y técnicos liberados');
}
clean();
