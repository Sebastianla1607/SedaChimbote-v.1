const cron = require('node-cron')
const prisma = require('./prisma')

const startCronJobs = () => {

  // Cada día a las 8:00 AM — cambiar tickets vencidos a EXTREMA
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Cron: verificando tickets vencidos...')
    try {
      const updated = await prisma.ticket.updateMany({
        where: {
          status: { notIn: ['CERRADO', 'OBSERVADO'] },
          due_date: { lt: new Date() },
          priority: { not: 'EXTREMA' }
        },
        data: { priority: 'EXTREMA' }
      })
      console.log(`✅ Cron: ${updated.count} tickets actualizados a EXTREMA`)
    } catch (error) {
      console.error('❌ Cron error:', error)
    }
  })

  console.log('✅ Cron jobs iniciados')
}

module.exports = { startCronJobs }