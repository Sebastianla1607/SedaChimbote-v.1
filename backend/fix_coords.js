const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tickets = await prisma.ticket.findMany()
  console.log(`Fixing coordinates for ${tickets.length} tickets to be strictly inland Chimbote...`)
  
  // Bounding box terrestre de Chimbote (Tierra firme):
  // Lat: entre -9.10 y -9.06
  // Lng: entre -78.57 y -78.53 (Hacia el este para evitar el mar)
  
  for (const t of tickets) {
    const lat = -9.1000 + (Math.random() * 0.04) // -9.100 a -9.060
    const lng = -78.5700 + (Math.random() * 0.04) // -78.570 a -78.530
    
    await prisma.ticket.update({
      where: { id: t.id },
      data: { latitude: lat, longitude: lng }
    })
  }
  console.log('Done fixing coordinates!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
